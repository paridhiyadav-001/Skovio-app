require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skovio')
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch((err) => console.log('⚠️ MongoDB Connection Note:', err.message));

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Stores
const otpStore = {};
const localUsersStore = {};
const resendTracker = {};

// Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper Function: Send OTP
const handleSendOtp = async (email, fullName, res, subjectText) => {
    const formattedEmail = email.toLowerCase().trim();
    const currentTime = Date.now();
    const userTrack = resendTracker[formattedEmail] || { count: 0, lastSent: 0 };

    if (currentTime - userTrack.lastSent < 60000) {
        const remainingSec = Math.ceil((60000 - (currentTime - userTrack.lastSent)) / 1000);
        return res.status(429).json({ 
            success: false, 
            message: `Please wait ${remainingSec} seconds before requesting a new OTP.` 
        });
    }

    if (userTrack.count >= 3) {
        return res.status(429).json({ 
            success: false, 
            message: 'Maximum OTP resend limit reached. Please try again later.' 
        });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[formattedEmail] = generatedOtp;

    resendTracker[formattedEmail] = {
        count: userTrack.count + 1,
        lastSent: currentTime
    };

    console.log(`\n🔑 OTP FOR ${formattedEmail}: ${generatedOtp} (Attempt ${userTrack.count + 1}/3)\n`);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: formattedEmail,
        subject: subjectText,
        text: `Hello ${fullName || 'User'},\n\nYour OTP is: ${generatedOtp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ 
            success: true, 
            message: `OTP sent successfully!` 
        });
    } catch (error) {
        console.error('⚠️ Email Error:', error.message);
        return res.status(200).json({ 
            success: true, 
            message: 'OTP generated! Check terminal or email.' 
        });
    }
};

// 1. REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    localUsersStore[cleanEmail] = { fullName, email: cleanEmail, password: password.trim() };
    await handleSendOtp(cleanEmail, fullName, res, 'Your Registration OTP - Skovio');
});

// 2. RESEND OTP ROUTE
app.post('/api/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const cleanEmail = email.toLowerCase().trim();
    const fullName = localUsersStore[cleanEmail]?.fullName || 'User';
    await handleSendOtp(cleanEmail, fullName, res, 'Resent OTP - Skovio');
});

// 3. FORGOT PASSWORD ROUTE
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const cleanEmail = email.toLowerCase().trim();
    await handleSendOtp(cleanEmail, 'User', res, 'Password Reset OTP - Skovio');
});

// 4. VERIFY OTP ROUTE
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const cleanEmail = email.toLowerCase().trim();

    if (otpStore[cleanEmail] && otpStore[cleanEmail] === otp.toString().trim()) {
        delete otpStore[cleanEmail];
        delete resendTracker[cleanEmail];

        const tempUser = localUsersStore[cleanEmail];
        if (tempUser) {
            try {
                await User.findOneAndUpdate(
                    { email: cleanEmail },
                    { fullName: tempUser.fullName, email: cleanEmail, password: tempUser.password, isVerified: true },
                    { upsert: true, new: true }
                );
            } catch (dbErr) {
                console.log('Saved in local memory store.');
            }
        }
        return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ success: false, message: 'Invalid OTP!' });
    }
});

// 5. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    let existingUser = await User.findOne({ email: cleanEmail });
    
    if (!existingUser && localUsersStore[cleanEmail]) {
        existingUser = localUsersStore[cleanEmail];
    }

    if (existingUser && existingUser.password === cleanPassword) {
        return res.status(200).json({ 
            success: true, 
            message: 'Login successful!',
            user: { email: existingUser.email, fullName: existingUser.fullName }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// 6. RESET PASSWORD ROUTE (Guaranteed Password Sync)
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword, password } = req.body;
    const rawPassword = newPassword || password;

    if (!email || !rawPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = rawPassword.trim();

    try {
        // Update DB
        const updatedUser = await User.findOneAndUpdate(
            { email: cleanEmail }, 
            { password: cleanPassword },
            { new: true }
        );

        // Update Local Store
        if (localUsersStore[cleanEmail]) {
            localUsersStore[cleanEmail].password = cleanPassword;
        }

        console.log(`✅ Password updated successfully for: ${cleanEmail}`);
        return res.status(200).json({ success: true, message: 'Password reset successfully!' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

// Handlers
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
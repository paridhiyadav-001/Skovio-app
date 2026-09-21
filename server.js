require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Root Health Check Route
app.get('/', (req, res) => {
    res.status(200).send('✅ Skovio Backend is Active');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skovio')
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch((err) => console.log('⚠️ MongoDB Connection Note:', err.message));

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper Function: Send OTP
const handleSendOtp = async (email, fullName, res, subjectText, userDoc) => {
    const formattedEmail = email.toLowerCase().trim();
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Min Expiry

    console.log(`\n🔑 OTP FOR ${formattedEmail}: ${generatedOtp}\n`);

    // Save OTP to DB directly
    if (userDoc) {
        userDoc.otp = generatedOtp;
        userDoc.otpExpires = otpExpires;
        await userDoc.save();
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: formattedEmail,
        subject: subjectText,
        text: `Hello ${fullName || 'User'},\n\nYour OTP is: ${generatedOtp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('⚠️ Email Error:', error.message);
        return res.status(200).json({ success: true, message: 'OTP generated in backend logs.' });
    }
};

// 1. REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();

    try {
        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
            user = new User({ fullName, email: cleanEmail, password: password.trim() });
        } else {
            user.fullName = fullName;
            user.password = password.trim();
        }
        await user.save();
        await handleSendOtp(cleanEmail, fullName, res, 'Your Registration OTP - Skovio', user);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 2. RESEND OTP ROUTE
app.post('/api/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const cleanEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await handleSendOtp(cleanEmail, user.fullName, res, 'Resent OTP - Skovio', user);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 3. FORGOT PASSWORD ROUTE
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const cleanEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await handleSendOtp(cleanEmail, user.fullName, res, 'Password Reset OTP - Skovio', user);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 4. VERIFY OTP ROUTE
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const cleanEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: cleanEmail });
        if (user && user.otp === otp.toString().trim() && user.otpExpires > new Date()) {
            user.isVerified = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP!' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 5. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
        const user = await User.findOne({ email: cleanEmail });
        if (user && user.password === cleanPassword) {
            return res.status(200).json({
                success: true,
                message: 'Login successful!',
                user: { email: user.email, fullName: user.fullName }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 6. RESET PASSWORD ROUTE
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword, password } = req.body;
    const rawPassword = newPassword || password;

    if (!email || !rawPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.password = rawPassword.trim();
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
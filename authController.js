const User = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('./sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
    try {
        console.log("--> Register endpoint hit. Request received:", req.body);
        const { fullName, email, password, confirmPassword } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        if (user && !user.isVerified) {
            user.fullName = fullName;
            user.password = hashedPassword;
            user.otp = hashedOtp;
            user.otpExpires = otpExpires;
            user.otpLastSent = new Date();
            user.otpRequestCount = 1;
            await user.save();
        } else {
            user = new User({
                fullName,
                email,
                password: hashedPassword,
                otp: hashedOtp,
                otpExpires,
                otpLastSent: new Date(),
                otpRequestCount: 1
            });
            await user.save();
        }

        console.log("--------------------------------------------------");
        console.log(`🔑 GENERATED OTP FOR ${email}: [ ${otp} ]`);
        console.log("--------------------------------------------------");

        try {
            await sendEmail(email, 'Your Account Verification OTP', `Your OTP is: ${otp}. Valid for 5 minutes.`);
            console.log("OTP Email Sent Successfully!");
        } catch (emailErr) {
            console.error("⚠️ SMTP EMAIL FAILED TO SEND:", emailErr.message);
            console.log("👉 Development Bypass Active: Use the OTP printed in terminal above to verify.");
        }

        res.status(200).json({ 
            success: true, 
            message: 'OTP generated successfully! Check your email or terminal logs.' 
        });
    } catch (err) {
        console.error("❌ REGISTER ERROR DETAILED LOG:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'Account is already verified' });
        if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }
        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Account verified successfully. You can now login.' });
    } catch (err) {
        console.error("❌ VERIFY OTP ERROR:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'Account is already verified' });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (user.otpLastSent && user.otpLastSent > oneHourAgo && user.otpRequestCount >= 3) {
            return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again after an hour.' });
        }

        const otp = generateOTP();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        if (user.otpLastSent && user.otpLastSent < oneHourAgo) {
            user.otpRequestCount = 1;
        } else {
            user.otpRequestCount += 1;
        }
        user.otpLastSent = new Date();

        await user.save();

        console.log("--------------------------------------------------");
        console.log(`🔑 RESENT OTP FOR ${email}: [ ${otp} ]`);
        console.log("--------------------------------------------------");
        
        try {
            await sendEmail(email, 'Resent OTP Verification', `Your new OTP is: ${otp}. Valid for 5 minutes.`);
        } catch (emailErr) {
            console.error("⚠️ RESEND EMAIL FAILED:", emailErr.message);
        }

        res.status(200).json({ success: true, message: 'New OTP generated successfully' });
    } catch (err) {
        console.error("❌ RESEND OTP ERROR:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Account not verified. Please verify your email first.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid email or password' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email }
        });
    } catch (err) {
        console.error("❌ LOGIN ERROR:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const otp = generateOTP();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        console.log("--------------------------------------------------");
        console.log(`🔑 FORGOT PASSWORD OTP FOR ${email}: [ ${otp} ]`);
        console.log("--------------------------------------------------");

        try {
            await sendEmail(email, 'Password Reset OTP', `Your OTP to reset password is: ${otp}. Valid for 5 minutes.`);
        } catch (emailErr) {
            console.error("⚠️ FORGOT PASSWORD EMAIL FAILED:", emailErr.message);
        }

        res.status(200).json({ success: true, message: 'Reset OTP generated' });
    } catch (err) {
        console.error("❌ FORGOT PASSWORD ERROR:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error("❌ RESET PASSWORD ERROR:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
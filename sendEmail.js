const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 5000, // 5 seconds me fail-safe timeout
            greetingTimeout: 5000,
            socketTimeout: 5000
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Nodemailer Transport Error:", error.message);
        throw new Error(error.message);
    }
};

module.exports = sendEmail;
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyOTP, resendOTP } from '../api';

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await verifyOTP({ email, otp });
            toast.success(res.data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const res = await resendOTP({ email });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Resend failed");
        }
    };

    return (
        <div className="card">
            <h2>Verify Email</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
                OTP sent to <b>{email}</b>
            </p>
            <form onSubmit={handleVerify}>
                <div className="form-group">
                    <label>Enter 6-Digit OTP</label>
                    <input type="text" maxLength="6" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>
                Didn't receive code? <span onClick={handleResend} className="link">Resend OTP</span>
            </p>
        </div>
    );
};

export default VerifyOTP;
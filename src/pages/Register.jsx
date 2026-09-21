import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../api';

const Register = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Password validation state
    const password = formData.password;
    const rules = {
        length: password.length >= 8,
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isPasswordValid = rules.length && rules.number && rules.special;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPasswordValid) {
            return toast.error("Please meet all password requirements!");
        }
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match!");
        }
        setLoading(true);
        try {
            const res = await registerUser(formData);
            toast.success(res.data.message);
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Top Branding Header */}
            <div className="auth-header">
                <div className="auth-logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <div className="auth-brand">Skovio Portal</div>
            </div>

            <div className="card">
                <h2 className="card-title">Create an account</h2>
                <p className="card-subtitle">Start your 14-day free trial, no credit card required.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="Paridhi Yadav" />
                    </div>

                    <div className="form-group">
                        <label>Work Email</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="name@company.com" />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
                        
                        {/* Live Official Password Requirements Checklist */}
                        <div className="rules-list">
                            <div className={`rule-item ${rules.length ? 'valid' : ''}`}>
                                <span className="rule-dot"></span> Minimum 8 characters
                            </div>
                            <div className={`rule-item ${rules.number ? 'valid' : ''}`}>
                                <span className="rule-dot"></span> At least 1 number (0-9)
                            </div>
                            <div className={`rule-item ${rules.special ? 'valid' : ''}`}>
                                <span className="rule-dot"></span> At least 1 special character (!@#$)
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="link-text">
                    Already have an account? <Link to="/login" className="link">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
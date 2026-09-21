import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // Navigation View State: 'register' | 'otp' | 'login' | 'forgot' | 'reset-otp' | 'new-password' | 'dashboard'
  const [currentView, setCurrentView] = useState('register');
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Forgot Password / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  const firstOtpRef = useRef(null);

  // Dynamic Password Validation (Registration)
  const isLengthValid = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
  const isMatch = formData.password !== '' && formData.password === formData.confirmPassword;

  // Dynamic Password Validation (Reset Password)
  const isResetLengthValid = resetPasswordData.password.length >= 8;
  const hasResetNumber = /\d/.test(resetPasswordData.password);
  const hasResetSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(resetPasswordData.password);
  const isResetMatch = resetPasswordData.password !== '' && resetPasswordData.password === resetPasswordData.confirmPassword;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateRegisterForm();
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateRegisterForm = () => {
    let errs = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) errs.fullName = "Full Name is required.";
    if (!formData.email.trim() || !emailPattern.test(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!isLengthValid || !hasNumber || !hasSpecial) {
      errs.password = "Password does not meet required rules.";
    }
    if (!isMatch) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 1. REGISTER API INTEGRATION
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (validateRegisterForm()) {
      setLoading(true);
      try {
       // App.jsx (line 85 ke paas)
const response = await fetch('http://127.0.0.1:5000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: formData.fullName,
    email: formData.email,
    password: formData.password
  })
});

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
          setOtp(['', '', '', '', '', '']);
          setCurrentView('otp');
        } else {
          alert(data.message || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Backend server running nahi hai ya connection error hai!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  // Auto OTP Verification Listener
  useEffect(() => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 6) {
      if (currentView === 'otp') {
        handleOtpVerify(enteredOtp);
      } else if (currentView === 'reset-otp') {
        handleResetOtpVerify(enteredOtp);
      }
    }
  }, [otp]);

  useEffect(() => {
    if ((currentView === 'otp' || currentView === 'reset-otp') && firstOtpRef.current) {
      firstOtpRef.current.focus();
    }
  }, [currentView]);

  // 2. REGISTER OTP VERIFICATION API INTEGRATION
  const handleOtpVerify = async (code) => {
    if (code.length === 6) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            otp: code
          })
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
          setIsFirstLogin(true);
          setCurrentView('dashboard');
        } else {
          alert(data.message || 'Invalid or Expired OTP');
        }
      } catch (err) {
        console.error(err);
        alert('OTP Verification me error aaya!');
      } finally {
        setLoading(false);
      }
    }
  };

  // 3. RESET PASSWORD OTP VERIFICATION (Backend Logic)
  const handleResetOtpVerify = async (code) => {
    if (code.length === 6) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: forgotEmail,
            otp: code
          })
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
          setOtp(['', '', '', '', '', '']);
          setCurrentView('new-password');
        } else {
          alert(data.message || 'Invalid OTP');
        }
      } catch (err) {
        console.error(err);
        alert('OTP Verification error!');
      } finally {
        setLoading(false);
      }
    }
  };

  // 4. LOGIN API INTEGRATION
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok && (data.success || data.token || data.user)) {
          setIsFirstLogin(false);
          setCurrentView('dashboard');
        } else {
          alert(data.message || 'Invalid Email or Password');
        }
      } catch (err) {
        console.error(err);
        alert('Login request failed! Check server connection.');
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter valid login credentials.");
    }
  };

  // 5. FORGOT PASSWORD API INTEGRATION
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (forgotEmail.trim()) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail })
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
          setOtp(['', '', '', '', '', '']);
          setCurrentView('reset-otp');
        } else {
          alert(data.message || 'Failed to send OTP');
        }
      } catch (err) {
        console.error(err);
        alert('Error sending forgot password request!');
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter your registered email address.");
    }
  };

  // 6. RESET NEW PASSWORD API INTEGRATION
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isResetLengthValid && hasResetNumber && hasResetSpecial && isResetMatch) {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: forgotEmail,
            newPassword: resetPasswordData.password
          })
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
          alert("Password updated successfully! Please Sign In with your new password.");
          setLoginData({ email: forgotEmail, password: '' });
          setCurrentView('login');
        } else {
          alert(data.message || 'Failed to reset password');
        }
      } catch (err) {
        console.error(err);
        alert('Error resetting password!');
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please fulfill all password requirements.");
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Top Header Branding (Auth Pages Only) */}
      {currentView !== 'dashboard' && (
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div className="auth-brand">Skovio</div>
          </div>

          {/* VIEW 1: REGISTRATION */}
          {currentView === 'register' && (
            <div className="card">
              <h2 className="card-title">Create Account</h2>
              <p className="card-subtitle">Enter your credentials to register.</p>

              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className={touched.fullName && errors.fullName ? 'error-field' : ''}
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleRegisterChange}
                    onBlur={() => handleBlur('fullName')}
                  />
                  {touched.fullName && errors.fullName && <div className="error-msg">{errors.fullName}</div>}
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className={touched.email && errors.email ? 'error-field' : ''}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleRegisterChange}
                    onBlur={() => handleBlur('email')}
                  />
                  {touched.email && errors.email && <div className="error-msg">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={touched.confirmPassword && errors.confirmPassword ? 'error-field' : ''}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleRegisterChange}
                    onBlur={() => handleBlur('confirmPassword')}
                  />
                  {touched.confirmPassword && errors.confirmPassword && <div className="error-msg">{errors.confirmPassword}</div>}
                </div>

                <div className="rules-list">
                  <div className={`rule-item ${isLengthValid ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> Minimum 8 characters
                  </div>
                  <div className={`rule-item ${hasNumber ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> At least 1 number (0-9)
                  </div>
                  <div className={`rule-item ${hasSpecial ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> At least 1 special character (!@#$)
                  </div>
                  <div className={`rule-item ${isMatch ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> Passwords match
                  </div>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="link-text">
                Already registered?{' '}
                <button className="link" type="button" onClick={() => setCurrentView('login')}>
                  Sign In
                </button>
              </p>
            </div>
          )}

          {/* VIEW 2: REGISTRATION OTP VERIFICATION */}
          {currentView === 'otp' && (
            <div className="card">
              <h2 className="card-title">Verify Email</h2>
              <p className="card-subtitle">
                Enter the 6-digit OTP sent to <strong>{formData.email || 'your email'}</strong>
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(otp.join('')); }}>
                <div className="otp-container">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      ref={index === 0 ? firstOtpRef : null}
                      type="text"
                      maxLength="1"
                      className="otp-field"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>

              <p className="link-text">
                Didn't receive code?{' '}
                <button className="link" type="button" onClick={() => handleRegisterSubmit({ preventDefault: () => {} })}>
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {/* VIEW 3: SIGN IN (LOGIN) */}
          {currentView === 'login' && (
            <div className="card">
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Sign in to your Skovio account.</p>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Password</label>
                    <button 
                      type="button" 
                      className="link" 
                      style={{ fontSize: '0.75rem', marginBottom: '0.375rem' }}
                      onClick={() => setCurrentView('forgot')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <p className="link-text">
                Don't have an account?{' '}
                <button className="link" type="button" onClick={() => setCurrentView('register')}>
                  Create Account
                </button>
              </p>
            </div>
          )}

          {/* VIEW 4: FORGOT PASSWORD (EMAIL INPUT) */}
          {currentView === 'forgot' && (
            <div className="card">
              <h2 className="card-title">Reset Password</h2>
              <p className="card-subtitle">Enter your registered email to receive a password reset OTP.</p>

              <form onSubmit={handleForgotSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                </button>
              </form>

              <p className="link-text">
                Remember your password?{' '}
                <button className="link" type="button" onClick={() => setCurrentView('login')}>
                  Sign In
                </button>
              </p>
            </div>
          )}

          {/* VIEW 5: RESET PASSWORD OTP */}
          {currentView === 'reset-otp' && (
            <div className="card">
              <h2 className="card-title">Password Reset OTP</h2>
              <p className="card-subtitle">
                Enter the 6-digit OTP sent to <strong>{forgotEmail || 'your email'}</strong>
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleResetOtpVerify(otp.join('')); }}>
                <div className="otp-container">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      ref={index === 0 ? firstOtpRef : null}
                      type="text"
                      maxLength="1"
                      className="otp-field"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <p className="link-text">
                Back to{' '}
                <button className="link" type="button" onClick={() => setCurrentView('login')}>
                  Sign In
                </button>
              </p>
            </div>
          )}

          {/* VIEW 6: NEW PASSWORD SETUP */}
          {currentView === 'new-password' && (
            <div className="card">
              <h2 className="card-title">Set New Password</h2>
              <p className="card-subtitle">Create a new secure password for your account.</p>

              <form onSubmit={handleNewPasswordSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={resetPasswordData.password}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="rules-list">
                  <div className={`rule-item ${isResetLengthValid ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> Minimum 8 characters
                  </div>
                  <div className={`rule-item ${hasResetNumber ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> At least 1 number (0-9)
                  </div>
                  <div className={`rule-item ${hasResetSpecial ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> At least 1 special character (!@#$)
                  </div>
                  <div className={`rule-item ${isResetMatch ? 'valid' : ''}`}>
                    <span className="rule-dot"></span> Passwords match
                  </div>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* VIEW 7: ENTERPRISE DASHBOARD */}
      {currentView === 'dashboard' && (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Top Navbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="auth-logo" style={{ margin: 0, width: '38px', height: '38px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>Skovio Console</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                {formData.fullName || loginData.email.split('@')[0] || 'User'}
              </span>
              <button 
                onClick={() => setCurrentView('login')}
                style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8125rem', background: '#ef4444', marginTop: 0 }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Greeting Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#ffffff',
            padding: '1.75rem 2rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.3)'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {isFirstLogin ? `Welcome, ${formData.fullName || 'User'}!` : `Welcome back, ${formData.fullName || loginData.email.split('@')[0] || 'User'}!`}
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Your email authentication and session are active. Here is your system overview.
            </p>
          </div>

          {/* System Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>ACCOUNT DETAILS</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
                {formData.fullName || 'User Profile'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                {formData.email || loginData.email || 'user@domain.com'}
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '0.25rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginTop: '0.85rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                Email Verified
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>SECURITY STATUS</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>2FA Authenticated</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>OTP Session active</p>
              <div style={{
                display: 'inline-block',
                background: '#e0e7ff',
                color: '#4f46e5',
                padding: '0.25rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginTop: '0.85rem'
              }}>
                JWT Token Active
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>LAST LOGIN</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>Just Now</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>IP: 127.0.0.1 (Local Environment)</p>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>Security Logs</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.6rem 0' }}>Event</th>
                    <th style={{ padding: '0.6rem 0' }}>Status</th>
                    <th style={{ padding: '0.6rem 0' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: '500' }}>Email Verification (OTP)</td>
                    <td style={{ padding: '0.75rem 0', color: '#16a34a', fontWeight: '600' }}>Success</td>
                    <td style={{ padding: '0.75rem 0', color: '#64748b' }}>A few seconds ago</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 0', fontWeight: '500' }}>User Registration</td>
                    <td style={{ padding: '0.75rem 0', color: '#16a34a', fontWeight: '600' }}>Completed</td>
                    <td style={{ padding: '0.75rem 0', color: '#64748b' }}>Just now</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
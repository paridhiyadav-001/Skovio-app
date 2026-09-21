import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success("Logged out successfully");
        navigate('/login');
    };

    return (
        <div className="card">
            <span style={{ background: '#22c55e20', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                Verified Account
            </span>
            <h2 style={{ marginTop: '12px' }}>Welcome, {user.fullName || 'User'}!</h2>
            <p style={{ color: '#94a3b8', margin: '8px 0 20px 0', fontSize: '14px' }}>
                Email: {user.email}
            </p>
            <button onClick={handleLogout} style={{ backgroundColor: '#ef4444' }}>
                Logout
            </button>
        </div>
    );
};

export default Dashboard;
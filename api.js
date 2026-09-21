import axios from 'axios';

// Live Render Backend URL
const API_URL = 'https://skovio-app.onrender.com/api/auth';

export const registerUser = (data) => axios.post(`${API_URL}/register`, data);
export const verifyOTP = (data) => axios.post(`${API_URL}/verify-otp`, data);
export const resendOTP = (data) => axios.post(`${API_URL}/resend-otp`, data);
export const loginUser = (data) => axios.post(`${API_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${API_URL}/forgot-password`, data);
export const resetPassword = (data) => axios.post(`${API_URL}/reset-password`, data);
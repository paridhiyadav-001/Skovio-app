import axios from 'axios';

// Aapka live backend URL (Render wala)
const API_URL = 'https://skovio-backend.onrender.com/api/auth';

export const registerUser = (data) => axios.post(`${API_URL}/register`, data);
export const verifyOTP = (data) => axios.post(`${API_URL}/verify-otp`, data);
export const resendOTP = (data) => axios.post(`${API_URL}/resend-otp`, data);
export const loginUser = (data) => axios.post(`${API_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${API_URL}/forgot-password`, data);
export const resetPassword = (data) => axios.post(`${API_URL}/reset-password`, data);

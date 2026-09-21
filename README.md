# Skovio-app
# Skovio - Full Stack Login & Registration System with Email OTP Verification

A responsive and secure full-stack MERN (MongoDB, Express, React, Node.js) web application featuring a complete user authentication flow with real-time Email OTP verification, account activation, secure password management, and JWT-based authorization.

---

## 📌 Project Overview

This application fulfills the technical assessment requirements for **Skovio**. It implements a complete, end-to-end user onboarding flow:
1. **User Registration** with full input validation.
2. **Email OTP Generation & Delivery** via SMTP (Nodemailer).
3. **Account Activation & Verification** prior to allowing user login.
4. **Secure Login & Authentication** with session management and logout functionality.
5. **Password Recovery** via email-verified OTP.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite, React Router DOM, React Hot Toast, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose ORM)
* **Email Service:** SMTP / Nodemailer (Gmail Integration)
* **Deployment & Hosting:** Vercel (Frontend), Render (Backend)
* **Version Control:** Git & GitHub

---

## 🔒 Security Features

* **Data Safety:** Sensitive configuration parameters (DB Connection String, SMTP Credentials) are strictly handled via Environment Variables (`.env`).
* **Authentication Safeguards:** Unverified accounts are restricted from accessing protected application features or initiating successful login sessions.
* **OTP Rate Limiting:** Enforces basic rate limiting and expiry windows to prevent abusive or repeated OTP request triggers.

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory of your backend folder and populate it with the following configuration keys:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
EMAIL_USER=your_email_address@gmail.com
EMAIL_PASS=your_16_digit_app_password
JWT_SECRET=your_jwt_secret_key

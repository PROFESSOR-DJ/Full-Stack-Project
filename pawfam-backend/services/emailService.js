const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // You can use other services like 'outlook', 'yahoo', etc.
        auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
        }
    });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'PawFam - Password Reset OTP',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">PawFam Password Reset</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1e40af; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated email from PawFam. Please do not reply to this email.
          </p>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

// Send password email
const sendPasswordEmail = async (email, password, username) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'PawFam - Your Password',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">PawFam Password Recovery</h2>
          <p>Hello ${username},</p>
          <p>Your password has been successfully verified. Here is your password:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #ef4444;"><strong>Important Security Notice:</strong></p>
          <ul style="color: #6b7280;">
            <li>We recommend changing your password immediately after logging in</li>
            <li>Never share your password with anyone</li>
            <li>Use a strong, unique password for your account</li>
          </ul>
          <p>You can now log in to your account using this password.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated email from PawFam. Please do not reply to this email.
          </p>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password email:', error);
        throw new Error('Failed to send password email');
    }
};

module.exports = {
    sendOTPEmail,
    sendPasswordEmail
};

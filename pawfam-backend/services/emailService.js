const nodemailer = require('nodemailer');

// Create transporter based on configuration
const createTransporter = async () => {
    // OPTION 1: Ethereal Email (Testing - No setup required!)
    if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_SERVICE) {
        // Create test account automatically
        let testAccount = await nodemailer.createTestAccount();
        
        console.log('📧 Using Ethereal Email for testing');
        console.log('Preview URL will be logged after sending email');
        
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
    
    // OPTION 2: Gmail with App Password
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // Use App Password here
            }
        });
    }
    
    // OPTION 3: Outlook/Hotmail
    if (process.env.EMAIL_SERVICE === 'outlook') {
        return nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
    
    // Default: Ethereal for testing
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};

// Send OTP email
const sendOTPEmail = async (email, otp, username = 'User') => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"PawFam" <noreply@pawfam.com>`,
            to: email,
            subject: '🔐 PawFam - Password Reset OTP',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 10px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e40af; margin: 0;">🐾 PawFam</h1>
            </div>
            
            <h2 style="color: #1e40af; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 16px;">Hello ${username},</p>
            <p style="color: #4b5563; font-size: 16px;">
              We received a request to reset your password. Please use the following OTP to verify your identity:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: white; letter-spacing: 12px; margin: 0; font-size: 36px; font-weight: bold;">${otp}</h1>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Important:</strong> This OTP will expire in 10 minutes.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 14px;">
              If you did not request this password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                This is an automated email from PawFam. Please do not reply to this email.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                © 2025 PawFam. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        
        // If using Ethereal, log the preview URL
        if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_SERVICE) {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log('👆 Click the URL above to view the email in browser');
        }
        
        return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Failed to send OTP email: ' + error.message);
    }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, username = 'User') => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"PawFam" <noreply@pawfam.com>`,
            to: email,
            subject: '✅ PawFam - Password Reset Successful',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 10px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e40af; margin: 0;">🐾 PawFam</h1>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background-color: #d1fae5; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #059669; font-size: 48px;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #059669; text-align: center; margin-bottom: 10px;">Password Reset Successful!</h2>
            <p style="color: #4b5563; font-size: 16px;">Hello ${username},</p>
            <p style="color: #4b5563; font-size: 16px;">
              Your password has been successfully reset. You can now login to your PawFam account using your new password.
            </p>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                🔒 <strong>Security Tip:</strong> Keep your password secure and never share it with anyone.
              </p>
            </div>
            
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                ⚠️ If you did not make this change, please contact support immediately.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                This is an automated email from PawFam. Please do not reply to this email.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                © 2025 PawFam. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset confirmation email sent!');
        console.log('📧 Message ID:', info.messageId);
        
        if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_SERVICE) {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        throw new Error('Failed to send confirmation email: ' + error.message);
    }
};

// Send password email (kept for backwards compatibility)
const sendPasswordEmail = async (email, password, username) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"PawFam" <noreply@pawfam.com>`,
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
        console.log('✅ Password email sent successfully!');
        
        if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_SERVICE) {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending password email:', error);
        throw new Error('Failed to send password email: ' + error.message);
    }
};

module.exports = {
    sendOTPEmail,
    sendPasswordEmail,
    sendPasswordResetConfirmation
};
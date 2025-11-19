# Email Setup Guide for PawFam

## Setting up Gmail SMTP for Password Reset

To enable the email functionality for OTP-based password reset, you need to configure Gmail SMTP settings.

### Steps:

1. **Install nodemailer package:**
   ```bash
   cd pawfam-backend
   npm install nodemailer
   ```

2. **Enable 2-Step Verification on your Gmail account:**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

3. **Create an App Password:**
   - Go to Google Account > Security
   - Under "Signing in to Google", select "App passwords"
   - Select app: "Mail"
   - Select device: "Other" (enter "PawFam Backend")
   - Click "Generate"
   - Copy the 16-character password

4. **Update your .env file:**
   Create or update the `.env` file in the `pawfam-backend` directory:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_16_character_app_password
   ```

5. **Alternative Email Services:**
   If you prefer to use other email services, update the `service` in `emailService.js`:
   - For Outlook: `service: 'outlook'`
   - For Yahoo: `service: 'yahoo'`
   - For custom SMTP: Replace with host and port configuration

### Testing the Email Functionality:

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Use the forgot password feature in the frontend
3. Check your email inbox for the OTP
4. Verify the OTP and receive your temporary password via email

### Security Notes:

- Never commit your `.env` file to version control
- Keep your app password secure
- Use environment variables for all sensitive information
- Consider implementing rate limiting for OTP requests in production

### Troubleshooting:

**Email not sending:**
- Verify your Gmail credentials are correct
- Check if 2-Step Verification is enabled
- Ensure the app password is properly copied (no spaces)
- Check if "Less secure app access" is turned on (if not using app password)

**OTP expired:**
- OTPs expire after 10 minutes
- Request a new OTP if expired

**Invalid OTP:**
- OTPs are case-insensitive
- Check for typos
- Ensure you're using the most recent OTP

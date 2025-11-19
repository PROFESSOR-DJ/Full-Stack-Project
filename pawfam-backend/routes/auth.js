const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register user (customer)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Please provide username, email, and password'
      });
    }

    // Check if user exists with email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Check if user exists with username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken'
      });
    }

    // Create new user (password will be hashed by the User model pre-save hook)
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      role: 'customer'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `This ${field} is already registered`
      });
    }

    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Register vendor
router.post('/vendor/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Please provide username, email, and password'
      });
    }

    // Check if user exists with email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Check if user exists with username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken'
      });
    }

    // Create new vendor
    const vendor = new User({
      username,
      email: email.toLowerCase(),
      password,
      role: 'vendor'
    });

    await vendor.save();

    // Generate token
    const token = jwt.sign(
      { userId: vendor._id, role: vendor.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: vendor._id,
        username: vendor.username,
        email: vendor.email,
        role: vendor.role
      },
      message: 'Vendor registered successfully'
    });
  } catch (error) {
    console.error('Vendor registration error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `This ${field} is already registered`
      });
    }

    res.status(500).json({ message: 'Server error during vendor registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user (case-insensitive email)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Login vendor
router.post('/vendor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find vendor (case-insensitive email and role check)
    const vendor = await User.findOne({
      email: email.toLowerCase(),
      role: 'vendor'
    });

    if (!vendor) {
      return res.status(400).json({ message: 'Invalid credentials or not a vendor account' });
    }

    // Check password
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: vendor._id, role: vendor.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: vendor._id,
        username: vendor.username,
        email: vendor.email,
        role: vendor.role
      },
      message: 'Vendor login successful'
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ message: 'Server error during vendor login' });
  }
});

// Generate random 6-digit alphanumeric OTP
const generateOTP = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};

// Send password reset OTP
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    // Find user (works for both customer and vendor)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to user (expires in 10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    const emailService = require('../services/emailService');
    await emailService.sendOTPEmail(email, otp);

    res.json({
      message: 'OTP has been sent to your email address',
      email: email
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: 'Failed to send OTP. Please try again later.',
      error: error.message
    });
  }
});

// Verify OTP and send password
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
    }

    if (Date.now() > user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP (case-insensitive)
    if (user.resetPasswordOTP.toUpperCase() !== otp.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid - Send the current password via email
    // Note: As per requirements, we're sending the password that user created
    // In production, passwords are hashed and cannot be retrieved
    // This implementation assumes we need to send user's original password

    // Since password is hashed, we'll generate a temporary password and send it
    // User should change it after logging in
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    // Update user's password
    user.password = tempPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    // Send password email
    const emailService = require('../services/emailService');
    await emailService.sendPasswordEmail(email, tempPassword, user.username);

    res.json({
      message: 'OTP verified successfully. A temporary password has been sent to your email address. Please change it after logging in.',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Failed to verify OTP. Please try again.',
      error: error.message
    });
  }
});

// Forgot password (legacy endpoint - kept for compatibility)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Please use the new OTP-based password reset feature'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
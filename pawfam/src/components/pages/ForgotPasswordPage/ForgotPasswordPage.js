import React, { useState } from 'react';
import Modal from '../../Modal/Modal';
import { authAPI } from '../../../services/api';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  // Password validation
  const [pwChecks, setPwChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const evaluatePassword = (pw) => {
    const length = pw.length >= 8;
    const uppercase = /[A-Z]/.test(pw);
    const lowercase = /[a-z]/.test(pw);
    const number = /[0-9]/.test(pw);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    setPwChecks({ length, uppercase, lowercase, number, special });
    return length && uppercase && lowercase && number && special;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await authAPI.sendPasswordResetOTP(email);
      console.log('OTP sent successfully:', response);
      
      setStep(2);
      setCountdown(600); // 10 minutes countdown
      setModalContent({
        title: 'OTP Sent',
        message: 'A 6-digit OTP has been sent to your email. Please check your inbox. The OTP will expire in 10 minutes.'
      });
      setIsModalOpen(true);

      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Send OTP error:', error);
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await authAPI.verifyPasswordResetOTP(email, otp);
      console.log('OTP verification response:', response);
      
      if (response.verified) {
        setStep(3);
        setModalContent({
          title: 'OTP Verified',
          message: 'OTP verified successfully! Please enter your new password.'
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrors({ 
        otp: error.response?.data?.message || 'Invalid or expired OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate password
    const isPasswordStrong = evaluatePassword(newPassword);
    if (!isPasswordStrong) {
      setErrors({ password: 'Password must meet all requirements' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('Resetting password with:', { email, otp, newPassword: '***' });
      
      const response = await authAPI.resetPassword(email, otp, newPassword);
      console.log('Password reset response:', response);
      
      if (response.success) {
        setStep(4);
        setModalContent({
          title: 'Password Reset Successfully',
          message: 'Your password has been reset successfully. You can now login with your new password.'
        });
        setIsModalOpen(true);
      } else {
        setErrors({
          submit: response.message || 'Failed to reset password. Please try again.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setErrors({});

    try {
      await authAPI.sendPasswordResetOTP(email);
      setCountdown(600);
      setModalContent({
        title: 'OTP Resent',
        message: 'A new OTP has been sent to your email.'
      });
      setIsModalOpen(true);

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (step === 4) {
      onNavigate('login');
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <h2 className="forgot-title">Reset Password</h2>
        
        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <p className="forgot-subtitle">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
            <form onSubmit={handleSendOTP} className="forgot-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({});
                  }}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  required
                  disabled={loading}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              
              {errors.submit && (
                <div className="error-message">{errors.submit}</div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary forgot-btn"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <>
            <p className="forgot-subtitle">
              Enter the 6-digit OTP sent to {email}
            </p>
            {countdown > 0 && (
              <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                OTP expires in: <strong>{formatTime(countdown)}</strong>
              </p>
            )}
            <form onSubmit={handleVerifyOTP} className="forgot-form">
              <div className="form-group">
                <label className="form-label" htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
                    setOtp(value.toUpperCase());
                    setErrors({});
                  }}
                  className={`form-input ${errors.otp ? 'error' : ''}`}
                  required
                  disabled={loading}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                />
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary forgot-btn"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary forgot-btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Back to Email
                </button>
                <button
                  type="button"
                  className="btn btn-secondary forgot-btn"
                  onClick={handleResendOTP}
                  disabled={loading || countdown > 540}
                  style={{ flex: 1 }}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <>
            <p className="forgot-subtitle">
              Create a new strong password for your account
            </p>
            <form onSubmit={handleResetPassword} className="forgot-form">
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    evaluatePassword(e.target.value);
                    setErrors({});
                  }}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  required
                  disabled={loading}
                  placeholder="Enter new password"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}

                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li className={pwChecks.length ? 'passed' : 'failed'}>At least 8 characters</li>
                    <li className={pwChecks.uppercase ? 'passed' : 'failed'}>An uppercase letter (A-Z)</li>
                    <li className={pwChecks.lowercase ? 'passed' : 'failed'}>A lowercase letter (a-z)</li>
                    <li className={pwChecks.number ? 'passed' : 'failed'}>A number (0-9)</li>
                    <li className={pwChecks.special ? 'passed' : 'failed'}>A special character (e.g. !@#$%)</li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({});
                  }}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  required
                  disabled={loading}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              {errors.submit && (
                <div className="error-message">{errors.submit}</div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary forgot-btn"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Password Reset Successfully!</h3>
            <p style={{ marginBottom: '2rem' }}>
              Your password has been successfully reset. You can now login with your new password.
            </p>
            <button
              className="btn btn-primary forgot-btn"
              onClick={() => onNavigate('login')}
            >
              Go to Login
            </button>
          </div>
        )}

        <div className="forgot-link">
          <a href="#" onClick={() => onNavigate('login')} className="login-link">
            Back to Login
          </a>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalContent.title}
        message={modalContent.message}
      />
    </div>
  );
};

export default ForgotPasswordPage;
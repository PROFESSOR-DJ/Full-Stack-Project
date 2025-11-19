import React, { useState } from 'react';
import Modal from '../../Modal/Modal';
import { authAPI } from '../../../services/api';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      await authAPI.sendPasswordResetOTP(email);
      setStep(2);
      setModalContent({
        title: 'OTP Sent',
        message: 'A 6-digit OTP has been sent to your email. Please check your inbox.'
      });
      setIsModalOpen(true);
    } catch (error) {
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
      setStep(3);
      setModalContent({
        title: 'Password Sent',
        message: response.message || 'Your password has been sent to your email address.'
      });
      setIsModalOpen(true);
    } catch (error) {
      setErrors({ 
        otp: error.response?.data?.message || 'Invalid OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (step === 3) {
      onNavigate('login');
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <h2 className="forgot-title">Reset Password</h2>
        
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

        {step === 2 && (
          <>
            <p className="forgot-subtitle">
              Enter the 6-digit OTP sent to {email}
            </p>
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
              
              <button
                type="button"
                className="btn btn-secondary forgot-btn"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                Back to Email
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Success!</h3>
            <p style={{ marginBottom: '2rem' }}>
              Your password has been sent to your email address.
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
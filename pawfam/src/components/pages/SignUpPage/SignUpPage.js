import React, { useState, useRef } from 'react';
import { authAPI } from '../../../services/api';
import './SignUpPage.css';

const SignUpPage = ({ onNavigate, onSignup }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Live validation state
  const [pwChecks, setPwChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Prevent double submission
  const isSubmitting = useRef(false);

  const validateForm = () => {
    const newErrors = {};

    if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Strong email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password strength rules
    const length = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!length || !uppercase || !lowercase || !number || !special) {
      newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting.current || loading) {
      console.log('Already submitting, ignoring duplicate request...');
      return;
    }

    if (!validateForm()) {
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setErrors({});

    try {
      console.log('Submitting registration...');

      // Single API call - authAPI.register now returns response.data directly
      const data = await authAPI.register({
        username,
        email,
        password
      });

      console.log('Registration successful:', data);

      // Store token and user info
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Show success message
      alert('Account created successfully! Please login.');

      // Navigate to login page
      if (onNavigate) {
        onNavigate('login');
      }

      // Optional: Call parent handler if provided
      if (onSignup) {
        onSignup(data);
      }

    } catch (error) {
      console.error('Signup error:', error);

      // Extract error message from response
      const errorMessage = error.response?.data?.message
        || error.message
        || 'Signup failed. Please try again.';

      setErrors({ submit: errorMessage });

      // Show error to user
      alert(errorMessage);

    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // Live input handlers with validation
  const handleUsernameChange = (value) => {
    setUsername(value);
    if (errors.username && value.length >= 3) {
      setErrors(prev => { const { username, ...rest } = prev; return rest; });
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (errors.email && emailRegex.test(value)) {
      setErrors(prev => { const { email, ...rest } = prev; return rest; });
    }
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

  // Pure check without side-effects (used in render checks)
  const checkPasswordStrength = (pw) => {
    const length = pw.length >= 8;
    const uppercase = /[A-Z]/.test(pw);
    const lowercase = /[a-z]/.test(pw);
    const number = /[0-9]/.test(pw);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    return length && uppercase && lowercase && number && special;
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    const strong = evaluatePassword(value);
    if (errors.password && strong) {
      setErrors(prev => { const { password, ...rest } = prev; return rest; });
    }
    // also check confirm password
    if (confirmPassword && value === confirmPassword) {
      setErrors(prev => { const { confirmPassword, ...rest } = prev; return rest; });
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (errors.confirmPassword && value === password) {
      setErrors(prev => { const { confirmPassword, ...rest } = prev; return rest; });
    }
  };

  const isFormValid = () => {
    if (username.length < 3) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    const strong = checkPasswordStrength(password);
    if (!strong) return false;
    if (password !== confirmPassword) return false;
    return true;
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2 className="signup-title">Create Your PetFam Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`form-input ${errors.username ? 'error' : ''}`}
              required
              disabled={loading}
              placeholder="Enter your username"
              autoComplete="username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              required
              disabled={loading}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`form-input ${errors.password ? 'error' : ''}`}
              required
              disabled={loading}
              placeholder="Enter your password"
              autoComplete="new-password"
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
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              required
              disabled={loading}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          {errors.submit && (
            <div className="error-message submit-error" style={{
              color: 'red',
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#fee',
              borderRadius: '4px'
            }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary signup-btn"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-link">
          <p>
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (!loading) {
                  onNavigate('login');
                }
              }}
              className="login-link"
            >
              Login here
            </a>
          </p>
          <p>
            Are you a vendor?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (!loading) {
                  onNavigate('vendor-signup');
                }
              }}
              className="vendor-link"
            >
              Sign up as vendor
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
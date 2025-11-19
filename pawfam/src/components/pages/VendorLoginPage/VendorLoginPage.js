import React, { useState, useRef } from 'react';
import { authAPI } from '../../../services/api';
import './VendorLoginPage.css';

const VendorLoginPage = ({ onNavigate, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Prevent double submission
    const isSubmitting = useRef(false);

    const validateForm = () => {
        const newErrors = {};

        if (!email || !email.includes('@') || !email.includes('.')) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password || password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

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
            console.log('Submitting vendor login for:', email);

            const data = await authAPI.vendorLogin({
                email,
                password
            });

            console.log('Vendor login successful:', data);

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            console.log('Vendor logged in successfully');

            if (onLogin) {
                await onLogin(data);
            } else {
                if (onNavigate) {
                    onNavigate('landing');
                }
            }

        } catch (error) {
            console.error('Vendor login error:', error);

            const errorMessage = error.response?.data?.message
                || error.message
                || 'Vendor login failed. Please check your credentials.';

            setErrors({ submit: errorMessage });

        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <div className="vendor-login-page">
            <div className="vendor-login-container">
                <h2 className="vendor-login-title">Vendor Login</h2>
                <p className="vendor-login-subtitle">Access your vendor dashboard</p>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            required
                            disabled={loading}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    {errors.submit && (
                        <div className="error-message submit-error" style={{
                            color: '#dc3545',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary vendor-login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login as Vendor'}
                    </button>
                </form>

                <div className="vendor-login-links">
                    <p className="vendor-login-link-text">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!loading) {
                                    onNavigate('forgot');
                                }
                            }}
                            className="forgot-link"
                        >
                            Forgot Password?
                        </a>
                    </p>
                    <p className="vendor-login-link-text">
                        Don't have a vendor account?{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!loading) {
                                    onNavigate('vendor-signup');
                                }
                            }}
                            className="signup-link"
                        >
                            Sign Up here
                        </a>
                    </p>
                    <p className="vendor-login-link-text">
                        Are you a customer?{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!loading) {
                                    onNavigate('login');
                                }
                            }}
                            className="customer-link"
                        >
                            Customer Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VendorLoginPage;
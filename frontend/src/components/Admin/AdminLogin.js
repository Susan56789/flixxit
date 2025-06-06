import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setDebugInfo(null);
        setIsLoading(true);

        // Validation
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Login attempt with email:', email);
            
            const requestData = { email: email.trim(), password };
            console.log('Request data:', { email: requestData.email, passwordLength: password.length });

            const response = await axios.post(
                'https://flixxit-h9fa.onrender.com/api/admin/login',
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Login response:', response.data);

            if (response.data.success) {
                // Store admin session
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', email);
                navigate('/admin/dashboard');
            } else {
                setError(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Enhanced error handling
            if (error.response) {
                // The request was made and the server responded with an error status
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                
                setError(error.response.data.message || 'Invalid credentials');
                
                // Show debug info in development
                setDebugInfo({
                    status: error.response.status,
                    message: error.response.data.message,
                    data: error.response.data
                });
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                setError('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request
                console.error('Request setup error:', error.message);
                setError('Failed to log in. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setShowForgotPasswordPopup(true);
        setForgotPasswordEmail(email);
        setError('');
        setDebugInfo(null);
    };

    const handleChangePassword = async () => {
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(
                'https://flixxit-h9fa.onrender.com/api/admin/change-password',
                {
                    email: forgotPasswordEmail.trim(),
                    newPassword,
                }
            );

            if (response.data.success) {
                alert('Password changed successfully!');
                setShowForgotPasswordPopup(false);
                setNewPassword('');
                setForgotPasswordEmail('');
            } else {
                alert(response.data.message || 'Failed to change password.');
            }
        } catch (error) {
            console.error('Change password error:', error);
            alert(error.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Test connection endpoint (for debugging)
    const testConnection = async () => {
        try {
            const response = await axios.get('https://flixxit-h9fa.onrender.com/api/test');
            console.log('Server connection test:', response.data);
            alert('Server connection successful!');
        } catch (error) {
            console.error('Connection test failed:', error);
            alert('Failed to connect to server');
        }
    };

    const renderModal = () => {
        if (!showForgotPasswordPopup) return null;

        return (
            <>
                <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ backgroundColor: '#1a1a1a', border: '2px solid #ff0000' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title text-white">Change Password</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowForgotPasswordPopup(false)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="forgotPasswordEmail" className="form-label text-white">Email:</label>
                                    <input
                                        type="email"
                                        id="forgotPasswordEmail"
                                        className="form-control bg-dark text-white border-secondary"
                                        value={forgotPasswordEmail}
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label text-white">New Password:</label>
                                    <div className="input-group">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            id="newPassword"
                                            className="form-control bg-dark text-white border-secondary"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            minLength="6"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            disabled={isLoading}
                                            title={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`fas fa-eye${showNewPassword ? '-slash' : ''} text-white`}></i>
                                        </button>
                                    </div>
                                    <small className="text-muted">Minimum 6 characters</small>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowForgotPasswordPopup(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={handleChangePassword}
                                    disabled={isLoading || !forgotPasswordEmail || !newPassword}
                                >
                                    {isLoading ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#000000' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-lg" style={{ backgroundColor: '#1a1a1a', border: '2px solid #ff0000' }}>
                            <div className="card-body p-5">
                                <h2 className="card-title text-center mb-4 text-white">
                                    <i className="fas fa-shield-alt text-danger me-2"></i>
                                    Admin Login
                                </h2>
                                
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        {error}
                                    </div>
                                )}
                                
                                {debugInfo && process.env.NODE_ENV === 'development' && (
                                    <div className="alert alert-warning">
                                        <small>
                                            <strong>Debug Info:</strong><br/>
                                            Status: {debugInfo.status}<br/>
                                            Message: {debugInfo.message}
                                        </small>
                                    </div>
                                )}
                                
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label text-white">
                                            <i className="fas fa-envelope me-1"></i> Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="form-control bg-dark text-white border-secondary"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            placeholder="admin@example.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label text-white">
                                            <i className="fas fa-lock me-1"></i> Password
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                placeholder="Enter password"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                            >
                                                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="btn btn-danger w-100 mb-3"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Logging in...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-sign-in-alt me-2"></i>
                                                Login
                                            </>
                                        )}
                                    </button>
                                    
                                    <div className="text-center">
                                        <button 
                                            type="button" 
                                            className="btn btn-link text-danger text-decoration-none"
                                            onClick={handleForgotPassword}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-key me-1"></i>
                                            Forgot Password?
                                        </button>
                                    </div>
                                </form>
                                
                                {/* Debug button - remove in production */}
                                <div className="text-center mt-3">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={testConnection}
                                    >
                                        Test Server Connection
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Instructions for first-time setup */}
                        <div className="text-center mt-3">
                            <small className="text-muted">
                                First time? You may need to create an admin account in the database.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
            {renderModal()}
        </div>
    );
};

export default AdminLogin;
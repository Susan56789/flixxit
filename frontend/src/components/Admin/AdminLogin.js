import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://flixxit-h9fa.onrender.com/api/admin/login', { email, password });
            if (response.data.success) {
                // Redirect to admin dashboard upon successful login
                navigate('/admin/dashboard');
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError('Failed to log in. Please try again.');
        }
    };

    const handleForgotPassword = () => {
        setShowForgotPasswordPopup(true);
        setForgotPasswordEmail(email);
    };

    const handleChangePassword = async () => {
        try {
            const response = await axios.post('https://flixxit-h9fa.onrender.com/api/admin/change-password', {
                email: forgotPasswordEmail,
                newPassword, // Use 'newPassword' as the key
            });

            if (response.data.success) {
                alert('Password changed successfully!');
                setShowForgotPasswordPopup(false);
                setNewPassword(''); // Reset the newPassword state
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password. Please try again.');
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title">Admin Login</h2>
                            {error && <p className="text-danger">{error}</p>}
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email:
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Password:
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Login
                                </button>
                                <button type="button" className="btn btn-link" onClick={handleForgotPassword}>
                                    Forgot Password?
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {showForgotPasswordPopup && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Change Password</h5>
                                <button type="button" className="close" onClick={() => setShowForgotPasswordPopup(false)}>
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="forgotPasswordEmail" className="form-label">
                                        Email:
                                    </label>
                                    <input
                                        type="email"
                                        id="forgotPasswordEmail"
                                        className="form-control"
                                        value={forgotPasswordEmail}
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label">
                                        New Password:
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPasswordPopup(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleChangePassword}>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default AdminLogin;
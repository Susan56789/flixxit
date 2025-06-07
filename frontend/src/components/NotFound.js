// components/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../themeContext';

const NotFound = () => {
    const { theme } = useTheme();

    return (
        <>
            {/* SEO for 404 Page */}
            <Helmet>
                <title>Page Not Found - Flixxit | 404 Error</title>
                <meta name="description" content="Sorry, the page you're looking for doesn't exist. Return to Flixxit homepage to discover amazing movies and shows." />
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://flixxit-five.vercel.app/404" />
                
                {/* Open Graph */}
                <meta property="og:title" content="Page Not Found - Flixxit" />
                <meta property="og:description" content="Sorry, the page you're looking for doesn't exist on Flixxit." />
                <meta property="og:type" content="website" />
                
                {/* Set 404 status code for SEO */}
                <meta httpEquiv="status" content="404" />
            </Helmet>

            <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6">
                            {/* 404 Animation */}
                            <div 
                                className="mb-4"
                                style={{
                                    fontSize: '8rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(45deg, var(--accent-color), #ff6b6b)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 0 30px rgba(220, 53, 69, 0.5)',
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                404
                            </div>

                            {/* Error Message */}
                            <h1 className="display-5 mb-3" style={{ color: 'var(--primary-text)' }}>
                                Oops! Page Not Found
                            </h1>
                            
                            <p className="lead text-muted mb-4">
                                The page you're looking for seems to have vanished into the digital void. 
                                Don't worry, even the best movies have plot twists!
                            </p>

                            {/* Suggestions */}
                            <div 
                                className="card mb-4"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <div className="card-body">
                                    <h5 className="card-title" style={{ color: 'var(--primary-text)' }}>
                                        What can you do?
                                    </h5>
                                    <div className="row text-start">
                                        <div className="col-md-6">
                                            <ul className="list-unstyled">
                                                <li className="mb-2">
                                                    <i className="bi bi-house-fill text-danger me-2"></i>
                                                    <Link to="/" className="text-decoration-none">
                                                        Go back to Homepage
                                                    </Link>
                                                </li>
                                                <li className="mb-2">
                                                    <i className="bi bi-film text-danger me-2"></i>
                                                    <Link to="/movies" className="text-decoration-none">
                                                        Browse Movies
                                                    </Link>
                                                </li>
                                                <li className="mb-2">
                                                    <i className="bi bi-search text-danger me-2"></i>
                                                    <Link to="/search" className="text-decoration-none">
                                                        Search for Movies
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <ul className="list-unstyled">
                                                <li className="mb-2">
                                                    <i className="bi bi-grid-3x3-gap-fill text-danger me-2"></i>
                                                    <Link to="/categories" className="text-decoration-none">
                                                        Movie Categories
                                                    </Link>
                                                </li>
                                                <li className="mb-2">
                                                    <i className="bi bi-bookmark-heart-fill text-danger me-2"></i>
                                                    <Link to="/watchlist" className="text-decoration-none">
                                                        My Watchlist
                                                    </Link>
                                                </li>
                                                <li className="mb-2">
                                                    <i className="bi bi-question-circle-fill text-danger me-2"></i>
                                                    <Link to="/help" className="text-decoration-none">
                                                        Get Help
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
                                <Link 
                                    to="/" 
                                    className="btn btn-danger btn-lg px-4"
                                    style={{
                                        backgroundColor: 'var(--accent-color)',
                                        borderColor: 'var(--accent-color)'
                                    }}
                                >
                                    <i className="bi bi-house-fill me-2"></i>
                                    Back to Home
                                </Link>
                                
                                <Link 
                                    to="/movies" 
                                    className="btn btn-outline-danger btn-lg px-4"
                                    style={{
                                        borderColor: 'var(--accent-color)',
                                        color: 'var(--accent-color)'
                                    }}
                                >
                                    <i className="bi bi-film me-2"></i>
                                    Browse Movies
                                </Link>
                            </div>

                            {/* Fun Movie Quote */}
                            <div 
                                className="alert alert-info border-0"
                                style={{
                                    backgroundColor: theme === 'dark' ? 'rgba(13, 202, 240, 0.1)' : 'rgba(13, 202, 240, 0.1)',
                                    border: '1px solid rgba(13, 202, 240, 0.3)',
                                    color: 'var(--primary-text)'
                                }}
                            >
                                <i className="bi bi-quote fs-4 text-info"></i>
                                <blockquote className="blockquote mb-0 mt-2">
                                    <p className="mb-1 fst-italic">
                                        "Houston, we have a problem... but don't worry, we'll get you back to the movies!"
                                    </p>
                                    <footer className="blockquote-footer mt-2">
                                        <cite title="Flixxit Team">The Flixxit Team</cite>
                                    </footer>
                                </blockquote>
                            </div>

                            {/* Error Code for Developers */}
                            <div className="mt-4">
                                <small className="text-muted">
                                    Error Code: 404 | Page Not Found
                                    <br />
                                    If you believe this is an error, please contact our support team.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style jsx>{`
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        text-shadow: 0 0 30px rgba(220, 53, 69, 0.5);
                    }
                    50% {
                        transform: scale(1.05);
                        text-shadow: 0 0 50px rgba(220, 53, 69, 0.8);
                    }
                    100% {
                        transform: scale(1);
                        text-shadow: 0 0 30px rgba(220, 53, 69, 0.5);
                    }
                }

                .btn:hover {
                    transform: translateY(-2px);
                    transition: all 0.3s ease;
                }

                .card {
                    transition: var(--theme-transition);
                }
            `}</style>
        </>
    );
};

export default NotFound;
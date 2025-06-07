import React from "react";
import { useTheme } from '../themeContext'; // Import your theme context

const Footer = () => {
    const { theme } = useTheme(); // Get current theme

    return (
        <footer className="mt-auto bg-dark text-light py-4 footer sticky-footer">
            <div className="container">
                {/* Main Footer Content */}
                <div className="row align-items-center justify-content-between">
                    {/* Brand and Copyright */}
                    <div className="col-md-6 col-12 text-center text-md-start mb-3 mb-md-0">
                        <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                            <i className="fas fa-film text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                            <span className="fw-bold fs-5 text-primary">Flixxit</span>
                        </div>
                        <div className="mt-2">
                            <span className="text-muted small">
                                &copy; {new Date().getFullYear()} Flixxit. All rights reserved.
                            </span>
                        </div>
                    </div>

                    {/* Social Links & Quick Links */}
                    <div className="col-md-6 col-12 text-center text-md-end">
                        <div className="d-flex align-items-center justify-content-center justify-content-md-end mb-2">
                            {/* Social Media Links */}
                            <a 
                                href="https://facebook.com/flixxit" 
                                className="text-muted me-3 hover-effect"
                                aria-label="Facebook"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a 
                                href="https://twitter.com/flixxit" 
                                className="text-muted me-3 hover-effect"
                                aria-label="Twitter"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a 
                                href="https://instagram.com/flixxit" 
                                className="text-muted me-3 hover-effect"
                                aria-label="Instagram"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a 
                                href="https://youtube.com/flixxit" 
                                className="text-muted hover-effect"
                                aria-label="YouTube"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-youtube"></i>
                            </a>
                        </div>
                        
                        {/* Quick Links */}
                        <div className="d-flex align-items-center justify-content-center justify-content-md-end flex-wrap">
                            <a href="/privacy" className="text-muted text-decoration-none me-3 small hover-effect">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="text-muted text-decoration-none me-3 small hover-effect">
                                Terms of Service
                            </a>
                            <a href="/contact" className="text-muted text-decoration-none small hover-effect">
                                Contact
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <hr className="my-4 border-secondary opacity-25" />

                {/* Bottom Section with Creator Credit */}
                <div className="row align-items-center">
                    <div className="col-md-6 col-12 text-center text-md-start mb-2 mb-md-0">
                        <small className="text-muted">
                            Streaming the best movies and shows, anytime, anywhere.
                        </small>
                    </div>
                    
                    <div className="col-md-6 col-12 text-center text-md-end">
                        <div className="d-flex align-items-center justify-content-center justify-content-md-end creator-info">
                            <small className="text-muted me-2">Created by</small>
                            
                            <a 
                                href="https://quirkwebstudios.co.ke" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary text-decoration-none fw-semibold hover-effect"
                            >
                                <i className="fas fa-external-link-alt me-1 small"></i>
                                QuirkWebStudios.co.ke
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
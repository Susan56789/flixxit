// AboutUs.js
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../themeContext';

const AboutUs = () => {
    const { theme } = useTheme();

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>About Us - Flixxit | Our Story & Mission</title>
                <meta 
                    name="description" 
                    content="Learn about Flixxit's journey since 2021. Discover our mission to provide exceptional streaming experiences with unlimited movies, TV shows, and exclusive content." 
                />
                <meta 
                    name="keywords" 
                    content="About Flixxit, streaming platform history, movie streaming service, OTT platform, entertainment company, Flixxit mission" 
                />
                <link rel="canonical" href="https://flixxit-five.vercel.app/about" />
                
                {/* Open Graph */}
                <meta property="og:title" content="About Us - Flixxit | Our Story & Mission" />
                <meta property="og:description" content="Learn about Flixxit's journey since 2021. Discover our mission to provide exceptional streaming experiences." />
                <meta property="og:url" content="https://flixxit-five.vercel.app/about" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="https://flixxit-five.vercel.app/og-image.jpg" />
                
                {/* Twitter */}
                <meta name="twitter:title" content="About Us - Flixxit | Our Story & Mission" />
                <meta name="twitter:description" content="Learn about Flixxit's journey since 2021. Discover our mission to provide exceptional streaming experiences." />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image" content="https://flixxit-five.vercel.app/og-image.jpg" />

                {/* Structured Data for Organization */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Flixxit",
                        "url": "https://flixxit-five.vercel.app",
                        "logo": "https://flixxit-five.vercel.app/logo.png",
                        "description": "Leading streaming platform offering unlimited movies, TV shows, and exclusive content since 2021.",
                        "foundingDate": "2021",
                        "sameAs": [
                            "https://flixxit-five.vercel.app"
                        ],
                        "address": {
                            "@type": "PostalAddress",
                            "addressCountry": "US"
                        },
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer service",
                            "availableLanguage": "English"
                        }
                    })}
                </script>
            </Helmet>

            {/* Page Content */}
            <div className="container my-5">
                <div className="row">
                    <div className="col-12 text-center">
                        <h1 className="display-4 mb-4">About Us</h1>
                        <p className="lead text-muted mb-5">
                            Discover the story behind Flixxit and our commitment to exceptional streaming experiences
                        </p>
                    </div>
                </div>
                
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div 
                            className="card mb-4 h-100"
                            style={{
                                backgroundColor: theme === 'dark' ? 'var(--card-bg)' : '#212529',
                                color: theme === 'dark' ? 'var(--primary-text)' : '#ffffff',
                                border: `1px solid ${theme === 'dark' ? 'var(--border-color)' : '#343a40'}`
                            }}
                        >
                            <div className="card-body">
                                <h2 className="card-title h3" style={{ color: 'inherit' }}>Our History</h2>
                                <p className="card-text lead" style={{ color: 'inherit' }}>
                                    Flixxit was founded in 2021 with the vision of providing an exceptional online streaming experience to users worldwide. Since then, we have grown into one of the leading streaming platforms, offering a vast library of movies and TV shows.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div 
                            className="card mb-4"
                            style={{
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--primary-text)'
                            }}
                        >
                            <div className="card-body">
                                <h2 className="card-title h3 mb-4">Platform Features</h2>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div 
                                            className="p-3 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' 
                                                    ? 'rgba(13, 110, 253, 0.2)' 
                                                    : 'rgba(13, 110, 253, 0.1)',
                                                border: '1px solid rgba(13, 110, 253, 0.3)'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <i className="bi bi-play-circle-fill text-primary fs-4"></i>
                                                </div>
                                                <div>
                                                    <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Unlimited Streaming</h5>
                                                    <p className="mb-0 text-muted">Endless movies and TV shows at your fingertips</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div 
                                            className="p-3 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' 
                                                    ? 'rgba(255, 193, 7, 0.2)' 
                                                    : 'rgba(255, 193, 7, 0.1)',
                                                border: '1px solid rgba(255, 193, 7, 0.3)'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <i className="bi bi-star-fill text-warning fs-4"></i>
                                                </div>
                                                <div>
                                                    <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Exclusive Content</h5>
                                                    <p className="mb-0 text-muted">Access to original shows and premium content</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div 
                                            className="p-3 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' 
                                                    ? 'rgba(25, 135, 84, 0.2)' 
                                                    : 'rgba(25, 135, 84, 0.1)',
                                                border: '1px solid rgba(25, 135, 84, 0.3)'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <i className="bi bi-shield-check text-success fs-4"></i>
                                                </div>
                                                <div>
                                                    <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Ad-Free Experience</h5>
                                                    <p className="mb-0 text-muted">Uninterrupted viewing pleasure</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div 
                                            className="p-3 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' 
                                                    ? 'rgba(13, 202, 240, 0.2)' 
                                                    : 'rgba(13, 202, 240, 0.1)',
                                                border: '1px solid rgba(13, 202, 240, 0.3)'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <i className="bi bi-display text-info fs-4"></i>
                                                </div>
                                                <div>
                                                    <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>HD Streaming</h5>
                                                    <p className="mb-0 text-muted">Crystal clear high-definition quality</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div 
                                            className="p-3 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' 
                                                    ? 'rgba(108, 117, 125, 0.2)' 
                                                    : 'rgba(108, 117, 125, 0.1)',
                                                border: '1px solid rgba(108, 117, 125, 0.3)'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <i className="bi bi-device-tablet text-secondary fs-4"></i>
                                                </div>
                                                <div>
                                                    <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Multi-Device Access</h5>
                                                    <p className="mb-0 text-muted">Watch anywhere, anytime, on any device</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card border-danger mb-4 h-100">
                            <div className="card-body">
                                <h2 className="card-title text-danger h3">Terms and Conditions</h2>
                                <p className="card-text">
                                    Please read our Terms and Conditions carefully before using our service. By accessing or using Flixxit, you agree to be bound by these terms and conditions.
                                </p>
                                <a href="/terms" className="btn btn-outline-danger">
                                    Read Full Terms
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card bg-info text-white">
                            <div className="card-body text-center">
                                <h2 className="card-title h3">Help Center</h2>
                                <p className="card-text lead mb-4">
                                    Have questions or need assistance? Visit our Help Center for answers to frequently asked questions or to contact our support team.
                                </p>
                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                    <a href="/help" className="btn btn-light">
                                        <i className="bi bi-question-circle me-2"></i>
                                        Help Center
                                    </a>
                                    <a href="/contact" className="btn btn-outline-light">
                                        <i className="bi bi-envelope me-2"></i>
                                        Contact Support
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission Statement Section */}
                <div className="row justify-content-center mt-5">
                    <div className="col-md-10">
                        <div className="card border-0 shadow">
                            <div className="card-body text-center py-5">
                                <h2 className="h3 mb-4">Our Mission</h2>
                                <blockquote className="blockquote">
                                    <p className="fs-5 fst-italic">
                                        "To revolutionize the way people discover, watch, and share their favorite movies and shows, creating a global community of entertainment enthusiasts."
                                    </p>
                                </blockquote>
                                <div className="row mt-4">
                                    <div className="col-md-4 mb-3">
                                        <div className="text-primary mb-2">
                                            <i className="bi bi-people-fill fs-1"></i>
                                        </div>
                                        <h3 className="h5">Community First</h3>
                                        <p className="text-muted small">Building connections through shared entertainment experiences</p>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <div className="text-success mb-2">
                                            <i className="bi bi-lightning-fill fs-1"></i>
                                        </div>
                                        <h3 className="h5">Innovation</h3>
                                        <p className="text-muted small">Continuously improving our platform with cutting-edge technology</p>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <div className="text-warning mb-2">
                                            <i className="bi bi-heart-fill fs-1"></i>
                                        </div>
                                        <h3 className="h5">Quality Content</h3>
                                        <p className="text-muted small">Curating the best movies and shows for our users</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AboutUs;
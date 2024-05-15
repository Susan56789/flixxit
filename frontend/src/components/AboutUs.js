// AboutUs.js
import React from 'react';

const AboutUs = () => {
    return (
        <div className="container mt-4">
            <h2>About Us</h2>
            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Our History</h5>
                            <p className="card-text">Flixxit was founded in 2021 with the vision of providing an exceptional online streaming experience to users worldwide. Since then, we have grown into one of the leading streaming platforms, offering a vast library of movies and TV shows.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Features</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">Unlimited streaming of movies and TV shows</li>
                                <li className="list-group-item">Access to exclusive original content</li>
                                <li className="list-group-item">Ad-free experience</li>
                                <li className="list-group-item">High-definition streaming</li>
                                <li className="list-group-item">Watch on any device, anytime, anywhere</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Terms and Conditions</h5>
                            <p className="card-text">Please read our Terms and Conditions carefully before using our service. By accessing or using Flixxit, you agree to be bound by these terms and conditions.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Help Center</h5>
                            <p className="card-text">Have questions or need assistance? Visit our Help Center for answers to frequently asked questions or to contact our support team.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;

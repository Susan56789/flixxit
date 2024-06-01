// AboutUs.js
import React from 'react';

const AboutUs = () => {
    return (
        <div className="container my-5">
            <div className="row">
                <div className="col-12 text-center">
                    <h2 className="display-4 mb-4">About Us</h2>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card bg-dark text-white mb-4">
                        <div className="card-body">
                            <h3 className="card-title">Our History</h3>
                            <p className="card-text lead">
                                Flixxit was founded in 2021 with the vision of providing an exceptional online streaming experience to users worldwide. Since then, we have grown into one of the leading streaming platforms, offering a vast library of movies and TV shows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card bg-light mb-4">
                        <div className="card-body">
                            <h3 className="card-title">Features</h3>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item bg-transparent">Unlimited streaming of movies and TV shows</li>
                                <li className="list-group-item bg-transparent">Access to exclusive original content</li>
                                <li className="list-group-item bg-transparent">Ad-free experience</li>
                                <li className="list-group-item bg-transparent">High-definition streaming</li>
                                <li className="list-group-item bg-transparent">Watch on any device, anytime, anywhere</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card border-danger mb-4">
                        <div className="card-body">
                            <h3 className="card-title text-danger">Terms and Conditions</h3>
                            <p className="card-text">
                                Please read our Terms and Conditions carefully before using our service. By accessing or using Flixxit, you agree to be bound by these terms and conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h3 className="card-title">Help Center</h3>
                            <p className="card-text lead">
                                Have questions or need assistance? Visit our Help Center for answers to frequently asked questions or to contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
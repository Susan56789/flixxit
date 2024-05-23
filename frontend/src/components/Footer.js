import React from "react";

const Footer = () => {
    return (
        <footer className="footer container text-center">
            <hr />
            <span className="text">
                &copy; {new Date().getFullYear()} Flixxit
            </span>
        </footer>
    );
};

export default Footer;

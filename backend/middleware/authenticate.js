// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        // Extract token (remove "Bearer " prefix)
        const token = authHeader.substring(7);
        
        // Verify token
        const decoded = jwt.verify(token, 'secretkey'); // Use same secret as in login
        
        // Add user info to request
        req.user = decoded;
        
        // Continue to next middleware/route handler
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        return res.status(500).json({ message: 'Token verification failed.' });
    }
};

module.exports = authenticate;
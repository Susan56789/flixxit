import React, { createContext, useState, useEffect } from 'react';
import { getUser, getUserToken } from './utils/helpers';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check for existing user data on mount
        const checkAuth = () => {
            try {
                const userData = getUser(); // This is synchronous based on your helpers
                const token = getUserToken();
                
                if (userData && token) {
                    setIsLoggedIn(true);
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
            }
        };

        checkAuth();
    }, []);

    const login = (userData) => {
        setIsLoggedIn(true);
        setUser(userData);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
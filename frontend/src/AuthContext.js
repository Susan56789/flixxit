import React, { createContext, useState, useEffect } from 'react';
import { getUser } from './utils/helpers';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch user data asynchronously when the component mounts
        const fetchUserData = async () => {
            try {
                const userData = await getUser();
                if (userData) {
                    setIsLoggedIn(true);
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();

        // Clean up function
        return () => {
            // Perform any cleanup if needed
        };
    }, []); // Empty dependency array ensures the effect runs only once

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

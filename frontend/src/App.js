import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import AllRouters from "./AllRouters";
import { AuthContext } from './AuthContext';
import { clearCache } from './utils/helpers';
import "./index.css";

// Notification Component
const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const bgColor = notification.type === 'success' ? 'bg-green-500' : 
                  notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm`}>
      <div className="flex justify-between items-center">
        <span>{notification.message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
};

function App() {
  const { login, logout, user } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Use refs to avoid stale closures
  const tokenRefreshTimeoutRef = useRef(null);
  const loginRef = useRef(login);
  const userRef = useRef(user);

  // Update refs when context values change
  useEffect(() => {
    loginRef.current = login;
    userRef.current = user;
  }, [login, user]);

  // Notification helper
  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // API helper with auth token
  const apiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("flixxItToken");
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // Handle unauthorized responses
      if (response.status === 401) {
        handleLogout();
        showNotification("Session expired. Please login again.", 'warning');
        throw new Error("Unauthorized");
      }

      return response;
    } catch (error) {
      if (error.message !== "Unauthorized") {
        console.error("API call error:", error);
      }
      throw error;
    }
  }, [showNotification]);

  // Check token validity on app start
  useEffect(() => {
    if (authChecked) return; // Prevent multiple checks

    const checkAuthStatus = () => {
      const token = localStorage.getItem("flixxItToken");
      const userData = localStorage.getItem("flixxItUser");
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          // Check if token is expired (basic check)
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const tokenData = JSON.parse(atob(tokenParts[1]));
            const currentTime = Date.now() / 1000;
            
            if (tokenData.exp && tokenData.exp < currentTime) {
              // Token expired
              handleLogout();
              showNotification("Session expired. Please login again.", 'warning');
            } else {
              // Token still valid
              loginRef.current(parsedUser);
              setIsAdmin(parsedUser.role === 'admin' || parsedUser.isAdmin);
            }
          } else {
            // Invalid token format
            handleLogout();
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
          handleLogout();
        }
      }
      setAuthChecked(true);
    };

    checkAuthStatus();
  }, [authChecked, showNotification]);

  // Token refresh function
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiCall(
        "https://flixxit-h9fa.onrender.com/api/refresh-token",
        { method: "POST" }
      );

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("flixxItToken", data.token);
        return { success: true };
      } else {
        handleLogout();
        return { success: false };
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      handleLogout();
      return { success: false };
    }
  }, [apiCall]);

  // Setup token refresh
  useEffect(() => {
    // Clear any existing timeout
    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
      tokenRefreshTimeoutRef.current = null;
    }

    const token = localStorage.getItem("flixxItToken");
    if (!token || !userRef.current) return;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return;

      const tokenData = JSON.parse(atob(tokenParts[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Refresh token 5 minutes before expiration
      const refreshTime = timeUntilExpiration - (5 * 60 * 1000);
      
      if (refreshTime > 0 && refreshTime < 24 * 60 * 60 * 1000) { // Only if less than 24 hours
        tokenRefreshTimeoutRef.current = setTimeout(() => {
          refreshToken();
        }, refreshTime);
      }
    } catch (error) {
      console.error("Error setting up token refresh:", error);
    }

    // Cleanup function
    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
        tokenRefreshTimeoutRef.current = null;
      }
    };
  }, [user, refreshToken]); // Only depend on user and refreshToken

  const handleLogin = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch("https://flixxit-h9fa.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token and user data
        localStorage.setItem("flixxItToken", data.token);
        localStorage.setItem("flixxItUser", JSON.stringify(data.user));
        
        // Update context and admin state
        login(data.user);
        setIsAdmin(data.user.role === 'admin' || data.user.isAdmin);
        
        showNotification("Login successful!", 'success');
        return { success: true, user: data.user };
      } else {
        showNotification(data.message || "Login failed", 'error');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Network error. Please try again.", 'error');
      return { success: false, message: "Network error" };
    } finally {
      setIsLoading(false);
    }
  }, [login, showNotification]);

  const handleLogout = useCallback(() => {
    // Clear timeout
    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
      tokenRefreshTimeoutRef.current = null;
    }

    // Clear all stored data
    clearCache();
    localStorage.removeItem("flixxItToken");
    localStorage.removeItem("flixxItUser");
    
    // Update context and admin state
    logout();
    setIsAdmin(false);
    
    // Show success message
    showNotification("Logged out successfully", 'success');
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }, [logout, showNotification]);

  const handleRegister = useCallback(async (username, email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch("https://flixxit-h9fa.onrender.com/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("Registration successful! Please login.", 'success');
        return { success: true };
      } else {
        showNotification(data.message || "Registration failed", 'error');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Registration error:", error);
      showNotification("Network error. Please try again.", 'error');
      return { success: false, message: "Network error" };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const handleSearch = useCallback(async (query) => {
    if (!query?.trim()) {
      showNotification("Please enter a search term", 'warning');
      return { success: false, results: [] };
    }

    setIsLoading(true);
    try {
      const response = await apiCall(
        `https://flixxit-h9fa.onrender.com/api/search?q=${encodeURIComponent(query)}`,
        { method: "GET" }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, results: data.results || [] };
      } else {
        showNotification(data.message || "Search failed", 'error');
        return { success: false, results: [] };
      }
    } catch (error) {
      if (error.message !== "Unauthorized") {
        console.error("Search error:", error);
        showNotification("Search failed. Please try again.", 'error');
      }
      return { success: false, results: [] };
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, showNotification]);

  const handleLike = useCallback(async (movieId) => {
    if (!movieId) {
      showNotification("Invalid movie ID", 'error');
      return { success: false };
    }

    try {
      const response = await apiCall(
        `https://flixxit-h9fa.onrender.com/api/movies/${movieId}/like`,
        { method: "POST" }
      );

      const data = await response.json();

      if (response.ok) {
        showNotification("Movie liked!", 'success');
        return { success: true, data };
      } else {
        showNotification(data.message || "Failed to like movie", 'error');
        return { success: false };
      }
    } catch (error) {
      if (error.message !== "Unauthorized") {
        console.error("Like error:", error);
        showNotification("Failed to like movie. Please try again.", 'error');
      }
      return { success: false };
    }
  }, [apiCall, showNotification]);

  const handleDislike = useCallback(async (movieId) => {
    if (!movieId) {
      showNotification("Invalid movie ID", 'error');
      return { success: false };
    }

    try {
      const response = await apiCall(
        `https://flixxit-h9fa.onrender.com/api/movies/${movieId}/dislike`,
        { method: "POST" }
      );

      const data = await response.json();

      if (response.ok) {
        showNotification("Movie disliked", 'success');
        return { success: true, data };
      } else {
        showNotification(data.message || "Failed to dislike movie", 'error');
        return { success: false };
      }
    } catch (error) {
      if (error.message !== "Unauthorized") {
        console.error("Dislike error:", error);
        showNotification("Failed to dislike movie. Please try again.", 'error');
      }
      return { success: false };
    }
  }, [apiCall, showNotification]);

  return (
    <>
      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />
      <AllRouters
        handleRegister={handleRegister}
        handleSearch={handleSearch}
        handleLike={handleLike}
        handleDislike={handleDislike}
        isAdmin={isAdmin}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isLoading={isLoading}
        refreshToken={refreshToken}
      />
    </>
  );
}

export default App;
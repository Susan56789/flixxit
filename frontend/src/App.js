import React, { useState, useContext } from "react";
import AllRouters from "./AllRouters";
import { AuthContext } from './AuthContext';
import { clearCache } from './utils/helpers';
import "./index.css";

function App() {
  const { login, logout } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async (email, password) => {
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
        // Store token and user data in localStorage
        localStorage.setItem("flixxItToken", data.token);
        localStorage.setItem("flixxItUser", JSON.stringify(data.user));
        
        // Update context state
        login(data.user);
        
        // Return success
        return { success: true, user: data.user };
      } else {
        // Handle login error
        alert(data.message || "Login failed");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
      return { success: false, message: "Network error" };
    }
  };

  const handleLogout = () => {
    // Clear all stored data
    clearCache();
    
    // Update context state
    logout();
    
    // Redirect to home page
    window.location.href = "/";
  };

  const handleRegister = async (username, email, password) => {
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
        alert("Registration successful! Please login.");
        return { success: true };
      } else {
        alert(data.message || "Registration failed");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration");
      return { success: false, message: "Network error" };
    }
  };

  const handleSearch = async (query) => {
    // Implement search functionality
    console.log("Searching for:", query);
  };

  const handleLike = async (movieId) => {
    // Implement like functionality
    console.log("Liked movie:", movieId);
  };

  const handleDislike = async (movieId) => {
    // Implement dislike functionality
    console.log("Disliked movie:", movieId);
  };

  return (
    <AllRouters
      handleRegister={handleRegister}
      handleSearch={handleSearch}
      handleLike={handleLike}
      handleDislike={handleDislike}
      isAdmin={isAdmin}
      handleLogin={handleLogin}
      handleLogout={handleLogout}
    />
  );
}

export default App;
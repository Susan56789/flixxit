import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllRouters from "./AllRouters";
import { AuthContext } from './AuthContext';
import { clearCache } from "./utils/helpers";
import { ThemeProvider } from './themeContext';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("flixxItToken") || "");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout, isLoggedIn, user } = useContext(AuthContext);

  const fetchUser = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("flixxItUser"));
      if (!userData || !userData.id) {
        setError('No user data found. Please log in again.');
        handleLogout();
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        `https://flixxit-h9fa.onrender.com/api/user/${userData.id}`,
        { headers, timeout: 10000 } // Add timeout
      );

      login(response.data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Failed to fetch user:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        handleLogout();
      } else if (error.response?.status === 404) {
        setError('User not found. Please log in again.');
        handleLogout();
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection.');
      } else {
        setError('Error fetching user data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [login, token]);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("flixxItToken", token);
    } else {
      localStorage.removeItem("flixxItToken");
    }
  }, [token]);

  const handleRegister = async (username, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/register", {
        username,
        email,
        password,
      }, { timeout: 10000 });

      const userId = response.data.userId;
      localStorage.setItem("flixxItUser", JSON.stringify({ id: userId }));
      navigate('/login');
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      clearCache(); // Clear cache before login

      const response = await axios.post(
        "https://flixxit-h9fa.onrender.com/api/login",
        { email, password },
        { timeout: 10000 }
      );

      const data = response.data;

      // Store user and token
      login(data.user);
      setToken(data.token);
      localStorage.setItem("flixxItToken", data.token); // Use consistent key
      localStorage.setItem("flixxItUser", JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    setToken("");
    setError(null);
    localStorage.removeItem("flixxItUser");
    localStorage.removeItem("flixxItToken");
    localStorage.removeItem("token"); // Remove any legacy token
    navigate("/login");
  }, [logout, navigate]);

  const handleLike = async (movieId, userId) => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/like", {
        movieId: movieId,
        userId: userId || user._id
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000
      });

      console.log("Like successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Like failed:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
      throw error;
    }
  };

  const handleDislike = async (movieId) => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/dislike", {
        userId: user._id,
        movieId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000
      });

      console.log("Dislike successful:", response.data);
      return response.data.dislikes;
    } catch (error) {
      console.error("Dislike failed:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
      return null;
    }
  };

  // Error display component
  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '12px 16px',
        borderRadius: '4px',
        border: '1px solid #f5c6cb',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        {error}
        <button
          onClick={() => setError(null)}
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: '#721c24',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <ThemeProvider>
      <ErrorDisplay />
      <AllRouters
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleLike={handleLike}
        handleDislike={handleDislike}
        loading={loading}
        error={error}
      />
    </ThemeProvider>
  );
};

export default App;
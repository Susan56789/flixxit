import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllRouters from "./AllRouters";
import { AuthContext } from './AuthContext';
import { clearCache } from "./utils/helpers";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("flixxItToken") || "");
  const navigate = useNavigate();
  const [error, setError] = useState(null)
  const { login, logout, isLoggedIn, user } = useContext(AuthContext);


  const fetchUser = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("flixxItUser"));
      if (!userData || !userData.id || !token) { // Check if userData or userData.id is undefined
        setError('Error fetching user data. Please try logging in again.'); // Handle undefined user ID
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        `https://flixxit-h9fa.onrender.com/api/user/${userData.id}`,
        { headers }
      );

      login(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setError('Error fetching user data. Please try again later.');
    }
  }, [login, token]);


  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("flixxItToken", token);
    } else {
      localStorage.removeItem("flixxItToken");
    }
  }, [token]);

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/register", {
        username,
        email,
        password,
      });
      const userId = response.data.userId;
      localStorage.setItem("flixxItUser", JSON.stringify({ id: userId }));
      navigate(`/login`);
    } catch (error) {
      console.error("Registration failed:", error.response?.data?.message || error.message);
      alert("Registration failed: " + (error.response?.data?.message || "An error occurred"));
    }
  };

  const handleLogin = async (email, password) => {

    clearCache();  // Clear cache before login
    try {
      const response = await axios.post(
        "https://flixxit-h9fa.onrender.com/api/login",
        { email, password }
      );
      const data = response.data;
      login(data.user);
      setToken(data.token);
      localStorage.setItem("flixxItUser", JSON.stringify(data.user));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed: " + (error.response?.data?.message || "An error occurred"));
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    setToken("");
    localStorage.removeItem("flixxItUser");
    localStorage.removeItem("flixxItToken");
    navigate("/login");
  };

  const handleLike = async (movieId, userId) => {
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/like", {
        movieId: movieId,
        userId: userId
      });
      console.log("Like successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Like failed:", error);
      throw error; // Re-throw the error to handle it in the calling function
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
      });
      console.log("Dislike successful:", response.data);
      return response.data.dislikes;
    } catch (error) {
      console.error("Dislike failed:", error);
      return null;
    }
  };

  return (
    <AllRouters
      isLoggedIn={isLoggedIn}
      handleLogout={handleLogout}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleLike={handleLike}
      handleDislike={handleDislike}
    />
  );
};

export default App;

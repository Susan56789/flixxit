import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllRouters from "./AllRouters";

const App = () => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("flixxItUser"));
      const token = localStorage.getItem("flixxItToken");
      if (!userData || !token) {
        return;
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        `https://flixxit-h9fa.onrender.com/api/user/${userData.id}`,
        { headers }
      );

      setUser(response.data);
      setLoggedIn(true);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/register", {
        username,
        email,
        password,
      });
      const userId = response.data.userId;
      // Set the user data in localStorage or a state management library
      localStorage.setItem("userId", userId);
      navigate(`/login`);
    } catch (error) {
      console.error("Registration failed:", error.response.data.message);
      // Handle registration error, e.g., display an error message
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(
        "https://flixxit-h9fa.onrender.com/api/login",
        { email, password }
      );
      const data = response.data;
      setToken(data.token);
      setLoggedIn(true);
      localStorage.setItem("flixxItToken", data.token);
      localStorage.setItem("flixxItUser", JSON.stringify(data.user));
      fetchUser();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setToken("");
    localStorage.removeItem("flixxItToken");
    localStorage.removeItem("flixxItUser");
    navigate("/login");
  };

  const handleSearch = async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/search?query=${encodedQuery}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Server responded with error status:", error.response.status);
        console.error("Error response data:", error.response.data);
        alert(`Error: ${error.response.status} - ${error.response.data.message || "Internal Server Error"}`);
      } else if (error.request) {
        console.error("No response received from server:", error.request);
        alert("No response received from server. Please try again later.");
      } else {
        console.error("Error setting up request:", error.message);
        alert(`Error setting up request: ${error.message}`);
      }
      return [];
    }
  };
  

  const handleLike = async (movieId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("flixxItUser"));
      if (!userData) {
        throw new Error("User not logged in");
      }
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/like", {
        userId: userData._id,
        movieId,
      });
      console.log("Like successful:", response.data);
      // Assuming response.data.likes contains the updated like count
      return response.data.likes;
    } catch (error) {
      console.error("Like failed:", error);
      return null;
    }
  };

  const handleDislike = async (movieId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("flixxItUser"));
      if (!userData) {
        throw new Error("User not logged in");
      }
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/dislike", {
        userId: userData._id,
        movieId,
      });
      console.log("Dislike successful:", response.data);
      // Assuming response.data.dislikes contains the updated dislike count
      return response.data.dislikes;
    } catch (error) {
      console.error("Dislike failed:", error);
      return null;
    }
  };


  return (
    <AllRouters
      user={user}
      loggedIn={loggedIn}
      handleLogout={handleLogout}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleSearch={handleSearch}
      handleLike={handleLike}
      handleDislike={handleDislike}
    />
  );
};

export default App;
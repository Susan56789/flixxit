import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllRouters from "./AllRouters";
import { AuthContext } from './AuthContext';
import { getUser } from "./utils/helpers";

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

  const handleSearch = async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/search?query=${encodedQuery}`);
      return response.data;
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed: " + (error.response?.data?.message || "An error occurred"));
      return [];
    }
  };

  const handleLike = async (movieId, userId) => {
    try {
      const likeResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/likes/${movieId}/${userId}`);
      const hasLiked = likeResponse.data.hasLiked;

      if (hasLiked) {
        // If the user has already liked the movie, perform undo action
        const response = await axios.delete(`https://flixxit-h9fa.onrender.com/api/like/${movieId}/${userId}`);
        console.log("Undo like successful:", response.data);
      } else {
        // If the user has not liked the movie, perform like action
        const response = await axios.post("https://flixxit-h9fa.onrender.com/api/like", {
          movieId: movieId,
          userId: userId
        });
        console.log("Like successful:", response.data);
      }
      return true; // Return true to indicate success
    } catch (error) {
      console.error("Like failed:", error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  };

  const handleDislike = async (movieId, userId) => {
    try {
      const dislikeResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/dislikes/${movieId}/${userId}`);
      const hasDisliked = dislikeResponse.data.hasDisliked;

      if (hasDisliked) {
        // If the user has already disliked the movie, perform undo action
        const response = await axios.delete(`https://flixxit-h9fa.onrender.com/api/dislike/${movieId}/${userId}`);
        console.log("Undo dislike successful:", response.data);
      } else {
        // If the user has not disliked the movie, perform dislike action
        const response = await axios.post("https://flixxit-h9fa.onrender.com/api/dislike", {
          movieId: movieId,
          userId: userId
        });
        console.log("Dislike successful:", response.data);
      }
      return true; // Return true to indicate success
    } catch (error) {
      console.error("Dislike failed:", error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  };

  return (
    <AllRouters
      isLoggedIn={isLoggedIn}
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

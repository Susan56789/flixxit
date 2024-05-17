import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllRouters from "./AllRouters";

const App = () => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        let userData = JSON.parse(localStorage.getItem("flixxItUser"));
        let token = localStorage.getItem("flixxItToken");
        let userId = userData.id;
        let headers = {
          Authorization: `Bearer ${token}`,
        };
        // console.log("userData", userData);

        const response = await axios.get(`/api/user/${userId}`, headers);
        // console.log("response", response.data);
        setUser(response.data);
        setLoggedIn(true);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  // const handleAddMovie = (newMovie) => {
  //   axios
  //     .post("/api/movies", newMovie)
  //     .then((res) => {
  //       console.log(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post("/api/register", {
        username,
        email,
        password,
      });
      const userId = response.data.userId;
      setLoggedIn(true);
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post("/api/login", { email, password });
      const data = response.data;
      setToken(token);
      setLoggedIn(true);
      localStorage.setItem("flixxItToken", data.token);
      localStorage.setItem("flixxItUser", JSON.stringify(data.user));
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
      const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/search?query=${query}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        console.error("Server responded with error status:", error.response.status);
        // You can handle different HTTP status codes here if needed
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from server:", error.request);
        // You might want to display a user-friendly message here
      } else {
        // Something else happened in setting up the request that triggered an error
        console.error("Error setting up request:", error.message);
        // Handle other types of errors here
      }
      return []; // Return an empty array as default
    }
  };


  const handleLike = async (movieId, userId) => {
    try {
      const response = await axios.post("/api/like", {
        userId,
        movieId,
      });
      console.log("Like successful:", response.data);
      // Handle successful like
    } catch (error) {
      console.error("Like failed:", error);
      // Handle error
    }
  };

  const handleDislike = async (movieId, userId) => {
    try {
      const response = await axios.post("/api/dislike", {
        userId,
        movieId,
      });
      console.log("Dislike successful:", response.data);
      // Handle successful dislike
    } catch (error) {
      console.error("Dislike failed:", error);
      // Handle error
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
      // userId={userId}
      handleLike={handleLike}
      handleDislike={handleDislike}
    />
  );
};

export default App;

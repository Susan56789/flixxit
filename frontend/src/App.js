import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Routers from './Routers';

const App = () => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId && token && loggedIn) {
          const response = await axios.get(`/api/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log("User Data:", response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        handleLogout(); // Reset user state if user data fetching fails
      }
    };

    fetchData();
  }, [userId, token, loggedIn]);

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const { token, user } = response.data || {};

      if (!token || !user) {
        console.error('Token or user object not found in the response');
        return null;
      }

      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      setLoggedIn(true);
      setUserId(user._id);
      navigate(`/profile/${user._id}`);
      return user; // <-- Return user object
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post('/api/register', { username, email, password });
      const userId = response.data.userId;
      setUserId(userId);
      setLoggedIn(true);
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setToken('');
    setUserId('');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleSearch = async (query) => {
    try {
      const response = await axios.get(`/api/movies/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  return (
    <Routers
      user={user}
      loggedIn={loggedIn}
      handleLogout={handleLogout}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleSearch={handleSearch}
      userId={userId} // Pass userId to Routers
    />
  );
}

export default App;

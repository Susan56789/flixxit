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
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data);
        setLoggedIn(true);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    if (userId && token && loggedIn) {
      fetchUser();
    }
  }, [userId, token, loggedIn]);

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

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      console.log('Login response:', response.data); // Log the entire response object

      const { token, user } = response.data || {};

      console.log('User object:', user);
      console.log('Response object:', { token, user });

      if (!token || !user) {
        console.error('Token or user object not found in the response');
        return false;
      }

      setToken(token);
      setLoggedIn(true);
      setUserId(user._id);
      setUser(user); // <-- Update the user state with the received user object
      navigate(`/profile/${user._id}`);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };


  const handleLogout = () => {
    navigate('/login')
    setLoggedIn(false);
    setUser(null);
    setToken('');
    setUserId('');
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
      userId={userId}
    />
  );
}

export default App;

// App.js
import React, { useState } from 'react';
import axios from 'axios';
import Routers from './Routers';

function App() {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  const handleAddMovie = (newMovie) => {
    axios.post('/api/movies', newMovie)
      .then(res => {
        console.log(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await axios.post('/api/register', { username, email, password });
      const userId = response.data.userId;
      setUser(userId);
      setLoggedIn(true);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const token = response.data;
      setToken(token);
      setLoggedIn(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setToken('');
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
      loggedIn={loggedIn}
      handleLogout={handleLogout}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleSearch={handleSearch}
    />
  );
}

export default App;

import React, { useState } from 'react';
import axios from 'axios';
import Routers from './Routers';

function App() {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [searchResult, setSearchResult] = useState([]);

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
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setToken('');
  };

  const handleSearch = async (query) => {
    try {
      const response = await axios.get(`/api/movies/search?query=${query.toLowerCase()}`);
      setSearchResult(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };


  return (
    <Routers
      loggedIn={loggedIn}
      handleLogout={handleLogout}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleSearch={handleSearch}
      searchResult={searchResult}
    />
  );
}

export default App;

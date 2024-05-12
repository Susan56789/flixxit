import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('');
  const [year, setYear] = useState('');
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    axios.get('/api/movies')
      .then(res => {
        setMovies(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/movies', {
      title,
      description,
      genre,
      rating,
      year
    })
    .then(res => {
      console.log(res.data);
      setMovies([...movies, res.data]);
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

  return (
    <div className="App">
      <h1>Flixxit</h1>
      {loggedIn ? (
        <div>
          <h2>Add Movie</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="text"
              placeholder="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
            <input
              type="text"
              placeholder="Rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <button type="submit">Add Movie</button>
          </form>
          <h2>Movies</h2>
          {movies.map(movie => (
            <div key={movie._id}>
              <h3>{movie.title}</h3>
              <p>{movie.description}</p>
              <p>{movie.genre}</p>
              <p>{movie.rating}</p>
              <p>{movie.year}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <h2>Register</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleRegister(e.target.username.value, e.target.email.value, e.target.password.value);
          }}>
            <input
              type="text"
              placeholder="Username"
              name="username"
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
            />
            <button type="submit">Register</button>
          </form>
          <h2>Login</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleLogin(e.target.email.value, e.target.password.value);
          }}>
            <input
              type="email"
              placeholder="Email"
              name="email"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
            />
            <button type="submit">Login</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/flixxit', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mongoose Schema
const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  genre: String,
  rating: Number,
  year: Number
});

const Movie = mongoose.model('Movie', movieSchema);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

// Routes
// Authentication
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    });
    const savedUser = await user.save();
    res.json({ userId: savedUser._id });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ _id: user._id }, 'secretkey');
    res.header('auth-token', token).send(token);
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

// Movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.json({ message: err });
  }
});

app.post('/api/movies', async (req, res) => {
  const movie = new Movie({
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    rating: req.body.rating,
    year: req.body.year
  });

  try {
    const savedMovie = await movie.save();
    res.json(savedMovie);
  } catch (err) {
    res.json({ message: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

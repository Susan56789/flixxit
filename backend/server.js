const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

// Connection URI
const uri = "mongodb+srv://devnimoh:INM8mbnUneU1mGFu@cluster0.inrpjl1.mongodb.net/sample_mflix?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to the database");

    // Establish and verify connection
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const users = database.collection('users');
    console.log("Collections initialized");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

run().catch(console.dir);

app.use(bodyParser.json());

// Default landing page
app.get('/', (req, res) => {
  res.send('Welcome to Flixxit Backend!');
});

// Routes
// Authentication
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    };
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const result = await users.insertOne(user);
    res.json({ userId: result.insertedId });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const user = await users.findOne({ email: req.body.email });
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
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const moviesList = await movies.find().toArray();
    res.json(moviesList);
  } catch (err) {
    res.json({ message: err });
  }
});

app.post('/api/movies', async (req, res) => {
  const movie = {
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    rating: req.body.rating,
    year: req.body.year,
    imageUrl: req.body.imageUrl
  };

  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const result = await movies.insertOne(movie);
    res.json(result.ops[0]);
  } catch (err) {
    res.json({ message: err });
  }
});


// Movie detail
app.get('/api/movies/:id', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const ObjectId = require('mongodb').ObjectId;
    const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});


// Genre endpoint
app.get('/api/genres', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const genres = await movies.distinct("genre");
    res.json(genres);
  } catch (err) {
    console.error("Error fetching genres:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//Movie Search
app.get('/api/movies/search', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const searchQuery = req.query.query;
    const searchResult = await movies.find({ title: { $regex: searchQuery, $options: 'i' } }).toArray();
    res.json(searchResult);
  } catch (err) {
    console.error("Error searching movies:", err);
    res.status(500).json({ message: "Server error" });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

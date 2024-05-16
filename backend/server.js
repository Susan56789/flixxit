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
    // Check if email already exists
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const existingEmail = await users.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if username already exists
    const existingUsername = await users.findOne({ username: req.body.username });
    if (existingUsername) {
      alert('Username already exists')
      return res.status(400).json({ message: 'Username already exists' });

    }

    // Check if password is at least 8 characters long
    if (req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    };

    // Insert the user into the database
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
    res.json({ token, user }); // <-- Send both the token and the user object

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

// Movies search
app.get('/api/movies/search', async (req, res) => {
  const query = req.query.query.toLowerCase();
  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');
    const moviesList = await movies.find({ title: { $regex: query, $options: 'i' } }).toArray();
    res.json(moviesList);
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//get user data
const ObjectId = require('mongodb').ObjectId;

app.get('/api/user/:id', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const user = await users.findOne({ _id: ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});


app.get('/api/user', async (req, res) => {
  try {
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const token = req.header('auth-token');
    const user = await users.findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});





app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

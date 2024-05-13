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

    // Establish and verify connection
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
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
    console.log(moviesList)
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
    year: req.body.year
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

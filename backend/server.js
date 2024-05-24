const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

const ObjectId = require("mongodb").ObjectId;

// Connection URI
const uri =   "mongodb+srv://devnimoh:INM8mbnUneU1mGFu@cluster0.inrpjl1.mongodb.net/sample_mflix?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

// Use CORS middleware
app.use(cors());
app.use(bodyParser.json());

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, 'secretkey');
    const database = client.db('sample_mflix');
    const users = database.collection('users');
    const user = await users.findOne({ _id: new ObjectId(decoded._id) });

    if (!user) return res.status(400).json({ message: 'Invalid token.' });

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const createTextIndex = async (collection) => {
  const indexes = await collection.indexes();
  const hasTextIndex = indexes.some(index => index.key && index.key._fts === "text");

  if (!hasTextIndex) {
    await collection.createIndex({ title: "text", description: "text" });
    console.log("Text index created on 'title' and 'description' fields.");
  } else {
    console.log("Text index already exists on 'title' and 'description' fields.");
  }
};

async function run() {
  try {
    await client.connect();
    console.log("Connected to the database");

    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const users = database.collection("users");
    console.log("Collections initialized");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

run().catch(console.dir);

// Default landing page
app.get("/", (req, res) => {
  res.send("Welcome to Flixxit Backend!");
});

// Routes
require('./routes/admin')(client, app, bcrypt);
require('./routes/dislikes')(client, app, ObjectId);
require('./routes/genre')(client, app);
require('./routes/likes')(client, app, ObjectId);
require('./routes/movies')(client, app, authenticate, createTextIndex, ObjectId);
require('./routes/subscribers')(client, app, ObjectId);
require('./routes/users')(client, app, authenticate, bcrypt, jwt);
require('./routes/watchlist')(client, app, authenticate, ObjectId);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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
const uri =
  "mongodb+srv://devnimoh:INM8mbnUneU1mGFu@cluster0.inrpjl1.mongodb.net/sample_mflix?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

// Use CORS middleware
app.use(cors());

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

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to the database");

    // Establish and verify connection
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const users = database.collection("users");
    console.log("Collections initialized");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

run().catch(console.dir);

app.use(bodyParser.json());

// Default landing page
app.get("/", (req, res) => {
  res.send("Welcome to Flixxit Backend!");
});

// Routes
// Authentication
app.post("/api/register", async (req, res) => {
  try {
    // Check if email already exists
    const database = client.db("sample_mflix");
    const users = database.collection("users");
    const existingEmail = await users.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if username already exists
    const existingUsername = await users.findOne({
      username: req.body.username,
    });
    if (existingUsername) {
      alert("Username already exists");
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if password is at least 8 characters long
    if (req.body.password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    };

    // Insert the user into the database
    const result = await users.insertOne(user);
    res.json({ userId: result.insertedId });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const users = database.collection("users");
    const user = await users.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ _id: user._id.toString() }, "secretkey");
    res.json({ token, user }); // <-- Send both the token and the user object
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

// Change password endpoint
app.post("/api/change-password", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Check if the old password matches the current password
    const database = client.db("sample_mflix");
    const users = database.collection("users");
    const user = await users.findOne({ _id: new ObjectId(userId) });

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid old password" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedNewPassword } }
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Movies
app.get("/api/movies", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const moviesList = await movies.find().toArray();
    res.json(moviesList);
  } catch (err) {
    res.json({ message: err });
  }
});

app.post("/api/movies", async (req, res) => {
  const movie = {
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    rating: req.body.rating,
    year: req.body.year,
    imageUrl: req.body.imageUrl,
  };

  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const result = await movies.insertOne(movie);
    res.json(result.ops[0]);
  } catch (err) {
    res.json({ message: err });
  }
});

// Movie detail
app.get("/api/movies/:id", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const ObjectId = require("mongodb").ObjectId;
    const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Genre endpoint
app.get("/api/genres", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const genres = await movies.distinct("genre");
    res.json(genres);
  } catch (err) {
    console.error("Error fetching genres:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  movie search
app.get("/api/movies/search", async (req, res) => {
  const query = req.query.query?.toString();

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Log the query being used
    console.log(`Searching for movies with title or description matching: ${query}`);

    // Search for movies with titles or descriptions matching the query (case-insensitive)
    const moviesList = await movies
      .find({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } }
        ]
      })
      .toArray();

    // Check if any movies were found
    if (moviesList.length === 0) {
      console.log(`No movies found for query: ${query}`);
    }

    res.status(200).json(moviesList);
  } catch (error) {
    console.error("Error processing search request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


//get user data
app.get("/api/user/:id", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const users = database.collection("users");
    const user = await users.findOne({ _id: ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.get("/api/user", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const users = database.collection("users");
    const token = req.header("Authorization").split(" ")[1]; // Extract token from Authorization header
    const user = await users.findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Subscribers
app.post("/api/subscribe", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const subscribers = database.collection("subscribers");
    const { userId, movieId } = req.body;

    // Check if the user has already subscribed to the movie
    const existingSubscription = await subscribers.findOne({ userId, movieId });
    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: "You have already subscribed to this movie" });
    }

    // Create a new subscription
    const subscription = { userId, movieId };
    const result = await subscribers.insertOne(subscription);
    res.json(result.ops[0]);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Likes
app.post("/api/like", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const likes = database.collection("likes");
    const { userId, movieId } = req.body;

    // Check if the user has already liked the movie
    const existingLike = await likes.findOne({ userId, movieId });
    if (existingLike) {
      return res
        .status(400)
        .json({ message: "You have already liked this movie" });
    }

    // Create a new like
    const like = { userId, movieId };
    await likes.insertOne(like);

    // Update the movie document
    const result = await movies.updateOne(
      { _id: new ObjectId(movieId) },
      { $addToSet: { likesBy: userId } }
    );

    res.json({ message: "Movie liked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dislikes
app.post("/api/dislike", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const dislikes = database.collection("dislikes");
    const { userId, movieId } = req.body;

    // Check if the user has already disliked the movie
    const existingDislike = await dislikes.findOne({ userId, movieId });
    if (existingDislike) {
      return res
        .status(400)
        .json({ message: "You have already disliked this movie" });
    }

    // Create a new dislike
    const dislike = { userId, movieId };
    await dislikes.insertOne(dislike);

    // Update the movie document
    const result = await movies.updateOne(
      { _id: new ObjectId(movieId) },
      {
        $addToSet: { dislikesBy: userId },
        $pull: { likesBy: userId },
      }
    );

    res.json({ message: "Movie disliked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//GET LIKES COUNT

app.get("/api/movies/:id/likes", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const likes = database.collection("likes");
    const { id } = req.params;

    const likeCount = await likes.countDocuments({ movieId: id });
    res.json({ likes: likeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//GET DISLIKES COUNT

app.get("/api/movies/:id/dislikes", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const dislikes = database.collection("dislikes");
    const { id } = req.params;

    const dislikeCount = await dislikes.countDocuments({ movieId: id });
    res.json({ dislikes: dislikeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UNDO LIKE
app.delete("/api/movies/:id/likes/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const database = client.db("sample_mflix");
    const likes = database.collection("likes");

    // Delete the like entry associated with the user and movie
    const result = await likes.deleteOne({ movieId: id, userId: userId });

    if (result.deletedCount === 1) {
      // If like entry was successfully deleted
      res.json({ success: true, message: "Like undone successfully" });
    } else {
      // If no like entry was found to delete
      res.status(404).json({ success: false, message: "No like found to undo" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UNDO DISLIKE
app.delete("/api/movies/:id/dislikes/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const database = client.db("sample_mflix");
    const dislikes = database.collection("dislikes");

    // Delete the dislike entry associated with the user and movie
    const result = await dislikes.deleteOne({ movieId: id, userId: userId });

    if (result.deletedCount === 1) {
      // If dislike entry was successfully deleted
      res.json({ success: true, message: "Dislike undone successfully" });
    } else {
      // If no dislike entry was found to delete
      res.status(404).json({ success: false, message: "No dislike found to undo" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// Watchlist endpoint
app.get('/api/watchlist/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId; // Extract user ID from request parameters

    // Ensure userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Initialize the database within the endpoint handler
    const database = client.db("sample_mflix");

    const watchlist = database.collection('watchlist');
    // Find user's watchlist based on userId
    const userWatchlist = await watchlist.find({ userId: new ObjectId(userId) }).toArray();
    const movieIds = userWatchlist.map((item) => item.movieId);

    const movies = database.collection("movies");
    // Find movies in user's watchlist based on movieIds
    const userWatchlistMovies = await movies
      .find({ _id: { $in: movieIds } })
      .toArray();

    res.json(userWatchlistMovies);
  } catch (err) {
    console.error("Error fetching user's watchlist:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Add to watchlist endpoint
app.post('/api/watchlist', authenticate, async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user._id;
    const database = client.db("sample_mflix");

    const watchlist = database.collection('watchlist');

    const existingItem = await watchlist.findOne({ userId, movieId });
    if (existingItem) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }

    const result = await watchlist.insertOne({ userId, movieId });
    res.json({ message: "Movie added to watchlist" });
  } catch (err) {
    console.error("Error adding to watchlist:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove from watchlist endpoint
app.delete('/api/watchlist/:movieId', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { movieId } = req.params;

    // Get database connection
    const database = client.db("sample_mflix");

    // Find and remove movie from watchlist
    const result = await database.collection('watchlist').deleteOne({
      userId: new ObjectId(userId),
      movieId: new ObjectId(movieId)
    });

    if (result.deletedCount === 0) {
      // If no document was deleted, return 404 with appropriate message
      return res.status(404).json({ message: "Movie not found in watchlist" });
    }

    // If deletion was successful, return success message
    res.json({ message: "Movie removed from watchlist" });
  } catch (err) {
    // If an error occurs during deletion, return 500 with error message
    console.error("Error removing from watchlist:", err);
    res.status(500).json({ message: "Server error while removing from watchlist" });
  }
});



// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the provided email exists in the database
    const database = client.db("sample_mflix");
    const admins = database.collection("admins");
    const admin = await admins.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate a JWT token for authentication
    const token = jwt.sign({ _id: admin._id }, "adminsecretkey", { expiresIn: "1h" });

    // Return the token to the client
    res.json({ token });
  } catch (err) {
    console.error("Error logging in admin:", err);
    res.status(500).json({ message: "Server error" });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

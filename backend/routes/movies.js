module.exports = (client, app, authenticate, createTextIndex, ObjectId) => {
    // Movies
    app.get("/api/movies", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const { genre, page = 1, limit = 10 } = req.query;
            console.log("Received genre query:", genre);

            let query = {};
            if (genre) {
                query = { genres: { $regex: new RegExp(genre, "i") } }; // Case-insensitive regex match
            }

            console.log("Query to be executed:", query);

            const moviesList = await movies
                .aggregate([
                    { $match: query },
                    { $addFields: { likeCount: { $size: { $ifNull: ["$likesBy", []] } } } },
                    { $sort: { likeCount: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: Number(limit) },
                ])
                .toArray();

            console.log("Movies found:", moviesList.length);
            res.status(200).json(moviesList);
        } catch (err) {
            console.error("Error fetching movies:", err);
            res
                .status(500)
                .json({
                    message:
                        "An error occurred while fetching movies. Please try again later.",
                });
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
            videoUrl: req.body.videoUrl,
        };

        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const result = await movies.insertOne(movie);

            res.status(201).json({ ...movie, _id: result.insertedId });
        } catch (err) {
            console.error("Error inserting movie:", err);
            res.status(500).json({ message: "An error occurred while adding the movie. Please try again later." });
        }
    });

    // Movie detail
    app.get("/api/movies/:id", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
            if (!movie) {
                return res.status(404).json({ message: "Movie not found" });
            }
            res.json(movie);
        } catch (err) {
            res.status(500).json({ message: err });
        }
    });


    //  movie search
    app.get('/api/movies/search', async (req, res) => {
        const query = req.query.query?.trim(); // Trim leading/trailing whitespace

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");

            console.log(`Searching for movies with text matching: ${query}`);

            // Perform text search using full-text search capabilities of MongoDB (assuming such collection exists)
            const moviesList = await movies
                .find({ $text: { $search: query } }) // Replace with your full-text search syntax if different
                .toArray();

            if (moviesList.length === 0) {
                console.log(`No movies found for query: ${query}`);
                return res.status(404).json({ message: 'No movies found matching your search' });
            }

            res.status(200).json(moviesList);
        } catch (error) {
            console.error('Error processing search request:', error);

            // Check for specific error types and return corresponding status codes
            if (error.name === 'MongoError' && error.code === 22) {
                return res.status(400).json({ message: 'Invalid search query' });
            } else if (error.name === 'MongoError' && error.code === 11600) {
                return res.status(500).json({ message: 'Internal server error: MongoDB query timeout' });
            } else {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }
    });



    // Interacted movies endpoint
    app.get("/api/movies/interacted", authenticate, async (req, res) => {
        try {
            const userId = req.user._id; // Extract user ID from authenticated user
            const database = client.db("sample_mflix");

            const likes = database.collection("likes");
            const dislikes = database.collection("dislikes");

            // Find movies liked by the user
            const likedMovies = await likes.find({ userId }).toArray();

            // Find movies disliked by the user
            const dislikedMovies = await dislikes.find({ userId }).toArray();

            // Combine liked and disliked movies
            const interactedMovies = [...likedMovies, ...dislikedMovies];

            // Get movie IDs
            const movieIds = interactedMovies.map((interaction) => interaction.movieId);

            // Find details of interacted movies
            const movies = database.collection("movies");
            const interactedMoviesDetails = await movies
                .find({ _id: { $in: movieIds.map((id) => new ObjectId(id)) } })
                .toArray();

            res.json(interactedMoviesDetails);
        } catch (err) {
            console.error("Error fetching interacted movies:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

}
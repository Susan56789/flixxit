module.exports = (client, app, authenticate, createTextIndex, ObjectId) => {

    // Movies
    app.get("/api/movies", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = await database.collection("movies");
            const { genre, page = 1, limit = 10 } = req.query;

            let query = {};
            if (genre) {
                query = { genres: { $regex: new RegExp(genre, "i") } }; // Case-insensitive regex match
            }



            const moviesList = await movies
                .aggregate([
                    { $match: query },
                    { $addFields: { likeCount: { $size: { $ifNull: ["$likesBy", []] } } } },
                    { $sort: { likeCount: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: Number(limit) },
                ])
                .toArray();

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

    // Endpoint to fetch movies by genre
    app.get('/api/movies/genre/:genre', async (req, res) => {
        const { genre } = req.params;
        try {
            const database = client.db("sample_mflix");
            const movies = await database.collection("movies");
            // Find movies by genre using MongoDB query
            const filteredMovies = await movies.find({ genre }).toArray();
            res.json(filteredMovies);
        } catch (error) {
            console.error('Failed to fetch movies by genre:', error);
            res.status(500).json({ error: 'Failed to fetch movies by genre' });
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


    // Movie Search Endpoint

    app.get("/api/search", async (req, res) => {
        const query = req.query.query || "";

        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const searchRegex = new RegExp(query, "i");
            const results = await movies.find({ title: { $regex: searchRegex } }).toArray();
            res.status(200).json(results);
        } catch (error) {
            console.error("Error fetching search results:", error);
            res.status(500).json({ message: "An error occurred while searching for movies.", error: error.message });
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
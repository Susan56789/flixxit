module.exports = (client, app, authenticate, createTextIndex, ObjectId) => {

    // Movies
    app.get("/api/movies", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = await database.collection("movies");
            const { genre, page = 1, limit = 1000 } = req.query;

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
            genres: req.body.genres || req.body.genre, // Support both fields
            rating: req.body.rating,
            year: req.body.year,
            imageUrl: req.body.imageUrl,
            videoUrl: req.body.videoUrl,
            createdAt: new Date(),
            updatedAt: new Date()
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

    // UPDATE Movie endpoint
    app.put("/api/movies/:id", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            
            const movieId = req.params.id;
            
            // Validate ObjectId
            if (!ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID format" });
            }

            const updates = {
                title: req.body.title,
                description: req.body.description,
                genre: req.body.genre,
                genres: req.body.genres || req.body.genre, // Support both fields
                rating: req.body.rating,
                year: req.body.year,
                imageUrl: req.body.imageUrl,
                videoUrl: req.body.videoUrl,
                updatedAt: new Date()
            };

            const result = await movies.updateOne(
                { _id: new ObjectId(movieId) },
                { $set: updates }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Movie not found" });
            }

            res.json({ 
                message: "Movie updated successfully", 
                movieId: movieId,
                modifiedCount: result.modifiedCount 
            });
        } catch (err) {
            console.error("Error updating movie:", err);
            res.status(500).json({ 
                message: "An error occurred while updating the movie",
                error: err.message 
            });
        }
    });

    // DELETE Movie endpoint
    app.delete("/api/movies/:id", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            
            const movieId = req.params.id;
            
            // Validate ObjectId
            if (!ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID format" });
            }

            // First, check if movie exists
            const movieToDelete = await movies.findOne({ _id: new ObjectId(movieId) });
            if (!movieToDelete) {
                return res.status(404).json({ message: "Movie not found" });
            }

            // Delete the movie
            const result = await movies.deleteOne({ _id: new ObjectId(movieId) });

            if (result.deletedCount === 0) {
                return res.status(500).json({ message: "Failed to delete movie" });
            }

            // Clean up related data (likes, dislikes, watchlists)
            try {
                const likes = database.collection("likes");
                const dislikes = database.collection("dislikes");
                const watchlists = database.collection("watchlists");
                
                // Delete all likes for this movie
                await likes.deleteMany({ movieId: movieId });
                
                // Delete all dislikes for this movie
                await dislikes.deleteMany({ movieId: movieId });
                
                // Remove movie from all watchlists
                await watchlists.updateMany(
                    { movieId: movieId },
                    { $pull: { movieId: movieId } }
                );
                
                console.log(`Cleaned up related data for movie: ${movieId}`);
            } catch (cleanupErr) {
                console.error("Error cleaning up related data:", cleanupErr);
                // Continue anyway - movie is already deleted
            }

            res.json({ 
                message: "Movie deleted successfully",
                movieId: movieId,
                title: movieToDelete.title
            });
        } catch (err) {
            console.error("Error deleting movie:", err);
            res.status(500).json({ 
                message: "An error occurred while deleting the movie",
                error: err.message 
            });
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

    // Get engagement stats for a movie (likes + dislikes)
    app.get("/api/movies/:movieId/engagement", async (req, res) => {
        try {
            const { movieId } = req.params;

            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID format" });
            }

            const [likeCount, dislikeCount] = await Promise.all([
                likes.countDocuments({ movieId }),
                dislikes.countDocuments({ movieId })
            ]);

            const totalEngagement = likeCount + dislikeCount;
            const likeRatio = totalEngagement > 0 ? (likeCount / totalEngagement * 100).toFixed(1) : 0;

            res.json({
                success: true,
                data: {
                    movieId,
                    likes: likeCount,
                    dislikes: dislikeCount,
                    totalEngagement,
                    likeRatio: parseFloat(likeRatio)
                }
            });
        } catch (err) {
            console.error("Error fetching engagement stats:", err);
            res.status(500).json({ message: err.message });
        }
    });

    // Check user's interaction status with a movie
    app.get("/api/movies/:movieId/user/:userId/status", async (req, res) => {
        try {
            const { movieId, userId } = req.params;

            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID format" });
            }

            const [hasLiked, hasDisliked] = await Promise.all([
                likes.findOne({ userId, movieId }),
                dislikes.findOne({ userId, movieId })
            ]);

            res.json({
                success: true,
                data: {
                    movieId,
                    userId,
                    hasLiked: !!hasLiked,
                    hasDisliked: !!hasDisliked
                }
            });
        } catch (err) {
            console.error("Error checking user status:", err);
            res.status(500).json({ message: err.message });
        }
    });
};


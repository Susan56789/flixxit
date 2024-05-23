module.exports = (client, app, authenticate, ObjectId) => {
    // Watchlist endpoint
    app.get('/api/watchlist/:userId', authenticate, async (req, res) => {
        try {
            const userId = req.params.userId;

            // Ensure userId is a valid ObjectId
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            const database = client.db("sample_mflix");
            const watchlist = database.collection('watchlist');

            // Find user's watchlist based on userId
            const userWatchlist = await watchlist.find({ userId: new ObjectId(userId) }).toArray();
            const movieIds = userWatchlist.map((item) => item.movieId);

            const movies = database.collection("movies");

            // Ensure movieIds are valid ObjectIds
            const validMovieIds = movieIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

            // Find movies in user's watchlist based on movieIds
            const userWatchlistMovies = await movies.find({ _id: { $in: validMovieIds } }).toArray();

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

            // Ensure movieId is a valid ObjectId
            if (!ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID" });
            }

            const existingItem = await watchlist.findOne({ userId: new ObjectId(userId), movieId: new ObjectId(movieId) });
            if (existingItem) {
                return res.status(400).json({ message: "Movie already in watchlist" });
            }

            await watchlist.insertOne({ userId: new ObjectId(userId), movieId: new ObjectId(movieId) });
            res.json({ message: "Movie added to watchlist" });
        } catch (err) {
            console.error("Error adding to watchlist:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Remove from watchlist endpoint
    app.delete('/api/watchlist/:movieId/:userId', authenticate, async (req, res) => {
        try {
            const { movieId, userId } = req.params;

            if (!ObjectId.isValid(movieId) || !ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid movie ID or user ID" });
            }

            const database = client.db("sample_mflix");

            const result = await database.collection('watchlist').deleteOne({
                userId: new ObjectId(userId),
                movieId: new ObjectId(movieId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Movie not found in watchlist" });
            }

            res.json({ message: "Movie removed from watchlist" });
        } catch (err) {
            console.error("Error removing from watchlist:", err.message);
            res.status(500).json({ message: "Server error while removing from watchlist" });
        }
    });

}
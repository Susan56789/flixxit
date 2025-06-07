module.exports = (client, app, authenticate, ObjectId) => {
    
    // Get user's watchlist with full movie details
    app.get('/api/watchlist/:userId', authenticate, async (req, res) => {
        try {
            const userId = req.params.userId;

            // Validate userId
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');
            const moviesCollection = database.collection("movies");

            // Find user's watchlist entries
            const userWatchlist = await watchlistCollection.find({ 
                userId: new ObjectId(userId) 
            }).toArray();

            if (userWatchlist.length === 0) {
                return res.json([]);
            }

            // Extract movie IDs from watchlist
            const movieIds = userWatchlist.map((item) => {
                // Handle both string and ObjectId formats
                if (typeof item.movieId === 'string' && ObjectId.isValid(item.movieId)) {
                    return new ObjectId(item.movieId);
                } else if (item.movieId instanceof ObjectId) {
                    return item.movieId;
                }
                return null;
            }).filter(id => id !== null);

            if (movieIds.length === 0) {
                return res.json([]);
            }

            // Fetch full movie details with aggregation for likes count
            const userWatchlistMovies = await moviesCollection.aggregate([
                { $match: { _id: { $in: movieIds } } },
                { 
                    $addFields: { 
                        likeCount: { $size: { $ifNull: ["$likesBy", []] } },
                        // Add watchlist date from the original watchlist entry
                        addedToWatchlistAt: {
                            $let: {
                                vars: {
                                    watchlistItem: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: userWatchlist,
                                                    cond: { $eq: ["$$this.movieId", "$_id"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: "$$watchlistItem.createdAt"
                            }
                        }
                    }
                },
                { $sort: { addedToWatchlistAt: -1 } } // Most recently added first
            ]).toArray();

            res.json(userWatchlistMovies);
        } catch (err) {
            console.error("Error fetching user's watchlist:", err);
            res.status(500).json({ 
                message: "Server error while fetching watchlist",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Add movie to watchlist
    app.post('/api/watchlist', authenticate, async (req, res) => {
        try {
            const { movieId } = req.body;
            const userId = req.user._id;

            // Validate movieId
            if (!movieId || !ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid or missing movie ID" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');
            const moviesCollection = database.collection("movies");

            // Check if movie exists
            const movieExists = await moviesCollection.findOne({ _id: new ObjectId(movieId) });
            if (!movieExists) {
                return res.status(404).json({ message: "Movie not found" });
            }

            // Check if already in watchlist
            const existingItem = await watchlistCollection.findOne({ 
                userId: new ObjectId(userId), 
                movieId: new ObjectId(movieId) 
            });

            if (existingItem) {
                return res.status(409).json({ message: "Movie already in watchlist" });
            }

            // Add to watchlist with timestamp
            const watchlistItem = {
                userId: new ObjectId(userId),
                movieId: new ObjectId(movieId),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await watchlistCollection.insertOne(watchlistItem);

            res.status(201).json({ 
                message: "Movie added to watchlist successfully",
                watchlistId: result.insertedId,
                movieId: movieId,
                addedAt: watchlistItem.createdAt
            });
        } catch (err) {
            console.error("Error adding to watchlist:", err);
            res.status(500).json({ 
                message: "Server error while adding to watchlist",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Remove movie from watchlist
    app.delete('/api/watchlist/:movieId/:userId', authenticate, async (req, res) => {
        try {
            const { movieId, userId } = req.params;

            // Validate IDs
            if (!ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid movie ID" });
            }
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            // Ensure user can only remove from their own watchlist
            if (userId !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized: Cannot modify another user's watchlist" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');

            // Remove from watchlist
            const result = await watchlistCollection.deleteOne({
                userId: new ObjectId(userId),
                movieId: new ObjectId(movieId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Movie not found in watchlist" });
            }

            res.json({ 
                message: "Movie removed from watchlist successfully",
                movieId: movieId,
                removedAt: new Date()
            });
        } catch (err) {
            console.error("Error removing from watchlist:", err);
            res.status(500).json({ 
                message: "Server error while removing from watchlist",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Check if movie is in user's watchlist
    app.get('/api/watchlist/:userId/check/:movieId', authenticate, async (req, res) => {
        try {
            const { userId, movieId } = req.params;

            // Validate IDs
            if (!ObjectId.isValid(userId) || !ObjectId.isValid(movieId)) {
                return res.status(400).json({ message: "Invalid user ID or movie ID" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');

            const exists = await watchlistCollection.findOne({
                userId: new ObjectId(userId),
                movieId: new ObjectId(movieId)
            });

            res.json({ 
                inWatchlist: !!exists,
                addedAt: exists ? exists.createdAt : null
            });
        } catch (err) {
            console.error("Error checking watchlist status:", err);
            res.status(500).json({ 
                message: "Server error while checking watchlist status",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Get watchlist count for user
    app.get('/api/watchlist/:userId/count', authenticate, async (req, res) => {
        try {
            const userId = req.params.userId;

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');

            const count = await watchlistCollection.countDocuments({
                userId: new ObjectId(userId)
            });

            res.json({ count });
        } catch (err) {
            console.error("Error getting watchlist count:", err);
            res.status(500).json({ 
                message: "Server error while getting watchlist count",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Clear entire watchlist for user
    app.delete('/api/watchlist/:userId/clear', authenticate, async (req, res) => {
        try {
            const userId = req.params.userId;

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            // Ensure user can only clear their own watchlist
            if (userId !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized: Cannot modify another user's watchlist" });
            }

            const database = client.db("sample_mflix");
            const watchlistCollection = database.collection('watchlist');

            const result = await watchlistCollection.deleteMany({
                userId: new ObjectId(userId)
            });

            res.json({ 
                message: "Watchlist cleared successfully",
                deletedCount: result.deletedCount,
                clearedAt: new Date()
            });
        } catch (err) {
            console.error("Error clearing watchlist:", err);
            res.status(500).json({ 
                message: "Server error while clearing watchlist",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });
};
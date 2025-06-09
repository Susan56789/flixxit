module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const likes = database.collection("likes");
    const dislikes = database.collection("dislikes");

    // Helper function to validate ObjectId
    const isValidObjectId = (id) => {
        try {
            return ObjectId.isValid(id);
        } catch (error) {
            return false;
        }
    };

    // Helper function to check if movie exists
    const movieExists = async (movieId) => {
        try {
            const movie = await movies.findOne({ _id: new ObjectId(movieId) });
            return !!movie;
        } catch (error) {
            return false;
        }
    };

    // Like a movie
    app.post("/api/movies/:movieId/like", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString();

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            if (!(await movieExists(movieId))) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Movie not found" 
                });
            }

            // Check if the user has already liked the movie
            const existingLike = await likes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            if (existingLike) {
                return res.status(409).json({ 
                    success: false, 
                    message: "You have already liked this movie" 
                });
            }

            // Remove dislike if exists
            await dislikes.deleteOne({ 
                userId: userId, 
                movieId: movieId 
            });

            // Create a new like
            const like = {
                _id: new ObjectId(),
                userId: userId,
                movieId: movieId,
                createdAt: new Date()
            };

            await likes.insertOne(like);

            // Update the movie document
            await movies.updateOne(
                { _id: new ObjectId(movieId) },
                {
                    $addToSet: { likesBy: userId },
                    $pull: { dislikesBy: userId }
                }
            );

            // Get updated counts
            const [likeCount, dislikeCount] = await Promise.all([
                likes.countDocuments({ movieId: movieId }),
                dislikes.countDocuments({ movieId: movieId })
            ]);

            res.status(201).json({ 
                success: true,
                message: "Movie liked successfully",
                data: {
                    movieId: movieId,
                    userId: userId,
                    likes: likeCount,
                    dislikes: dislikeCount
                }
            });

        } catch (err) {
            console.error("Error liking movie:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Toggle like (like if not liked, unlike if already liked)
    app.post("/api/movies/:movieId/like/toggle", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString();

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            if (!(await movieExists(movieId))) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Movie not found" 
                });
            }

            const existingLike = await likes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            let action = '';
            let likeCount = 0;
            let dislikeCount = 0;

            if (existingLike) {
                // Remove like
                await likes.deleteOne({ 
                    movieId: movieId, 
                    userId: userId 
                });
                
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $pull: { likesBy: userId }
                    }
                );
                action = 'unliked';
            } else {
                // Remove dislike if exists
                await dislikes.deleteOne({ 
                    userId: userId, 
                    movieId: movieId 
                });

                // Add like
                const like = {
                    _id: new ObjectId(),
                    userId: userId,
                    movieId: movieId,
                    createdAt: new Date()
                };

                await likes.insertOne(like);

                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $addToSet: { likesBy: userId },
                        $pull: { dislikesBy: userId }
                    }
                );
                action = 'liked';
            }

            // Get final counts
            [likeCount, dislikeCount] = await Promise.all([
                likes.countDocuments({ movieId: movieId }),
                dislikes.countDocuments({ movieId: movieId })
            ]);

            res.json({
                success: true,
                message: `Movie ${action} successfully`,
                data: {
                    movieId: movieId,
                    userId: userId,
                    action: action,
                    likes: likeCount,
                    dislikes: dislikeCount,
                    hasLiked: action === 'liked'
                }
            });

        } catch (err) {
            console.error("Error toggling like:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Get likes count for a movie
    app.get("/api/movies/:movieId/likes", async (req, res) => {
        try {
            const { movieId } = req.params;

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            if (!(await movieExists(movieId))) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Movie not found" 
                });
            }

            const likeCount = await likes.countDocuments({ movieId: movieId });
            
            res.json({ 
                success: true,
                data: {
                    movieId: movieId,
                    likes: likeCount
                }
            });

        } catch (err) {
            console.error("Error fetching likes count:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Check if current user has liked a specific movie
    app.get("/api/movies/:movieId/like/status", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString();

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            const hasLiked = await likes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            res.json({
                success: true,
                data: {
                    movieId: movieId,
                    userId: userId,
                    hasLiked: !!hasLiked
                }
            });

        } catch (err) {
            console.error("Error checking like status:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Remove like
    app.delete("/api/movies/:movieId/like", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString();

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            if (!(await movieExists(movieId))) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Movie not found" 
                });
            }

            // Delete the like entry
            const result = await likes.deleteOne({ 
                movieId: movieId, 
                userId: userId 
            });

            if (result.deletedCount === 1) {
                // Update the movie document
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $pull: { likesBy: userId }
                    }
                );

                const likeCount = await likes.countDocuments({ movieId: movieId });
                
                res.json({ 
                    success: true, 
                    message: "Like removed successfully",
                    data: {
                        movieId: movieId,
                        userId: userId,
                        likes: likeCount
                    }
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: "No like found to remove" 
                });
            }

        } catch (err) {
            console.error("Error removing like:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get users who liked a movie (with pagination)
    app.get("/api/movies/:movieId/likes/users", async (req, res) => {
        try {
            const { movieId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            if (!(await movieExists(movieId))) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Movie not found" 
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            // Get likes with user details
            const likedUsers = await likes
                .find({ movieId: movieId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray();

            const totalLikes = await likes.countDocuments({ movieId: movieId });

            res.json({
                success: true,
                data: {
                    movieId: movieId,
                    likes: likedUsers,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalLikes,
                        totalPages: Math.ceil(totalLikes / limitNum)
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching liked users:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get user's liked movies
    app.get("/api/users/liked-movies", authenticate, async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const { page = 1, limit = 10 } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            const likedMovies = await likes
                .find({ userId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray();

            const totalLikedMovies = await likes.countDocuments({ userId: userId });

            // Get movie details for each liked movie
            const movieIds = likedMovies.map(like => new ObjectId(like.movieId));
            const movieDetails = await movies.find({ _id: { $in: movieIds } }).toArray();

            // Map movie details to likes
            const likedMoviesWithDetails = likedMovies.map(like => {
                const movie = movieDetails.find(m => m._id.toString() === like.movieId);
                return {
                    ...like,
                    movie: movie || null
                };
            });

            res.json({
                success: true,
                data: {
                    userId: userId,
                    likedMovies: likedMoviesWithDetails,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalLikedMovies,
                        totalPages: Math.ceil(totalLikedMovies / limitNum)
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching user's liked movies:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get most liked movies
    app.get("/api/movies/most-liked", async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const limitNum = Math.min(parseInt(limit), 50); // Cap at 50

            // Aggregate to get movie counts
            const mostLiked = await likes.aggregate([
                {
                    $group: {
                        _id: "$movieId",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: limitNum }
            ]).toArray();

            // Get movie details
            const movieIds = mostLiked.map(item => new ObjectId(item._id));
            const movieDetails = await movies.find({ _id: { $in: movieIds } }).toArray();

            // Map counts to movie details
            const result = mostLiked.map(item => {
                const movie = movieDetails.find(m => m._id.toString() === item._id);
                return {
                    movie: movie,
                    likes: item.count
                };
            });

            res.json({
                success: true,
                data: result
            });

        } catch (err) {
            console.error("Error fetching most liked movies:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });
};
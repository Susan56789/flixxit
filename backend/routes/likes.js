module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const likes = database.collection("likes");
    const dislikes = database.collection("dislikes"); // Assuming you have a dislikes collection

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
        const movie = await movies.findOne({ _id: new ObjectId(movieId) });
        return !!movie;
    };

    // Like a movie
    app.post("/api/movies/:movieId/like", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString(); // Get userId from authenticated user

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

            // Use transaction for data consistency
            const session = client.startSession();
            
            try {
                await session.withTransaction(async () => {
                    // Create a new like
                    const like = {
                        _id: new ObjectId(),
                        userId: userId,
                        movieId: movieId,
                        createdAt: new Date()
                    };

                    await likes.insertOne(like, { session });

                    // Remove dislike if exists
                    await dislikes.deleteOne({ 
                        userId: userId, 
                        movieId: movieId 
                    }, { session });

                    // Update the movie document (optional: for denormalized counts)
                    await movies.updateOne(
                        { _id: new ObjectId(movieId) },
                        {
                            $addToSet: { likesBy: userId },
                            $pull: { dislikesBy: userId },
                            $inc: { 
                                likesCount: 1,
                                dislikesCount: -1 // Decrease dislikes count if user previously disliked
                            }
                        },
                        { session }
                    );
                });

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

            } finally {
                await session.endSession();
            }

        } catch (err) {
            console.error("Error liking movie:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
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

    // Get users who liked a movie (with pagination)
    app.get("/api/movies/:movieId/likes/users", authenticate, async (req, res) => {
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

            // Aggregate to get user details who liked the movie
            const pipeline = [
                { $match: { movieId: movieId } },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $unwind: "$userDetails"
                },
                {
                    $project: {
                        userId: 1,
                        userName: "$userDetails.name",
                        userEmail: "$userDetails.email",
                        createdAt: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNum }
            ];

            const likedUsers = await likes.aggregate(pipeline).toArray();
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

    // Undo like (remove like)
    app.delete("/api/movies/:movieId/like", authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.user._id.toString(); // Get userId from authenticated user

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

            // Use transaction for data consistency
            const session = client.startSession();
            
            try {
                let likeRemoved = false;

                await session.withTransaction(async () => {
                    // Delete the like entry
                    const result = await likes.deleteOne({ 
                        movieId: movieId, 
                        userId: userId 
                    }, { session });

                    if (result.deletedCount === 1) {
                        likeRemoved = true;
                        
                        // Update the movie document
                        await movies.updateOne(
                            { _id: new ObjectId(movieId) },
                            {
                                $pull: { likesBy: userId },
                                $inc: { likesCount: -1 }
                            },
                            { session }
                        );
                    }
                });

                if (likeRemoved) {
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

            } finally {
                await session.endSession();
            }

        } catch (err) {
            console.error("Error removing like:", err);
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

            const session = client.startSession();
            let action = '';
            let likeCount = 0;

            try {
                await session.withTransaction(async () => {
                    if (existingLike) {
                        // Remove like
                        await likes.deleteOne({ 
                            movieId: movieId, 
                            userId: userId 
                        }, { session });
                        
                        await movies.updateOne(
                            { _id: new ObjectId(movieId) },
                            {
                                $pull: { likesBy: userId },
                                $inc: { likesCount: -1 }
                            },
                            { session }
                        );
                        action = 'unliked';
                    } else {
                        // Add like
                        const like = {
                            _id: new ObjectId(),
                            userId: userId,
                            movieId: movieId,
                            createdAt: new Date()
                        };

                        await likes.insertOne(like, { session });

                        // Remove dislike if exists
                        await dislikes.deleteOne({ 
                            userId: userId, 
                            movieId: movieId 
                        }, { session });

                        await movies.updateOne(
                            { _id: new ObjectId(movieId) },
                            {
                                $addToSet: { likesBy: userId },
                                $pull: { dislikesBy: userId },
                                $inc: { 
                                    likesCount: 1,
                                    dislikesCount: -1
                                }
                            },
                            { session }
                        );
                        action = 'liked';
                    }
                });

                likeCount = await likes.countDocuments({ movieId: movieId });

                res.json({
                    success: true,
                    message: `Movie ${action} successfully`,
                    data: {
                        movieId: movieId,
                        userId: userId,
                        action: action,
                        likes: likeCount,
                        hasLiked: action === 'liked'
                    }
                });

            } finally {
                await session.endSession();
            }

        } catch (err) {
            console.error("Error toggling like:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get user's liked movies (with pagination)
    app.get("/api/users/liked-movies", authenticate, async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const { page = 1, limit = 10 } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            // Aggregate to get movie details that user has liked
            const pipeline = [
                { $match: { userId: userId } },
                {
                    $lookup: {
                        from: "movies",
                        localField: "movieId",
                        foreignField: "_id",
                        as: "movieDetails"
                    }
                },
                {
                    $unwind: "$movieDetails"
                },
                {
                    $project: {
                        movieId: 1,
                        movieTitle: "$movieDetails.title",
                        moviePoster: "$movieDetails.poster",
                        movieYear: "$movieDetails.year",
                        likedAt: "$createdAt"
                    }
                },
                { $sort: { likedAt: -1 } },
                { $skip: skip },
                { $limit: limitNum }
            ];

            const likedMovies = await likes.aggregate(pipeline).toArray();
            const totalLikedMovies = await likes.countDocuments({ userId: userId });

            res.json({
                success: true,
                data: {
                    userId: userId,
                    likedMovies: likedMovies,
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
};
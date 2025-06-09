// likes.js - Complete Likes Module
module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const likes = database.collection("likes");
    const dislikes = database.collection("dislikes");

    // Helper function to validate ObjectId
    const isValidObjectId = (id) => {
        try {
            return ObjectId.isValid(id) && id.length === 24;
        } catch (error) {
            return false;
        }
    };

    // Helper function to check if movie exists
    const checkMovieExists = async (movieId) => {
        try {
            const movie = await movies.findOne({ _id: new ObjectId(movieId) });
            return !!movie;
        } catch (error) {
            return false;
        }
    };

    // 1. LIKE A MOVIE (Basic)
    app.post("/api/like", async (req, res) => {
        try {
            const { userId, movieId } = req.body;
            
            console.log("Like movie request:", { userId, movieId });

            // Validate required fields
            if (!userId || !movieId) {
                return res.status(400).json({ 
                    success: false,
                    message: "userId and movieId are required" 
                });
            }

            // Validate ObjectId format
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(movieId);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            // Check if user has already liked the movie
            const existingLike = await likes.findOne({ userId, movieId });
            if (existingLike) {
                return res.status(400).json({ 
                    success: false,
                    message: "You have already liked this movie" 
                });
            }

            // Remove dislike if exists (mutual exclusivity)
            const existingDislike = await dislikes.findOne({ userId, movieId });
            if (existingDislike) {
                await dislikes.deleteOne({ userId, movieId });
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $pull: { dislikesBy: userId } }
                );
                console.log(`Removed existing dislike for user ${userId}`);
            }

            // Create a new like
            const like = { 
                userId, 
                movieId,
                createdAt: new Date()
            };
            await likes.insertOne(like);

            // Update the movie document
            await movies.updateOne(
                { _id: new ObjectId(movieId) },
                { $addToSet: { likesBy: userId } }
            );

            console.log(`User ${userId} liked movie ${movieId}`);

            res.json({ 
                success: true,
                message: "Movie liked successfully",
                data: {
                    userId,
                    movieId,
                    action: "liked"
                }
            });
        } catch (err) {
            console.error("Error liking movie:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while liking movie",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 2. TOGGLE LIKE (RESTful approach)
    app.post("/api/movies/:movieId/like/toggle", async (req, res) => {
        try {
            const { movieId } = req.params;
            const { userId } = req.body;

            console.log("Toggle like request:", { movieId, userId });

            // Validate required fields
            if (!userId) {
                return res.status(400).json({ 
                    success: false,
                    message: "userId is required in request body" 
                });
            }

            // Validate ObjectId format
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(movieId);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            // Check if user has already liked this movie
            const existingLike = await likes.findOne({ userId, movieId });
            let action = '';

            if (existingLike) {
                // Remove like
                await likes.deleteOne({ movieId, userId });
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $pull: { likesBy: userId } }
                );
                action = 'unliked';
                console.log(`User ${userId} unliked movie ${movieId}`);
            } else {
                // Remove dislike if exists (mutual exclusivity)
                const existingDislike = await dislikes.findOne({ userId, movieId });
                if (existingDislike) {
                    await dislikes.deleteOne({ userId, movieId });
                    await movies.updateOne(
                        { _id: new ObjectId(movieId) },
                        { $pull: { dislikesBy: userId } }
                    );
                    console.log(`Removed existing dislike for user ${userId}`);
                }
                
                // Add like
                const like = { 
                    userId, 
                    movieId,
                    createdAt: new Date()
                };
                await likes.insertOne(like);
                
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $addToSet: { likesBy: userId } }
                );
                action = 'liked';
                console.log(`User ${userId} liked movie ${movieId}`);
            }

            // Get updated counts
            const [likeCount, dislikeCount] = await Promise.all([
                likes.countDocuments({ movieId }),
                dislikes.countDocuments({ movieId })
            ]);

            const response = {
                success: true,
                message: `Movie ${action} successfully`,
                data: {
                    action,
                    likes: likeCount,
                    dislikes: dislikeCount,
                    hasLiked: action === 'liked',
                    movieId,
                    userId
                }
            };

            console.log("Toggle like response:", response);
            res.json(response);

        } catch (err) {
            console.error("Error toggling like:", err);
            console.error("Stack trace:", err.stack);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while toggling like",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 3. GET LIKES COUNT FOR A MOVIE
    app.get("/api/movies/:id/likes", async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log("Get likes count for movie:", id);

            // Validate ObjectId format
            if (!isValidObjectId(id)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(id);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            const likeCount = await likes.countDocuments({ movieId: id });
            
            res.json({ 
                success: true,
                data: {
                    movieId: id,
                    likes: likeCount
                }
            });
        } catch (err) {
            console.error("Error fetching likes count:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while fetching likes count",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 4. GET ALL LIKES FOR A MOVIE (with user details)
    app.get("/api/movies/:id/likes/details", async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            console.log("Get likes details for movie:", id);

            // Validate ObjectId format
            if (!isValidObjectId(id)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(id);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const likesData = await likes
                .find({ movieId: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const totalLikes = await likes.countDocuments({ movieId: id });

            res.json({ 
                success: true,
                data: {
                    movieId: id,
                    likes: likesData,
                    totalLikes,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalLikes / parseInt(limit))
                }
            });
        } catch (err) {
            console.error("Error fetching likes details:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while fetching likes details",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 5. REMOVE/UNDO LIKE
    app.delete("/api/movies/:id/likes/:userId", async (req, res) => {
        try {
            const { id, userId } = req.params;
            
            console.log("Remove like request:", { movieId: id, userId });

            // Validate ObjectId format
            if (!isValidObjectId(id)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(id);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            // Delete the like entry
            const result = await likes.deleteOne({ movieId: id, userId: userId });
            
            if (result.deletedCount === 1) {
                // Update movie document
                await movies.updateOne(
                    { _id: new ObjectId(id) },
                    { $pull: { likesBy: userId } }
                );
                
                console.log(`Like removed for user ${userId} on movie ${id}`);
                
                res.json({ 
                    success: true, 
                    message: "Like removed successfully",
                    data: {
                        movieId: id,
                        userId,
                        action: "like_removed"
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
                message: "Internal server error occurred while removing like",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 6. CHECK IF USER LIKED A MOVIE
    app.get("/api/movies/:movieId/likes/user/:userId", async (req, res) => {
        try {
            const { movieId, userId } = req.params;
            
            console.log("Check user like status:", { movieId, userId });

            // Validate ObjectId format
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format" 
                });
            }

            // Check if movie exists
            const movieExists = await checkMovieExists(movieId);
            if (!movieExists) {
                return res.status(404).json({ 
                    success: false,
                    message: "Movie not found" 
                });
            }

            const userLike = await likes.findOne({ userId, movieId });

            res.json({
                success: true,
                data: {
                    movieId,
                    userId,
                    hasLiked: !!userLike,
                    likeData: userLike
                }
            });
        } catch (err) {
            console.error("Error checking user like status:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while checking like status",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 7. GET ALL MOVIES LIKED BY A USER
    app.get("/api/users/:userId/likes", async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            console.log("Get user liked movies:", userId);

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get user's likes with movie details
            const userLikes = await likes.aggregate([
                { $match: { userId } },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: "movies",
                        localField: "movieId",
                        foreignField: "_id",
                        as: "movieDetails",
                        pipeline: [
                            {
                                $addFields: {
                                    _id: { $toString: "$_id" }
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "movies",
                        let: { movieIdStr: "$movieId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: [{ $toString: "$_id" }, "$$movieIdStr"]
                                    }
                                }
                            }
                        ],
                        as: "movie"
                    }
                },
                {
                    $unwind: {
                        path: "$movie",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        movieId: 1,
                        createdAt: 1,
                        movie: 1
                    }
                }
            ]).toArray();

            const totalLikes = await likes.countDocuments({ userId });

            res.json({
                success: true,
                data: {
                    userId,
                    likes: userLikes,
                    totalLikes,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalLikes / parseInt(limit))
                }
            });
        } catch (err) {
            console.error("Error fetching user likes:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while fetching user likes",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    console.log("✅ Likes module loaded successfully");
};
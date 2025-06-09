// dislikes.js - Complete Dislikes Module
module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const dislikes = database.collection("dislikes");
    const likes = database.collection("likes");

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

    // 1. DISLIKE A MOVIE (Basic)
    app.post("/api/dislike", async (req, res) => {
        try {
            const { userId, movieId } = req.body;
            
            console.log("Dislike movie request:", { userId, movieId });

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

            // Check if user has already disliked the movie
            const existingDislike = await dislikes.findOne({ userId, movieId });
            if (existingDislike) {
                return res.status(400).json({ 
                    success: false,
                    message: "You have already disliked this movie" 
                });
            }

            // Remove like if exists (mutual exclusivity)
            const existingLike = await likes.findOne({ userId, movieId });
            if (existingLike) {
                await likes.deleteOne({ userId, movieId });
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $pull: { likesBy: userId } }
                );
                console.log(`Removed existing like for user ${userId}`);
            }

            // Create a new dislike
            const dislike = { 
                userId, 
                movieId,
                createdAt: new Date()
            };
            await dislikes.insertOne(dislike);

            // Update the movie document
            await movies.updateOne(
                { _id: new ObjectId(movieId) },
                { $addToSet: { dislikesBy: userId } }
            );

            console.log(`User ${userId} disliked movie ${movieId}`);

            res.json({ 
                success: true,
                message: "Movie disliked successfully",
                data: {
                    userId,
                    movieId,
                    action: "disliked"
                }
            });
        } catch (err) {
            console.error("Error disliking movie:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while disliking movie",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 2. TOGGLE DISLIKE (RESTful approach)
    app.post("/api/movies/:movieId/dislike/toggle", async (req, res) => {
        try {
            const { movieId } = req.params;
            const { userId } = req.body;

            console.log("Toggle dislike request:", { movieId, userId });

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

            // Check if user has already disliked this movie
            const existingDislike = await dislikes.findOne({ userId, movieId });
            let action = '';

            if (existingDislike) {
                // Remove dislike
                await dislikes.deleteOne({ movieId, userId });
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $pull: { dislikesBy: userId } }
                );
                action = 'undisliked';
                console.log(`User ${userId} undisliked movie ${movieId}`);
            } else {
                // Remove like if exists (mutual exclusivity)
                const existingLike = await likes.findOne({ userId, movieId });
                if (existingLike) {
                    await likes.deleteOne({ userId, movieId });
                    await movies.updateOne(
                        { _id: new ObjectId(movieId) },
                        { $pull: { likesBy: userId } }
                    );
                    console.log(`Removed existing like for user ${userId}`);
                }
                
                // Add dislike
                const dislike = { 
                    userId, 
                    movieId,
                    createdAt: new Date()
                };
                await dislikes.insertOne(dislike);
                
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    { $addToSet: { dislikesBy: userId } }
                );
                action = 'disliked';
                console.log(`User ${userId} disliked movie ${movieId}`);
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
                    hasDisliked: action === 'disliked',
                    movieId,
                    userId
                }
            };

            console.log("Toggle dislike response:", response);
            res.json(response);

        } catch (err) {
            console.error("Error toggling dislike:", err);
            console.error("Stack trace:", err.stack);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while toggling dislike",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 3. GET DISLIKES COUNT FOR A MOVIE
    app.get("/api/movies/:id/dislikes", async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log("Get dislikes count for movie:", id);

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

            const dislikeCount = await dislikes.countDocuments({ movieId: id });
            
            res.json({ 
                success: true,
                data: {
                    movieId: id,
                    dislikes: dislikeCount
                }
            });
        } catch (err) {
            console.error("Error fetching dislikes count:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while fetching dislikes count",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 4. GET ALL DISLIKES FOR A MOVIE (with user details)
    app.get("/api/movies/:id/dislikes/details", async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            console.log("Get dislikes details for movie:", id);

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
            
            const dislikesData = await dislikes
                .find({ movieId: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const totalDislikes = await dislikes.countDocuments({ movieId: id });

            res.json({ 
                success: true,
                data: {
                    movieId: id,
                    dislikes: dislikesData,
                    totalDislikes,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalDislikes / parseInt(limit))
                }
            });
        } catch (err) {
            console.error("Error fetching dislikes details:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while fetching dislikes details",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 5. REMOVE/UNDO DISLIKE
    app.delete("/api/movies/:id/dislikes/:userId", async (req, res) => {
        try {
            const { id, userId } = req.params;
            
            console.log("Remove dislike request:", { movieId: id, userId });

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

            // Delete the dislike entry
            const result = await dislikes.deleteOne({ movieId: id, userId: userId });
            
            if (result.deletedCount === 1) {
                // Update movie document
                await movies.updateOne(
                    { _id: new ObjectId(id) },
                    { $pull: { dislikesBy: userId } }
                );
                
                console.log(`Dislike removed for user ${userId} on movie ${id}`);
                
                res.json({ 
                    success: true, 
                    message: "Dislike removed successfully",
                    data: {
                        movieId: id,
                        userId,
                        action: "dislike_removed"
                    }
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: "No dislike found to remove" 
                });
            }
        } catch (err) {
            console.error("Error removing dislike:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while removing dislike",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 6. CHECK IF USER DISLIKED A MOVIE
    app.get("/api/movies/:movieId/dislikes/user/:userId", async (req, res) => {
        try {
            const { movieId, userId } = req.params;
            
            console.log("Check user dislike status:", { movieId, userId });

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

            const userDislike = await dislikes.findOne({ userId, movieId });

            res.json({
                success: true,
                data: {
                    movieId,
                    userId,
                    hasDisliked: !!userDislike,
                    dislikeData: userDislike
                }
            });
        } catch (err) {
            console.error("Error checking user dislike status:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error occurred while checking dislike status",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 7. GET ALL MOVIES DISLIKED BY A USER
    app.get("/api/users/:userId/dislikes", async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            console.log("Get user disliked movies:", userId);

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get user's dislikes with movie details
            const userDislikes = await dislikes.aggregate([
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
                                $project: {
                                    title: 1,
                                    year: 1,
                                    poster: 1,
                                    plot: 1,
                                    genres: 1,
                                    runtime: 1,
                                    imdb: 1,
                                    directors: 1,
                                    cast: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        movie: { $arrayElemAt: ["$movieDetails", 0] }
                    }
                },
                {
                    $project: {
                        movieDetails: 0
                    }
                }
            ]).toArray();

            const totalUserDislikes = await dislikes.countDocuments({ userId });

            res.json({
                success: true,
                data: {
                    userId,
                    dislikes: userDislikes,
                    totalDislikes: totalUserDislikes,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalUserDislikes / parseInt(limit))
                }
            });
        } catch (err) {
            console.error("Error fetching user dislikes:", err);
            res.status(500).json({
                success: false,
                message: "Internal server error occurred while fetching user dislikes",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 8. GET DISLIKE STATISTICS FOR A MOVIE
    app.get("/api/movies/:id/stats/dislikes", async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log("Get dislike statistics for movie:", id);

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

            // Get comprehensive statistics
            const [
                totalDislikes,
                totalLikes,
                recentDislikes,
                firstDislike,
                lastDislike
            ] = await Promise.all([
                dislikes.countDocuments({ movieId: id }),
                likes.countDocuments({ movieId: id }),
                dislikes.countDocuments({ 
                    movieId: id, 
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
                }),
                dislikes.findOne({ movieId: id }, { sort: { createdAt: 1 } }),
                dislikes.findOne({ movieId: id }, { sort: { createdAt: -1 } })
            ]);

            const totalEngagement = totalLikes + totalDislikes;
            const dislikePercentage = totalEngagement > 0 ? ((totalDislikes / totalEngagement) * 100).toFixed(2) : 0;

            res.json({
                success: true,
                data: {
                    movieId: id,
                    totalDislikes,
                    totalLikes,
                    totalEngagement,
                    dislikePercentage: parseFloat(dislikePercentage),
                    recentDislikes: recentDislikes,
                    firstDislikeDate: firstDislike?.createdAt || null,
                    lastDislikeDate: lastDislike?.createdAt || null
                }
            });
        } catch (err) {
            console.error("Error fetching dislike statistics:", err);
            res.status(500).json({
                success: false,
                message: "Internal server error occurred while fetching dislike statistics",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 9. BULK OPERATIONS - Remove all dislikes for a movie (Admin only)
    app.delete("/api/movies/:id/dislikes/all", authenticate, async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log("Bulk remove dislikes for movie:", id);

            // Check if user has admin privileges (assuming req.user is set by authenticate middleware)
            if (!req.user || !req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Admin privileges required"
                });
            }

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

            // Remove all dislikes for the movie
            const result = await dislikes.deleteMany({ movieId: id });
            
            // Update movie document to remove all dislikesBy entries
            await movies.updateOne(
                { _id: new ObjectId(id) },
                { $unset: { dislikesBy: 1 } }
            );

            console.log(`Removed ${result.deletedCount} dislikes for movie ${id}`);

            res.json({
                success: true,
                message: `Successfully removed all dislikes for movie`,
                data: {
                    movieId: id,
                    dislikesRemoved: result.deletedCount
                }
            });
        } catch (err) {
            console.error("Error in bulk dislike removal:", err);
            res.status(500).json({
                success: false,
                message: "Internal server error occurred during bulk dislike removal",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // 10. GET TOP DISLIKED MOVIES
    app.get("/api/movies/top-disliked", async (req, res) => {
        try {
            const { limit = 10, page = 1 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            console.log("Get top disliked movies");

            const topDislikedMovies = await dislikes.aggregate([
                {
                    $group: {
                        _id: "$movieId",
                        dislikeCount: { $sum: 1 },
                        firstDislike: { $min: "$createdAt" },
                        lastDislike: { $max: "$createdAt" }
                    }
                },
                { $sort: { dislikeCount: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: "movies",
                        localField: "_id",
                        foreignField: "_id",
                        as: "movieDetails",
                        pipeline: [
                            {
                                $project: {
                                    title: 1,
                                    year: 1,
                                    poster: 1,
                                    plot: 1,
                                    genres: 1,
                                    runtime: 1,
                                    imdb: 1,
                                    directors: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        movie: { $arrayElemAt: ["$movieDetails", 0] }
                    }
                },
                {
                    $project: {
                        movieDetails: 0
                    }
                }
            ]).toArray();

            const totalMoviesWithDislikes = await dislikes.aggregate([
                { $group: { _id: "$movieId" } },
                { $count: "total" }
            ]).toArray();

            const total = totalMoviesWithDislikes[0]?.total || 0;

            res.json({
                success: true,
                data: {
                    movies: topDislikedMovies,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalMoviesWithDislikes: total
                }
            });
        } catch (err) {
            console.error("Error fetching top disliked movies:", err);
            res.status(500).json({
                success: false,
                message: "Internal server error occurred while fetching top disliked movies",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    console.log("Dislikes module loaded successfully");
};
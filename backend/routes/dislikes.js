// Replace the existing dislikes.js backend file with this fixed version

module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const dislikes = database.collection("dislikes");
    const likes = database.collection("likes");

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

    // Dislike a movie
    app.post("/api/movies/:movieId/dislike", authenticate, async (req, res) => {
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

            // Check if the user has already disliked the movie
            const existingDislike = await dislikes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            if (existingDislike) {
                return res.status(409).json({ 
                    success: false, 
                    message: "You have already disliked this movie" 
                });
            }

            // Remove like if exists
            await likes.deleteOne({ 
                userId: userId, 
                movieId: movieId 
            });

            // Create a new dislike
            const dislike = {
                _id: new ObjectId(),
                userId: userId,
                movieId: movieId,
                createdAt: new Date()
            };

            await dislikes.insertOne(dislike);

            // Update the movie document
            await movies.updateOne(
                { _id: new ObjectId(movieId) },
                {
                    $addToSet: { dislikesBy: userId },
                    $pull: { likesBy: userId }
                }
            );

            // Get updated counts
            const [dislikeCount, likeCount] = await Promise.all([
                dislikes.countDocuments({ movieId: movieId }),
                likes.countDocuments({ movieId: movieId })
            ]);

            res.status(201).json({ 
                success: true,
                message: "Movie disliked successfully",
                data: {
                    movieId: movieId,
                    userId: userId,
                    dislikes: dislikeCount,
                    likes: likeCount
                }
            });

        } catch (err) {
            console.error("Error disliking movie:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Toggle dislike (dislike if not disliked, undislike if already disliked)
    app.post("/api/movies/:movieId/dislike/toggle", authenticate, async (req, res) => {
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

            const existingDislike = await dislikes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            let action = '';
            let likeCount = 0;
            let dislikeCount = 0;

            if (existingDislike) {
                // Remove dislike
                await dislikes.deleteOne({ 
                    movieId: movieId, 
                    userId: userId 
                });
                
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $pull: { dislikesBy: userId }
                    }
                );
                action = 'undisliked';
            } else {
                // Remove like if exists
                await likes.deleteOne({ 
                    userId: userId, 
                    movieId: movieId 
                });

                // Add dislike
                const dislike = {
                    _id: new ObjectId(),
                    userId: userId,
                    movieId: movieId,
                    createdAt: new Date()
                };

                await dislikes.insertOne(dislike);

                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $addToSet: { dislikesBy: userId },
                        $pull: { likesBy: userId }
                    }
                );
                action = 'disliked';
            }

            // Get final counts
            [dislikeCount, likeCount] = await Promise.all([
                dislikes.countDocuments({ movieId: movieId }),
                likes.countDocuments({ movieId: movieId })
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
                    hasDisliked: action === 'disliked'
                }
            });

        } catch (err) {
            console.error("Error toggling dislike:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    // Get dislikes count for a movie
    app.get("/api/movies/:movieId/dislikes", async (req, res) => {
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

            const dislikeCount = await dislikes.countDocuments({ movieId: movieId });
            
            res.json({ 
                success: true,
                data: {
                    movieId: movieId,
                    dislikes: dislikeCount
                },
                dislikes: dislikeCount
            });

        } catch (err) {
            console.error("Error fetching dislikes count:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Check if current user has disliked a specific movie
    app.get("/api/movies/:movieId/dislike/status", authenticate, async (req, res) => {
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

            const hasDisliked = await dislikes.findOne({ 
                userId: userId, 
                movieId: movieId 
            });

            res.json({
                success: true,
                data: {
                    movieId: movieId,
                    userId: userId,
                    hasDisliked: !!hasDisliked
                }
            });

        } catch (err) {
            console.error("Error checking dislike status:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Remove dislike
    app.delete("/api/movies/:movieId/dislike", authenticate, async (req, res) => {
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

            // Delete the dislike entry
            const result = await dislikes.deleteOne({ 
                movieId: movieId, 
                userId: userId 
            });

            if (result.deletedCount === 1) {
                // Update the movie document
                await movies.updateOne(
                    { _id: new ObjectId(movieId) },
                    {
                        $pull: { dislikesBy: userId }
                    }
                );

                const dislikeCount = await dislikes.countDocuments({ movieId: movieId });
                
                res.json({ 
                    success: true, 
                    message: "Dislike removed successfully",
                    data: {
                        movieId: movieId,
                        userId: userId,
                        dislikes: dislikeCount
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
                message: "Internal server error" 
            });
        }
    });

    // Get users who disliked a movie (with pagination)
    app.get("/api/movies/:movieId/dislikes/users", async (req, res) => {
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

            // Get dislikes with user details
            const dislikedUsers = await dislikes
                .find({ movieId: movieId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray();

            const totalDislikes = await dislikes.countDocuments({ movieId: movieId });

            res.json({
                success: true,
                data: {
                    movieId: movieId,
                    dislikes: dislikedUsers,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalDislikes,
                        totalPages: Math.ceil(totalDislikes / limitNum)
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching disliked users:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get user's disliked movies
    app.get("/api/users/disliked-movies", authenticate, async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const { page = 1, limit = 10 } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            const dislikedMovies = await dislikes
                .find({ userId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray();

            const totalDislikedMovies = await dislikes.countDocuments({ userId: userId });

            // Get movie details for each disliked movie
            const movieIds = dislikedMovies.map(dislike => new ObjectId(dislike.movieId));
            const movieDetails = await movies.find({ _id: { $in: movieIds } }).toArray();

            // Map movie details to dislikes
            const dislikedMoviesWithDetails = dislikedMovies.map(dislike => {
                const movie = movieDetails.find(m => m._id.toString() === dislike.movieId);
                return {
                    ...dislike,
                    movie: movie || null
                };
            });

            res.json({
                success: true,
                data: {
                    userId: userId,
                    dislikedMovies: dislikedMoviesWithDetails,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalDislikedMovies,
                        totalPages: Math.ceil(totalDislikedMovies / limitNum)
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching user's disliked movies:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get movie engagement stats (likes + dislikes)
    app.get("/api/movies/:movieId/engagement", async (req, res) => {
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

            const [dislikeCount, likeCount] = await Promise.all([
                dislikes.countDocuments({ movieId: movieId }),
                likes.countDocuments({ movieId: movieId })
            ]);

            const totalEngagement = likeCount + dislikeCount;
            const likeRatio = totalEngagement > 0 ? (likeCount / totalEngagement * 100).toFixed(1) : 0;
            const dislikeRatio = totalEngagement > 0 ? (dislikeCount / totalEngagement * 100).toFixed(1) : 0;

            res.json({
                success: true,
                data: {
                    movieId: movieId,
                    likes: likeCount,
                    dislikes: dislikeCount,
                    totalEngagement: totalEngagement,
                    likeRatio: parseFloat(likeRatio),
                    dislikeRatio: parseFloat(dislikeRatio),
                    engagement: {
                        high: totalEngagement > 100,
                        medium: totalEngagement > 20 && totalEngagement <= 100,
                        low: totalEngagement <= 20
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching engagement stats:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Bulk operations - Get engagement stats for multiple movies
    app.post("/api/movies/bulk/engagement", async (req, res) => {
        try {
            const { movieIds } = req.body;

            if (!Array.isArray(movieIds) || movieIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "movieIds must be a non-empty array"
                });
            }

            // Validate all movieIds
            const invalidIds = movieIds.filter(id => !isValidObjectId(id));
            if (invalidIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid movie ID format",
                    invalidIds: invalidIds
                });
            }

            // Get engagement stats for all movies
            const engagementStats = await Promise.all(
                movieIds.map(async (movieId) => {
                    const [dislikeCount, likeCount] = await Promise.all([
                        dislikes.countDocuments({ movieId: movieId }),
                        likes.countDocuments({ movieId: movieId })
                    ]);

                    const totalEngagement = likeCount + dislikeCount;
                    const likeRatio = totalEngagement > 0 ? (likeCount / totalEngagement * 100).toFixed(1) : 0;
                    const dislikeRatio = totalEngagement > 0 ? (dislikeCount / totalEngagement * 100).toFixed(1) : 0;

                    return {
                        movieId: movieId,
                        likes: likeCount,
                        dislikes: dislikeCount,
                        totalEngagement: totalEngagement,
                        likeRatio: parseFloat(likeRatio),
                        dislikeRatio: parseFloat(dislikeRatio)
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    engagementStats: engagementStats,
                    summary: {
                        totalMovies: movieIds.length,
                        averageEngagement: engagementStats.reduce((sum, stat) => sum + stat.totalEngagement, 0) / movieIds.length
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching bulk engagement stats:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });
};
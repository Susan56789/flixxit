module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");
    const dislikes = database.collection("dislikes");
    const likes = database.collection("likes"); // Assuming you have a likes collection

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

    // Dislike a movie
    app.post("/api/movies/:movieId/dislike", authenticate, async (req, res) => {
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

            // Use transaction for data consistency
            const session = client.startSession();
            
            try {
                await session.withTransaction(async () => {
                    // Create a new dislike
                    const dislike = {
                        _id: new ObjectId(),
                        userId: userId,
                        movieId: movieId,
                        createdAt: new Date()
                    };

                    await dislikes.insertOne(dislike, { session });

                    // Remove like if exists (assuming you have a likes collection)
                    await likes.deleteOne({ 
                        userId: userId, 
                        movieId: movieId 
                    }, { session });

                    // Update the movie document (optional: for denormalized counts)
                    await movies.updateOne(
                        { _id: new ObjectId(movieId) },
                        {
                            $addToSet: { dislikesBy: userId },
                            $pull: { likesBy: userId },
                            $inc: { 
                                dislikesCount: 1,
                                likesCount: -1 // Decrease likes count if user previously liked
                            }
                        },
                        { session }
                    );
                });

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

            } finally {
                await session.endSession();
            }

        } catch (err) {
            console.error("Error disliking movie:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
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
                }
            });

        } catch (err) {
            console.error("Error fetching dislikes count:", err);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    });

    // Get users who disliked a movie (with pagination)
    app.get("/api/movies/:movieId/dislikes/users", authenticate, async (req, res) => {
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

            // Aggregate to get user details who disliked the movie
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

            const dislikedUsers = await dislikes.aggregate(pipeline).toArray();
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

    // Undo dislike (remove dislike)
    app.delete("/api/movies/:movieId/dislike", authenticate, async (req, res) => {
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
                let dislikeRemoved = false;

                await session.withTransaction(async () => {
                    // Delete the dislike entry
                    const result = await dislikes.deleteOne({ 
                        movieId: movieId, 
                        userId: userId 
                    }, { session });

                    if (result.deletedCount === 1) {
                        dislikeRemoved = true;
                        
                        // Update the movie document
                        await movies.updateOne(
                            { _id: new ObjectId(movieId) },
                            {
                                $pull: { dislikesBy: userId },
                                $inc: { dislikesCount: -1 }
                            },
                            { session }
                        );
                    }
                });

                if (dislikeRemoved) {
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

            } finally {
                await session.endSession();
            }

        } catch (err) {
            console.error("Error removing dislike:", err);
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
                    dislikeRatio: parseFloat(dislikeRatio)
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
};
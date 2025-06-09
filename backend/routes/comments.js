const express = require('express');
const router = express.Router();

module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const comments = database.collection("comments");
    const users = database.collection("users");

    // Helper function to validate ObjectId
    const isValidObjectId = (id) => {
        try {
            return ObjectId.isValid(id);
        } catch (error) {
            return false;
        }
    };

    // Fetch comments for a specific movie with pagination and user details
    app.get('/api/movies/:movieId/comments', async (req, res) => {
        try {
            const { movieId } = req.params;
            const { page = 1, limit = 10, sort = 'newest' } = req.query;

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format." 
                });
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            // Determine sort order
            const sortOrder = sort === 'oldest' ? 1 : -1;

            // Use aggregation pipeline for better performance
            const pipeline = [
                {
                    $match: { movieId: new ObjectId(movieId) }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $addFields: {
                        userName: {
                            $cond: {
                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                then: {
                                    $cond: {
                                        if: { 
                                            $and: [
                                                { $ne: [{ $arrayElemAt: ["$userDetails.username", 0] }, null] },
                                                { $ne: [{ $arrayElemAt: ["$userDetails.username", 0] }, ""] }
                                            ]
                                        },
                                        then: { $arrayElemAt: ["$userDetails.username", 0] },
                                        else: {
                                            $cond: {
                                                if: { 
                                                    $and: [
                                                        { $ne: [{ $arrayElemAt: ["$userDetails.name", 0] }, null] },
                                                        { $ne: [{ $arrayElemAt: ["$userDetails.name", 0] }, ""] }
                                                    ]
                                                },
                                                then: { $arrayElemAt: ["$userDetails.name", 0] },
                                                else: "Anonymous User"
                                            }
                                        }
                                    }
                                },
                                else: "Unknown User"
                            }
                        }
                    }
                },
                {
                    $project: {
                        userDetails: 0 // Remove the joined user details array
                    }
                },
                {
                    $sort: { createdAt: sortOrder }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limitNum
                }
            ];

            const movieComments = await comments.aggregate(pipeline).toArray();

            // Get total count for pagination metadata
            const totalComments = await comments.countDocuments({ movieId: new ObjectId(movieId) });

            res.json({
                success: true,
                data: {
                    comments: movieComments,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalComments,
                        totalPages: Math.ceil(totalComments / limitNum)
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching comments:", error);
            res.status(500).json({ 
                success: false,
                message: "Error fetching comments." 
            });
        }
    });

    // Post a new comment to a specific movie
    app.post('/api/movies/:movieId/comments', authenticate, async (req, res) => {
        try {
            const { movieId } = req.params;
            const { text } = req.body;
            const userId = req.user._id;

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format." 
                });
            }

            // Validate comment text
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Comment text is required and cannot be empty.' 
                });
            }

            // Check text length (optional: set a reasonable limit)
            const trimmedText = text.trim();
            if (trimmedText.length > 1000) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Comment text is too long. Maximum 1000 characters allowed.' 
                });
            }

            // Get the proper username from the authenticated user
            const username = req.user.username || req.user.name || 'Anonymous';

            // Comment object
            const comment = {
                _id: new ObjectId(),
                userId: new ObjectId(userId),
                movieId: new ObjectId(movieId),
                userName: username, // Store username in comment for better performance
                text: trimmedText,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Insert the comment into the comments collection
            const result = await comments.insertOne(comment);

            if (result.acknowledged) {
                // Return the comment with proper structure
                const responseComment = {
                    _id: comment._id,
                    userId: comment.userId,
                    userName: comment.userName,
                    text: comment.text,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                };
                
                res.status(201).json({
                    success: true,
                    message: 'Comment posted successfully',
                    data: responseComment
                });
            } else {
                res.status(500).json({ 
                    success: false,
                    message: 'Failed to post comment.' 
                });
            }

        } catch (error) {
            console.error('Error posting comment:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    });

    // Update a comment (bonus feature)
    app.put('/api/movies/:movieId/comments/:commentId', authenticate, async (req, res) => {
        try {
            const { movieId, commentId } = req.params;
            const { text } = req.body;
            const userId = req.user._id;

            // Validate IDs
            if (!isValidObjectId(movieId) || !isValidObjectId(commentId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid ID format." 
                });
            }

            // Validate text
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Comment text is required and cannot be empty.' 
                });
            }

            const trimmedText = text.trim();
            if (trimmedText.length > 1000) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Comment text is too long. Maximum 1000 characters allowed.' 
                });
            }

            // Update comment (only if user owns it)
            const result = await comments.updateOne(
                { 
                    _id: new ObjectId(commentId),
                    movieId: new ObjectId(movieId),
                    userId: new ObjectId(userId)
                },
                { 
                    $set: { 
                        text: trimmedText,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Comment not found or you do not have permission to edit it.' 
                });
            }

            if (result.modifiedCount === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No changes were made to the comment.' 
                });
            }

            res.json({ 
                success: true,
                message: 'Comment updated successfully.' 
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    });

    // Delete a comment (bonus feature)
    app.delete('/api/movies/:movieId/comments/:commentId', authenticate, async (req, res) => {
        try {
            const { movieId, commentId } = req.params;
            const userId = req.user._id;

            // Validate IDs
            if (!isValidObjectId(movieId) || !isValidObjectId(commentId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid ID format." 
                });
            }

            // Delete comment (only if user owns it)
            const result = await comments.deleteOne({
                _id: new ObjectId(commentId),
                movieId: new ObjectId(movieId),
                userId: new ObjectId(userId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Comment not found or you do not have permission to delete it.' 
                });
            }

            res.json({ 
                success: true,
                message: 'Comment deleted successfully.' 
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    });

    // Get comments count for a movie
    app.get('/api/movies/:movieId/comments/count', async (req, res) => {
        try {
            const { movieId } = req.params;

            // Validate movieId
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid movie ID format." 
                });
            }

            const commentCount = await comments.countDocuments({ movieId: new ObjectId(movieId) });
            
            res.json({ 
                success: true,
                data: {
                    movieId: movieId,
                    commentCount: commentCount
                }
            });

        } catch (err) {
            console.error("Error fetching comment count:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error" 
            });
        }
    });

    // Get user's comments (with pagination)
    app.get("/api/users/comments", authenticate, async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const { page = 1, limit = 10 } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            // Aggregate to get movie details for user's comments
            const pipeline = [
                { $match: { userId: new ObjectId(userId) } },
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
                        commentId: "$_id",
                        movieId: 1,
                        movieTitle: "$movieDetails.title",
                        moviePoster: "$movieDetails.poster",
                        movieYear: "$movieDetails.year",
                        commentText: "$text",
                        commentedAt: "$createdAt",
                        updatedAt: 1
                    }
                },
                { $sort: { commentedAt: -1 } },
                { $skip: skip },
                { $limit: limitNum }
            ];

            const userComments = await comments.aggregate(pipeline).toArray();
            const totalComments = await comments.countDocuments({ userId: new ObjectId(userId) });

            res.json({
                success: true,
                data: {
                    userId: userId,
                    comments: userComments,
                    pagination: {
                        page: parseInt(page),
                        limit: limitNum,
                        total: totalComments,
                        totalPages: Math.ceil(totalComments / limitNum)
                    }
                }
            });

        } catch (err) {
            console.error("Error fetching user's comments:", err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error" 
            });
        }
    });

    app.use('/api/movies', router);
};
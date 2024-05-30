const express = require('express');
const router = express.Router();

module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const comments = database.collection("comments");
    const users = database.collection("users");

    // Fetch comments for a specific movie
    app.get('/api/movies/:movieId/comments', async (req, res) => {
        try {
            const movieId = req.params.movieId;
            const movieComments = await comments.find({ movieId: new ObjectId(movieId) }).toArray();

            if (!movieComments.length) {
                return res.status(404).json({ message: "No comments found for this movie." });
            }

            // Fetch user details for each comment
            const commentDetails = await Promise.all(movieComments.map(async (comment) => {
                const user = await users.findOne({ _id: new ObjectId(comment.userId) });
                return {
                    ...comment,
                    userName: user ? user.name : 'Unknown User',
                };
            }));

            res.json(commentDetails);
        } catch (error) {
            console.error("Error fetching comments:", error);
            res.status(500).json({ message: "Error fetching comments." });
        }
    });

    // Post a new comment to a specific movie
    app.post('/api/movies/:movieId/comments', authenticate, async (req, res) => {
        const movieId = req.params.movieId;
        const { text } = req.body;
        const userId = req.user._id;

        // Check for empty text
        if (!text) {
            return res.status(400).json({ message: 'Comment text is required.' });
        }

        // Comment object
        const comment = {
            userId: new ObjectId(userId),
            userName: req.user.username,
            text,
            createdAt: new Date(),
        };

        try {
            // Insert the comment into the comments collection
            const result = await comments.insertOne({ ...comment, movieId: new ObjectId(movieId) });

            if (result.acknowledged) {
                res.status(201).json(comment);
            } else {
                res.status(500).json({ message: 'Failed to post comment.' });
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.use('/api/movies', router);
};

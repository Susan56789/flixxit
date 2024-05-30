module.exports = (client, app, authenticate, ObjectId) => {
    const database = client.db("sample_mflix");
    const comments = database.collection("comments");
    const users = database.collection("users");

    // Fetch comments for a specific movie
    app.get('/api/movies/:id/comments', async (req, res) => {
        try {
            const movieId = req.params.id;
            const movieComments = await comments.find({ movieId: new ObjectId(movieId) }).toArray();

            if (!movieComments) {
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
    app.post('/api/movies/:id/comments', authenticate, async (req, res) => {
        try {
            const movieId = req.params.id;
            const { text } = req.body;
            const userId = req.user._id;

            if (!text || text.trim() === '') {
                return res.status(400).json({ message: "Comment text cannot be empty." });
            }

            const newComment = {
                movieId: new ObjectId(movieId),
                userId: new ObjectId(userId),
                text,
                createdAt: new Date(),
            };

            const result = await comments.insertOne(newComment);

            if (result.insertedCount === 1) {
                res.status(201).json({
                    ...newComment,
                    _id: result.insertedId,
                    userName: req.user.name,
                });
            } else {
                res.status(500).json({ message: "Failed to post comment." });
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            res.status(500).json({ message: "Error posting comment." });
        }
    });
};

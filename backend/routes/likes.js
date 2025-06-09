module.exports = (client, app, ObjectId) => {
    // Likes
    app.post("/api/like", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const likes = database.collection("likes");
            const { userId, movieId } = req.body;

            // Check if the user has already liked the movie
            const existingLike = await likes.findOne({ userId, movieId });
            if (existingLike) {
                return res
                    .status(400)
                    .json({ message: "You have already liked this movie" });
            }

            // Create a new like
            const like = { userId, movieId };
            await likes.insertOne(like);

            // Update the movie document
            const result = await movies.updateOne(
                { _id: new ObjectId(movieId) },
                { $addToSet: { likesBy: userId } }
            );

            res.json({ message: "Movie liked" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    //GET LIKES COUNT

    app.get("/api/movies/:id/likes", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const likes = database.collection("likes");
            const { id } = req.params;

            const likeCount = await likes.countDocuments({ movieId: id });
            res.json({ likes: likeCount });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // UNDO LIKE
    app.delete("/api/movies/:id/likes/:userId", async (req, res) => {
        try {
            const { id, userId } = req.params;
            const database = client.db("sample_mflix");
            const likes = database.collection("likes");

            // Delete the like entry associated with the user and movie
            const result = await likes.deleteOne({ movieId: id, userId: userId });

            if (result.deletedCount === 1) {
                // If like entry was successfully deleted
                res.json({ success: true, message: "Like undone successfully" });
            } else {
                // If no like entry was found to delete
                res.status(404).json({ success: false, message: "No like found to undo" });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });
}
module.exports = (client, app, ObjectId) => {

    // Dislikes
    app.post("/api/dislike", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const movies = database.collection("movies");
            const dislikes = database.collection("dislikes");
            const { userId, movieId } = req.body;

            // Check if the user has already disliked the movie
            const existingDislike = await dislikes.findOne({ userId, movieId });
            if (existingDislike) {
                return res
                    .status(400)
                    .json({ message: "You have already disliked this movie" });
            }

            // Create a new dislike
            const dislike = { userId, movieId };
            await dislikes.insertOne(dislike);

            // Update the movie document
            const result = await movies.updateOne(
                { _id: new ObjectId(movieId) },
                {
                    $addToSet: { dislikesBy: userId },
                    $pull: { likesBy: userId },
                }
            );

            res.json({ message: "Movie disliked" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });



    //GET DISLIKES COUNT

    app.get("/api/movies/:id/dislikes", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const dislikes = database.collection("dislikes");
            const { id } = req.params;

            const dislikeCount = await dislikes.countDocuments({ movieId: id });
            res.json({ dislikes: dislikeCount });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // UNDO DISLIKE
    app.delete("/api/movies/:id/dislikes/:userId", async (req, res) => {
        try {
            const { id, userId } = req.params;
            const database = client.db("sample_mflix");
            const dislikes = database.collection("dislikes");

            // Delete the dislike entry associated with the user and movie
            const result = await dislikes.deleteOne({ movieId: id, userId: userId });

            if (result.deletedCount === 1) {
                // If dislike entry was successfully deleted
                res.json({ success: true, message: "Dislike undone successfully" });
            } else {
                // If no dislike entry was found to delete
                res.status(404).json({ success: false, message: "No dislike found to undo" });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });
}
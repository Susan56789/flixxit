module.exports = (client, app) => {
    // Get all genres
    app.get("/api/genres", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const genres = database.collection("genres");
            const allGenres = await genres.find().toArray();
            res.json(allGenres);
        } catch (err) {
            console.error("Error fetching genres:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Get genre by name
    app.get("/api/genres/:name", async (req, res) => {
        try {
            const { name } = req.params;
            const database = client.db("sample_mflix");
            const genres = database.collection("genres");
            const genre = await genres.findOne({ name: name });
            if (!genre) {
                return res.status(404).json({ message: "Genre not found" });
            }
            res.json(genre);
        } catch (err) {
            console.error("Error fetching genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });



    // Add a new genre
    app.post("/api/genres", async (req, res) => {
        try {
            const { name } = req.body;

            // Check if genre with the same name already exists
            const database = client.db("sample_mflix");
            const genres = database.collection("genres");
            const existingGenre = await genres.findOne({ name });
            if (existingGenre) {
                return res.status(400).json({ message: "Genre already exists" });
            }

            // Insert the new genre
            const result = await genres.insertOne({ name });
            res.json(result.ops[0]);
        } catch (err) {
            console.error("Error adding genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Update an existing genre
    app.put("/api/genres/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            // Check if genre with the given ID exists
            const database = client.db("sample_mflix");
            const genres = database.collection("genres");
            const existingGenre = await genres.findOne({ _id: new ObjectId(id) });
            if (!existingGenre) {
                return res.status(404).json({ message: "Genre not found" });
            }

            // Update the genre name
            await genres.updateOne({ _id: new ObjectId(id) }, { $set: { name } });
            res.json({ message: "Genre updated successfully" });
        } catch (err) {
            console.error("Error updating genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Delete a genre
    app.delete("/api/genres/:id", async (req, res) => {
        try {
            const { id } = req.params;

            // Check if genre with the given ID exists
            const database = client.db("sample_mflix");
            const genres = database.collection("genres");
            const existingGenre = await genres.findOne({ _id: new ObjectId(id) });
            if (!existingGenre) {
                return res.status(404).json({ message: "Genre not found" });
            }

            // Delete the genre
            await genres.deleteOne({ _id: new ObjectId(id) });
            res.json({ message: "Genre deleted successfully" });
        } catch (err) {
            console.error("Error deleting genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

}
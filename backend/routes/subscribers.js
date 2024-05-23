module.exports = (client, app) => {

    // Subscribers
    app.post("/api/subscribe", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const subscribers = database.collection("subscribers");
            const { userId, movieId } = req.body;

            // Check if the user has already subscribed to the movie
            const existingSubscription = await subscribers.findOne({ userId, movieId });
            if (existingSubscription) {
                return res
                    .status(400)
                    .json({ message: "You have already subscribed to this movie" });
            }

            // Create a new subscription
            const subscription = { userId, movieId };
            const result = await subscribers.insertOne(subscription);
            res.json(result.ops[0]);
        } catch (err) {
            res.status(500).json({ message: err });
        }
    });
}
module.exports = (client, app, ObjectId) => {

    // Subscription 
    app.post("/api/subscribe", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const { userId } = req.body;

            // Update the user's subscription status
            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { subscriptionStatus: "Premium" } }
            );

            res.json({ message: "Subscription successful" });
        } catch (err) {
            console.error("Error subscribing:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    app.post("/api/set-preferred-genre", async (req, res) => {
        try {
            const { userId, genre } = req.body;

            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { preferredGenre: genre } }
            );

            res.json({ message: "Preferred genre saved successfully" });
        } catch (err) {
            console.error("Error saving preferred genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });


    // Define subscription options and costs
    const subscriptionOptions = {
        monthly: {
            cost: 10,
            duration: '1 month'
        },
        yearly: {
            cost: 100,
            duration: '1 year'
        },
        semiAnnually: {
            cost: 50,
            duration: '6 months'
        }
    };

    // Route to handle subscription status request
    app.get("/api/subscription-status", (req, res) => {
        // Retrieve subscription status for the user (you can fetch this from your database)
        const subscriptionStatus = {}; // Implement logic to fetch subscription status

        // Send subscription status along with available options and costs
        res.json({ subscriptionStatus, subscriptionOptions });
    });


}
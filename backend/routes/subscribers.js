module.exports = (client, app, ObjectId) => {
    // Define subscription options with durations in days
    const subscriptionOptions = {
        monthly: {
            cost: 10,
            duration: '1 month',
            days: 30
        },
        quarterly: {
            cost: 25,
            duration: '3 months',
            days: 90
        },
        semiAnnually: {
            cost: 50,
            duration: '6 months',
            days: 180
        },
        yearly: {
            cost: 100,
            duration: '1 year',
            days: 365
        }
    };

    // Helper function to calculate expiration date
    const calculateExpirationDate = (subscriptionType) => {
        const now = new Date();
        const days = subscriptionOptions[subscriptionType]?.days || 30;
        return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    };

    // Helper function to check if subscription is expired
    const isSubscriptionExpired = (expirationDate) => {
        return new Date() > new Date(expirationDate);
    };

    // Subscription endpoint
    app.post("/api/subscribe", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const { userId, subscriptionType } = req.body;

            // Validate subscription type
            if (!subscriptionOptions[subscriptionType]) {
                return res.status(400).json({ 
                    message: "Invalid subscription type",
                    availableTypes: Object.keys(subscriptionOptions)
                });
            }

            const expirationDate = calculateExpirationDate(subscriptionType);

            // Update the user's subscription status
            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        subscriptionStatus: "Premium",
                        subscriptionType: subscriptionType,
                        subscriptionStartDate: new Date(),
                        subscriptionExpirationDate: expirationDate,
                        subscriptionActive: true
                    } 
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({ 
                message: "Subscription successful",
                subscriptionType,
                expirationDate,
                cost: subscriptionOptions[subscriptionType].cost
            });
        } catch (err) {
            console.error("Error subscribing:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Set preferred genre endpoint
    app.post("/api/set-preferred-genre", async (req, res) => {
        try {
            const { userId, genre } = req.body;

            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { preferredGenre: genre } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({ message: "Preferred genre saved successfully" });
        } catch (err) {
            console.error("Error saving preferred genre:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Enhanced subscription status endpoint
    app.get("/api/subscription-status", async (req, res) => {
        try {
            const { userId } = req.query;
            
            if (!userId) {
                return res.json({
                    subscriptionStatus: {
                        status: "Free",
                        subscribed: false,
                        plan: "",
                        expirationDate: null,
                        daysRemaining: 0
                    },
                    subscriptionOptions
                });
            }

            const database = client.db("sample_mflix");
            const users = database.collection("users");

            // Find user and get subscription details
            const user = await users.findOne({ _id: new ObjectId(userId) });
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            let subscriptionStatus = {
                status: "Free",
                subscribed: false,
                plan: "",
                expirationDate: null,
                daysRemaining: 0
            };

            // Check if user has subscription data
            if (user.subscriptionExpirationDate) {
                const isExpired = isSubscriptionExpired(user.subscriptionExpirationDate);
                
                if (isExpired) {
                    // Update user to free if subscription expired
                    await users.updateOne(
                        { _id: new ObjectId(userId) },
                        { 
                            $set: { 
                                subscriptionStatus: "Free",
                                subscriptionActive: false
                            }
                        }
                    );
                    
                    subscriptionStatus = {
                        status: "Expired",
                        subscribed: false,
                        plan: user.subscriptionType || "",
                        expirationDate: user.subscriptionExpirationDate,
                        daysRemaining: 0,
                        expiredOn: user.subscriptionExpirationDate
                    };
                } else {
                    // Calculate days remaining
                    const now = new Date();
                    const expirationDate = new Date(user.subscriptionExpirationDate);
                    const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
                    
                    subscriptionStatus = {
                        status: "Premium",
                        subscribed: true,
                        plan: user.subscriptionType || "",
                        expirationDate: user.subscriptionExpirationDate,
                        daysRemaining: Math.max(0, daysRemaining),
                        startDate: user.subscriptionStartDate
                    };
                }
            }

            res.json({ 
                subscriptionStatus, 
                subscriptionOptions 
            });
        } catch (err) {
            console.error("Error fetching subscription status:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // New endpoint to check and update expired subscriptions (can be called by a cron job)
    app.post("/api/check-expired-subscriptions", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const now = new Date();
            
            // Find all users with expired subscriptions that are still marked as active
            const expiredUsers = await users.find({
                subscriptionExpirationDate: { $lt: now },
                subscriptionActive: true
            }).toArray();

            // Update expired subscriptions
            const updateResult = await users.updateMany(
                {
                    subscriptionExpirationDate: { $lt: now },
                    subscriptionActive: true
                },
                {
                    $set: {
                        subscriptionStatus: "Free",
                        subscriptionActive: false
                    }
                }
            );

            res.json({
                message: "Expired subscriptions updated",
                expiredCount: updateResult.modifiedCount,
                expiredUsers: expiredUsers.map(user => ({
                    id: user._id,
                    email: user.email,
                    expiredOn: user.subscriptionExpirationDate
                }))
            });
        } catch (err) {
            console.error("Error checking expired subscriptions:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // New endpoint to extend subscription
    app.post("/api/extend-subscription", async (req, res) => {
        try {
            const { userId, subscriptionType } = req.body;
            const database = client.db("sample_mflix");
            const users = database.collection("users");

            if (!subscriptionOptions[subscriptionType]) {
                return res.status(400).json({ 
                    message: "Invalid subscription type",
                    availableTypes: Object.keys(subscriptionOptions)
                });
            }

            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Calculate new expiration date
            let newExpirationDate;
            if (user.subscriptionExpirationDate && !isSubscriptionExpired(user.subscriptionExpirationDate)) {
                // Extend from current expiration date if not expired
                const currentExpiration = new Date(user.subscriptionExpirationDate);
                const days = subscriptionOptions[subscriptionType].days;
                newExpirationDate = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));
            } else {
                // Start fresh if no subscription or expired
                newExpirationDate = calculateExpirationDate(subscriptionType);
            }

            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        subscriptionStatus: "Premium",
                        subscriptionType: subscriptionType,
                        subscriptionExpirationDate: newExpirationDate,
                        subscriptionActive: true,
                        lastExtendedDate: new Date()
                    } 
                }
            );

            res.json({ 
                message: "Subscription extended successfully",
                newExpirationDate,
                subscriptionType,
                cost: subscriptionOptions[subscriptionType].cost
            });
        } catch (err) {
            console.error("Error extending subscription:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Get subscription statistics (admin endpoint)
app.get("/api/subscription-stats", async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        const now = new Date();
        
        // Aggregate subscription statistics
        const stats = await users.aggregate([
            {
                $group: {
                    _id: "$subscriptionStatus",
                    count: { $sum: 1 },
                    users: { 
                        $push: {
                            id: "$_id",
                            email: "$email",
                            subscriptionType: "$subscriptionType",
                            expirationDate: "$subscriptionExpirationDate"
                        }
                    }
                }
            }
        ]).toArray();

        // Count expiring soon (within 7 days)
        const expiringSoon = await users.countDocuments({
            subscriptionExpirationDate: {
                $gte: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            subscriptionActive: true
        });

        // Count expired but still marked as active (needs cleanup)
        const needsCleanup = await users.countDocuments({
            subscriptionExpirationDate: { $lt: now },
            subscriptionActive: true
        });

        // Revenue calculation (basic)
        const revenueByPlan = await users.aggregate([
            {
                $match: {
                    subscriptionType: { $exists: true },
                    subscriptionActive: true
                }
            },
            {
                $group: {
                    _id: "$subscriptionType",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const revenue = revenueByPlan.reduce((total, plan) => {
            const planCost = subscriptionOptions[plan._id]?.cost || 0;
            return total + (plan.count * planCost);
        }, 0);

        res.json({
            totalUsers: await users.countDocuments(),
            subscriptionBreakdown: stats,
            expiringSoon,
            needsCleanup,
            estimatedMonthlyRevenue: revenue,
            revenueByPlan,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error("Error fetching subscription stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Cancel subscription endpoint
app.post("/api/cancel-subscription", async (req, res) => {
    try {
        const { userId, reason } = req.body;
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    subscriptionStatus: "Free",
                    subscriptionActive: false,
                    cancellationDate: new Date(),
                    cancellationReason: reason || "User requested"
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ 
            message: "Subscription cancelled successfully",
            cancellationDate: new Date()
        });
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Reactivate subscription endpoint
app.post("/api/reactivate-subscription", async (req, res) => {
    try {
        const { userId, subscriptionType } = req.body;
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        if (!subscriptionOptions[subscriptionType]) {
            return res.status(400).json({ 
                message: "Invalid subscription type",
                availableTypes: Object.keys(subscriptionOptions)
            });
        }

        const expirationDate = calculateExpirationDate(subscriptionType);

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    subscriptionStatus: "Premium",
                    subscriptionType: subscriptionType,
                    subscriptionExpirationDate: expirationDate,
                    subscriptionActive: true,
                    reactivationDate: new Date()
                },
                $unset: {
                    cancellationDate: "",
                    cancellationReason: ""
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ 
            message: "Subscription reactivated successfully",
            subscriptionType,
            expirationDate,
            reactivationDate: new Date()
        });
    } catch (error) {
        console.error("Error reactivating subscription:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get users expiring soon (admin endpoint)
app.get("/api/users-expiring-soon", async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const users = database.collection("users");
        
        const days = parseInt(req.query.days) || 7;
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const expiringUsers = await users.find({
            subscriptionExpirationDate: {
                $gte: now,
                $lte: futureDate
            },
            subscriptionActive: true
        }).toArray();

        res.json({
            count: expiringUsers.length,
            users: expiringUsers.map(user => ({
                id: user._id,
                email: user.email,
                username: user.username,
                subscriptionType: user.subscriptionType,
                expirationDate: user.subscriptionExpirationDate,
                daysRemaining: Math.ceil((new Date(user.subscriptionExpirationDate) - now) / (1000 * 60 * 60 * 24))
            }))
        });
    } catch (error) {
        console.error("Error fetching expiring users:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Send reminder emails endpoint (admin)
app.post("/api/send-expiration-reminders", async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const users = database.collection("users");
        
        const days = parseInt(req.body.days) || 3;
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const expiringUsers = await users.find({
            subscriptionExpirationDate: {
                $gte: now,
                $lte: futureDate
            },
            subscriptionActive: true,
            lastReminderSent: { $not: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } // Not sent in last 24 hours
        }).toArray();

        // Mark users as having received reminders
        const userIds = expiringUsers.map(user => user._id);
        if (userIds.length > 0) {
            await users.updateMany(
                { _id: { $in: userIds } },
                { $set: { lastReminderSent: new Date() } }
            );
        }

        // Here you would integrate with your email service
        // For now, we'll just log the action
        console.log(`Would send reminders to ${expiringUsers.length} users`);

        res.json({
            message: "Reminders sent successfully",
            remindersSent: expiringUsers.length,
            users: expiringUsers.map(user => ({
                email: user.email,
                daysRemaining: Math.ceil((new Date(user.subscriptionExpirationDate) - now) / (1000 * 60 * 60 * 24))
            }))
        });
    } catch (error) {
        console.error("Error sending reminders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update subscription plan endpoint
app.post("/api/update-subscription-plan", async (req, res) => {
    try {
        const { userId, newSubscriptionType } = req.body;
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        if (!subscriptionOptions[newSubscriptionType]) {
            return res.status(400).json({ 
                message: "Invalid subscription type",
                availableTypes: Object.keys(subscriptionOptions)
            });
        }

        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate new expiration based on current status
        let newExpirationDate;
        if (user.subscriptionExpirationDate && !isSubscriptionExpired(user.subscriptionExpirationDate)) {
            // Extend from current expiration if not expired
            const currentExpiration = new Date(user.subscriptionExpirationDate);
            const days = subscriptionOptions[newSubscriptionType].days;
            newExpirationDate = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));
        } else {
            // Start fresh if no subscription or expired
            newExpirationDate = calculateExpirationDate(newSubscriptionType);
        }

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    subscriptionStatus: "Premium",
                    subscriptionType: newSubscriptionType,
                    subscriptionExpirationDate: newExpirationDate,
                    subscriptionActive: true,
                    planUpdatedDate: new Date()
                }
            }
        );

        res.json({ 
            message: "Subscription plan updated successfully",
            newSubscriptionType,
            newExpirationDate,
            updatedDate: new Date()
        });
    } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({ message: "Server error" });
    }
});

    // Get subscription history endpoint
    app.get("/api/subscription-history/:userId", async (req, res) => {
        try {
            const { userId } = req.params;
            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const user = await users.findOne({ _id: new ObjectId(userId) });
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const history = {
                currentStatus: user.subscriptionStatus || "Free",
                subscriptionType: user.subscriptionType || null,
                startDate: user.subscriptionStartDate || null,
                expirationDate: user.subscriptionExpirationDate || null,
                lastExtended: user.lastExtendedDate || null,
                isActive: user.subscriptionActive || false
            };

            res.json(history);
        } catch (err) {
            console.error("Error fetching subscription history:", err);
            res.status(500).json({ message: "Server error" });
        }
    });
};
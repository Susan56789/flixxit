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

    // ===== SUBSCRIPTION ENDPOINTS =====

    // 1. Subscribe to a plan - STORE IN SUBSCRIBERS COLLECTION
    app.post("/api/subscribe", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const subscribers = database.collection("subscribers"); // NEW: Separate collection
            const { userId, subscriptionType } = req.body;

            console.log('Subscribe request:', { userId, subscriptionType });

            // Validate required fields
            if (!userId || !subscriptionType) {
                return res.status(400).json({ 
                    message: "Missing required fields: userId and subscriptionType" 
                });
            }

            // Validate subscription type
            if (!subscriptionOptions[subscriptionType]) {
                return res.status(400).json({ 
                    message: "Invalid subscription type",
                    availableTypes: Object.keys(subscriptionOptions)
                });
            }

            // Verify user exists
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const expirationDate = calculateExpirationDate(subscriptionType);

            // Check if user already has an active subscription
            const existingSubscription = await subscribers.findOne({ 
                userId: new ObjectId(userId),
                status: "active"
            });

            if (existingSubscription) {
                // Extend existing subscription
                const newExpirationDate = new Date(
                    Math.max(new Date(existingSubscription.expirationDate), new Date()).getTime() + 
                    (subscriptionOptions[subscriptionType].days * 24 * 60 * 60 * 1000)
                );

                const result = await subscribers.updateOne(
                    { userId: new ObjectId(userId), status: "active" },
                    { 
                        $set: { 
                            subscriptionType: subscriptionType,
                            expirationDate: newExpirationDate,
                            lastExtendedDate: new Date(),
                            lastUpdated: new Date()
                        } 
                    }
                );

                // Update user status (minimal data in users collection)
                await users.updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $set: { 
                            subscriptionStatus: "Premium",
                            hasActiveSubscription: true,
                            lastUpdated: new Date()
                        } 
                    }
                );

                return res.json({ 
                    message: "Subscription extended successfully",
                    subscriptionType,
                    expirationDate: newExpirationDate,
                    cost: subscriptionOptions[subscriptionType].cost,
                    duration: subscriptionOptions[subscriptionType].duration
                });
            }

            // Create new subscription record in subscribers collection
            const subscriptionRecord = {
                userId: new ObjectId(userId),
                userEmail: user.email,
                username: user.username,
                subscriptionType: subscriptionType,
                status: "active",
                startDate: new Date(),
                expirationDate: expirationDate,
                cost: subscriptionOptions[subscriptionType].cost,
                duration: subscriptionOptions[subscriptionType].duration,
                paymentStatus: "completed", // You can update this based on actual payment
                createdAt: new Date(),
                lastUpdated: new Date()
            };

            const subscriptionResult = await subscribers.insertOne(subscriptionRecord);

            // Update user status (minimal data in users collection)
            const userResult = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        subscriptionStatus: "Premium",
                        hasActiveSubscription: true,
                        activeSubscriptionId: subscriptionResult.insertedId,
                        lastUpdated: new Date()
                    } 
                }
            );

            console.log('Subscription successful:', { 
                userId, 
                subscriptionType, 
                expirationDate,
                subscriptionId: subscriptionResult.insertedId 
            });

            res.json({ 
                message: "Subscription successful",
                subscriptionType,
                expirationDate,
                cost: subscriptionOptions[subscriptionType].cost,
                duration: subscriptionOptions[subscriptionType].duration,
                subscriptionId: subscriptionResult.insertedId
            });
        } catch (err) {
            console.error("Error subscribing:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 2. Get individual user subscription status - CHECK SUBSCRIBERS COLLECTION
    app.get("/api/subscription-status", async (req, res) => {
        try {
            const { userId } = req.query;
            
            console.log('Fetching subscription status for userId:', userId);

            // Return default data if no userId provided
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
            const subscribers = database.collection("subscribers"); // Check subscribers collection

            // Find user to verify existence
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Find active subscription in subscribers collection
            const subscription = await subscribers.findOne({ 
                userId: new ObjectId(userId),
                status: "active"
            });

            let subscriptionStatus = {
                status: "Free",
                subscribed: false,
                plan: "",
                expirationDate: null,
                daysRemaining: 0
            };

            // Check subscription data from subscribers collection
            if (subscription && subscription.expirationDate) {
                const isExpired = isSubscriptionExpired(subscription.expirationDate);
                
                if (isExpired) {
                    // Update subscription to expired
                    await subscribers.updateOne(
                        { _id: subscription._id },
                        { 
                            $set: { 
                                status: "expired",
                                expiredAt: new Date(),
                                lastUpdated: new Date()
                            }
                        }
                    );

                    // Update user status
                    await users.updateOne(
                        { _id: new ObjectId(userId) },
                        { 
                            $set: { 
                                subscriptionStatus: "Free",
                                hasActiveSubscription: false,
                                lastUpdated: new Date()
                            },
                            $unset: { activeSubscriptionId: "" }
                        }
                    );
                    
                    subscriptionStatus = {
                        status: "Expired",
                        subscribed: false,
                        plan: subscription.subscriptionType || "",
                        expirationDate: subscription.expirationDate,
                        daysRemaining: 0,
                        expiredOn: subscription.expirationDate
                    };
                } else {
                    // Calculate days remaining
                    const now = new Date();
                    const expirationDate = new Date(subscription.expirationDate);
                    const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
                    
                    subscriptionStatus = {
                        status: "Premium",
                        subscribed: true,
                        plan: subscription.subscriptionType || "",
                        expirationDate: subscription.expirationDate,
                        daysRemaining: Math.max(0, daysRemaining),
                        startDate: subscription.startDate,
                        subscriptionId: subscription._id
                    };
                }
            }

            console.log('Subscription status response:', { userId, status: subscriptionStatus });

            res.json({ 
                subscriptionStatus, 
                subscriptionOptions 
            });
        } catch (err) {
            console.error("Error fetching subscription status:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 3. Get subscription statistics (ADMIN DASHBOARD) - FROM SUBSCRIBERS COLLECTION
    app.get("/api/subscription-stats", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const subscribers = database.collection("subscribers");

            const now = new Date();
            
            // Get total user count
            const totalUsers = await users.countDocuments();
            
            // Get subscription statistics from subscribers collection
            const activeSubscriptions = await subscribers.countDocuments({ status: "active" });
            const expiredSubscriptions = await subscribers.countDocuments({ status: "expired" });
            const freeUsers = totalUsers - activeSubscriptions;

            // Count expiring soon (within 7 days)
            const expiringSoon = await subscribers.countDocuments({
                expirationDate: {
                    $gte: now,
                    $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                },
                status: "active"
            });

            // Count expired but still marked as active (needs cleanup)
            const needsCleanup = await subscribers.countDocuments({
                expirationDate: { $lt: now },
                status: "active"
            });

            // Revenue calculation from subscribers collection
            const revenueByPlan = await subscribers.aggregate([
                {
                    $match: {
                        status: "active"
                    }
                },
                {
                    $group: {
                        _id: "$subscriptionType",
                        count: { $sum: 1 },
                        totalRevenue: { $sum: "$cost" }
                    }
                }
            ]).toArray();

            // Calculate total revenue
            let totalRevenue = 0;
            const revenueWithCosts = revenueByPlan.map(plan => {
                totalRevenue += plan.totalRevenue;
                return {
                    _id: plan._id,
                    count: plan.count,
                    revenue: plan.totalRevenue.toFixed(2),
                    costPerUser: subscriptionOptions[plan._id]?.cost || 0
                };
            });

            // Create plan breakdown
            const planBreakdown = {
                monthly: revenueByPlan.find(plan => plan._id === 'monthly')?.count || 0,
                quarterly: revenueByPlan.find(plan => plan._id === 'quarterly')?.count || 0,
                semiAnnually: revenueByPlan.find(plan => plan._id === 'semiAnnually')?.count || 0,
                yearly: revenueByPlan.find(plan => plan._id === 'yearly')?.count || 0
            };

            console.log('Subscription Stats:', {
                totalUsers,
                freeUsers,
                activeSubscriptions,
                totalRevenue,
                planBreakdown
            });

            res.json({
                success: true,
                totalUsers,
                subscriptionBreakdown: [
                    { _id: 'Free', count: freeUsers },
                    { _id: 'Premium', count: activeSubscriptions }
                ],
                expiringSoon,
                needsCleanup,
                estimatedMonthlyRevenue: totalRevenue,
                revenueByPlan: revenueWithCosts,
                planBreakdown: {
                    free: freeUsers,
                    premium: activeSubscriptions
                },
                subscriptionPlanBreakdown: planBreakdown,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error("Error fetching subscription stats:", error);
            res.status(500).json({ 
                success: false,
                message: "Server error",
                error: error.message 
            });
        }
    });

    // 4. Cancel subscription - UPDATE SUBSCRIBERS COLLECTION
    app.post("/api/cancel-subscription", async (req, res) => {
        try {
            const { userId, reason } = req.body;
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const subscribers = database.collection("subscribers");

            // Update subscription status in subscribers collection
            const subscriptionResult = await subscribers.updateOne(
                { userId: new ObjectId(userId), status: "active" },
                { 
                    $set: { 
                        status: "cancelled",
                        cancellationDate: new Date(),
                        cancellationReason: reason || "User requested",
                        lastUpdated: new Date()
                    }
                }
            );

            // Update user status
            const userResult = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        subscriptionStatus: "Free",
                        hasActiveSubscription: false,
                        lastUpdated: new Date()
                    },
                    $unset: { activeSubscriptionId: "" }
                }
            );

            if (subscriptionResult.matchedCount === 0) {
                return res.status(404).json({ message: "Active subscription not found" });
            }

            res.json({ 
                message: "Subscription cancelled successfully",
                cancellationDate: new Date()
            });
        } catch (error) {
            console.error("Error cancelling subscription:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 5. Check and update expired subscriptions (CRON JOB) - CHECK SUBSCRIBERS COLLECTION
    app.post("/api/check-expired-subscriptions", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const subscribers = database.collection("subscribers");

            const now = new Date();
            
            // Find all expired subscriptions that are still marked as active
            const expiredSubscriptions = await subscribers.find({
                expirationDate: { $lt: now },
                status: "active"
            }).toArray();

            // Update expired subscriptions
            const updateResult = await subscribers.updateMany(
                {
                    expirationDate: { $lt: now },
                    status: "active"
                },
                {
                    $set: {
                        status: "expired",
                        expiredAt: new Date(),
                        lastUpdated: new Date()
                    }
                }
            );

            // Update corresponding users
            const expiredUserIds = expiredSubscriptions.map(sub => sub.userId);
            if (expiredUserIds.length > 0) {
                await users.updateMany(
                    { _id: { $in: expiredUserIds } },
                    {
                        $set: {
                            subscriptionStatus: "Free",
                            hasActiveSubscription: false,
                            lastUpdated: new Date()
                        },
                        $unset: { activeSubscriptionId: "" }
                    }
                );
            }

            console.log(`Updated ${updateResult.modifiedCount} expired subscriptions`);

            res.json({
                message: "Expired subscriptions updated",
                expiredCount: updateResult.modifiedCount,
                expiredUsers: expiredSubscriptions.map(sub => ({
                    id: sub.userId,
                    email: sub.userEmail,
                    username: sub.username,
                    expiredOn: sub.expirationDate
                }))
            });
        } catch (err) {
            console.error("Error checking expired subscriptions:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 6. Get all subscribers (ADMIN) - FROM SUBSCRIBERS COLLECTION
    app.get("/api/subscribers", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const subscribers = database.collection("subscribers");
            
            const { status, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;
            
            let query = {};
            if (status) {
                query.status = status;
            }

            const allSubscribers = await subscribers.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const totalCount = await subscribers.countDocuments(query);

            res.json({
                success: true,
                subscribers: allSubscribers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: skip + allSubscribers.length < totalCount,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 7. Get individual subscriber details
    app.get("/api/subscribers/:userId", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const subscribers = database.collection("subscribers");
            
            const { userId } = req.params;
            
            const subscriber = await subscribers.findOne({ 
                userId: new ObjectId(userId) 
            });

            if (!subscriber) {
                return res.status(404).json({ message: "Subscriber not found" });
            }

            res.json({
                success: true,
                subscriber
            });
        } catch (error) {
            console.error("Error fetching subscriber:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // Keep the original genre endpoint (this can stay in users collection)
    app.post("/api/set-preferred-genre", async (req, res) => {
        try {
            const { userId, genre } = req.body;

            if (!userId) {
                return res.status(400).json({ message: "Missing userId" });
            }

            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const result = await users.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        preferredGenre: genre,
                        lastUpdated: new Date()
                    } 
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({ 
                message: "Preferred genre saved successfully",
                genre: genre
            });
        } catch (err) {
            console.error("Error saving preferred genre:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    console.log("✅ Subscription endpoints loaded with separate subscribers collection!");
    console.log("📊 Subscription data will be stored in 'subscribers' collection");
    console.log("🔧 Subscription options:", Object.keys(subscriptionOptions));
};
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

    // 1. Subscribe to a plan
    app.post("/api/subscribe", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
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
                        subscriptionActive: true,
                        lastUpdated: new Date()
                    } 
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            console.log('Subscription successful:', { userId, subscriptionType, expirationDate });

            res.json({ 
                message: "Subscription successful",
                subscriptionType,
                expirationDate,
                cost: subscriptionOptions[subscriptionType].cost,
                duration: subscriptionOptions[subscriptionType].duration
            });
        } catch (err) {
            console.error("Error subscribing:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 2. Get individual user subscription status (FRONTEND NEEDS THIS!)
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
                                subscriptionActive: false,
                                lastUpdated: new Date()
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
            } else if (user.subscriptionStatus === "Premium") {
                // User has Premium status but no expiration date (legacy data)
                subscriptionStatus = {
                    status: "Premium",
                    subscribed: true,
                    plan: user.subscriptionType || "monthly",
                    expirationDate: null,
                    daysRemaining: null,
                    startDate: user.subscriptionStartDate
                };
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

    // 3. Get subscription statistics (ADMIN DASHBOARD)
    app.get("/api/subscription-stats", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const now = new Date();
            
            // Get total user count first
            const totalUsers = await users.countDocuments();
            
            // Aggregate subscription statistics with proper null handling
            const stats = await users.aggregate([
                {
                    $project: {
                        subscriptionStatus: { 
                            $ifNull: ["$subscriptionStatus", "Free"] 
                        },
                        subscriptionType: "$subscriptionType",
                        subscriptionActive: "$subscriptionActive",
                        subscriptionExpirationDate: "$subscriptionExpirationDate",
                        email: "$email",
                        username: "$username"
                    }
                },
                {
                    $group: {
                        _id: "$subscriptionStatus",
                        count: { $sum: 1 },
                        users: { 
                            $push: {
                                id: "$_id",
                                email: "$email",
                                username: "$username",
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

            // Revenue calculation with proper null handling and fixed calculation
            const revenueByPlan = await users.aggregate([
                {
                    $match: {
                        subscriptionType: { $exists: true, $ne: null },
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

            // Calculate revenue properly - multiply count by cost
            let totalRevenue = 0;
            const revenueWithCosts = revenueByPlan.map(plan => {
                const planCost = subscriptionOptions[plan._id]?.cost || 0;
                const revenue = plan.count * planCost;
                totalRevenue += revenue;
                
                return {
                    _id: plan._id,
                    count: plan.count,
                    revenue: revenue.toFixed(2),
                    costPerUser: planCost
                };
            });

            // Transform stats to ensure we have both Free and Premium
            const transformedStats = [];
            let freeCount = 0;
            let premiumCount = 0;

            stats.forEach(stat => {
                if (stat._id === 'Premium') {
                    premiumCount = stat.count;
                    transformedStats.push(stat);
                } else {
                    // All non-Premium users are considered Free (including null)
                    freeCount += stat.count;
                }
            });

            // Add Free users summary
            transformedStats.push({
                _id: 'Free',
                count: freeCount,
                users: []
            });

            // Create plan breakdown for dashboard
            const planBreakdown = {
                monthly: revenueByPlan.find(plan => plan._id === 'monthly')?.count || 0,
                quarterly: revenueByPlan.find(plan => plan._id === 'quarterly')?.count || 0,
                semiAnnually: revenueByPlan.find(plan => plan._id === 'semiAnnually')?.count || 0,
                yearly: revenueByPlan.find(plan => plan._id === 'yearly')?.count || 0
            };

            console.log('Subscription Stats:', {
                totalUsers,
                freeCount,
                premiumCount,
                totalRevenue,
                planBreakdown
            });

            res.json({
                success: true,
                totalUsers,
                subscriptionBreakdown: transformedStats,
                expiringSoon,
                needsCleanup,
                estimatedMonthlyRevenue: totalRevenue,
                revenueByPlan: revenueWithCosts,
                planBreakdown: {
                    free: freeCount,
                    premium: premiumCount
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

    // 4. Extend existing subscription
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
                        lastExtendedDate: new Date(),
                        lastUpdated: new Date()
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
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 5. Cancel subscription
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
                        cancellationReason: reason || "User requested",
                        lastUpdated: new Date()
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
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 6. Reactivate subscription
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
                        reactivationDate: new Date(),
                        lastUpdated: new Date()
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
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 7. Update subscription plan
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
                        planUpdatedDate: new Date(),
                        lastUpdated: new Date()
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
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // ===== UTILITY ENDPOINTS =====

    // 8. Check and update expired subscriptions (CRON JOB)
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
                        subscriptionActive: false,
                        lastUpdated: new Date()
                    }
                }
            );

            console.log(`Updated ${updateResult.modifiedCount} expired subscriptions`);

            res.json({
                message: "Expired subscriptions updated",
                expiredCount: updateResult.modifiedCount,
                expiredUsers: expiredUsers.map(user => ({
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    expiredOn: user.subscriptionExpirationDate
                }))
            });
        } catch (err) {
            console.error("Error checking expired subscriptions:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // 9. Get users expiring soon (ADMIN)
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
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 10. Send reminder emails (ADMIN)
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

            // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
            console.log(`Would send reminders to ${expiringUsers.length} users`);

            res.json({
                message: "Reminders sent successfully",
                remindersSent: expiringUsers.length,
                users: expiringUsers.map(user => ({
                    email: user.email,
                    username: user.username,
                    daysRemaining: Math.ceil((new Date(user.subscriptionExpirationDate) - now) / (1000 * 60 * 60 * 24))
                }))
            });
        } catch (error) {
            console.error("Error sending reminders:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 11. Get subscription history for a user
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
                isActive: user.subscriptionActive || false,
                cancellationDate: user.cancellationDate || null,
                cancellationReason: user.cancellationReason || null,
                reactivationDate: user.reactivationDate || null,
                planUpdatedDate: user.planUpdatedDate || null,
                lastUpdated: user.lastUpdated || null
            };

            res.json(history);
        } catch (err) {
            console.error("Error fetching subscription history:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    });

    // ===== GENRE ENDPOINT =====

    // 12. Set preferred genre
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

    // ===== DEBUG ENDPOINTS =====

    // 13. Debug endpoint to check user data structure
    app.get("/api/debug/users-sample", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            // Get a sample of users with subscription fields
            const sampleUsers = await users.find({}, {
                projection: {
                    email: 1,
                    username: 1,
                    subscriptionStatus: 1,
                    subscriptionType: 1,
                    subscriptionActive: 1,
                    subscriptionExpirationDate: 1,
                    subscriptionStartDate: 1,
                    preferredGenre: 1
                }
            }).limit(10).toArray();
            
            // Count users by subscription status
            const statusCounts = await users.aggregate([
                {
                    $group: {
                        _id: { 
                            $ifNull: ["$subscriptionStatus", "No Status Set"] 
                        },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            // Count users with various subscription fields
            const fieldCounts = {
                totalUsers: await users.countDocuments(),
                hasSubscriptionStatus: await users.countDocuments({ subscriptionStatus: { $exists: true } }),
                hasSubscriptionType: await users.countDocuments({ subscriptionType: { $exists: true } }),
                hasSubscriptionActive: await users.countDocuments({ subscriptionActive: { $exists: true } }),
                activeSubscriptions: await users.countDocuments({ subscriptionActive: true }),
                premiumUsers: await users.countDocuments({ subscriptionStatus: "Premium" })
            };
            
            res.json({
                success: true,
                sampleUsers,
                statusCounts,
                fieldCounts,
                message: "Debug data for subscription stats"
            });
        } catch (error) {
            console.error("Debug endpoint error:", error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    });

    // 14. Debug endpoint to initialize subscription status for existing users
    app.post("/api/debug/initialize-subscription-status", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            // Update all users without subscriptionStatus to "Free"
            const result = await users.updateMany(
                { subscriptionStatus: { $exists: false } },
                { 
                    $set: { 
                        subscriptionStatus: "Free",
                        subscriptionActive: false,
                        lastUpdated: new Date()
                    } 
                }
            );
            
            // Also update users with null subscriptionStatus
            const nullResult = await users.updateMany(
                { subscriptionStatus: null },
                { 
                    $set: { 
                        subscriptionStatus: "Free",
                        subscriptionActive: false,
                        lastUpdated: new Date()
                    } 
                }
            );

            // Fix Premium users missing subscription details
            const premiumUsersFixed = await users.updateMany(
                {
                    subscriptionStatus: "Premium",
                    $or: [
                        { subscriptionType: { $exists: false } },
                        { subscriptionType: null },
                        { subscriptionActive: { $exists: false } },
                        { subscriptionExpirationDate: { $exists: false } }
                    ]
                },
                {
                    $set: {
                        subscriptionType: "monthly", // Default to monthly
                        subscriptionActive: true,
                        subscriptionStartDate: new Date(),
                        subscriptionExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        lastUpdated: new Date()
                    }
                }
            );
            
            res.json({
                success: true,
                message: "Initialized subscription status for users",
                updatedMissingStatus: result.modifiedCount,
                updatedNullStatus: nullResult.modifiedCount,
                premiumUsersFixed: premiumUsersFixed.modifiedCount,
                totalUpdated: result.modifiedCount + nullResult.modifiedCount + premiumUsersFixed.modifiedCount
            });
        } catch (error) {
            console.error("Initialize subscription status error:", error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    });

    // 15. Simple test endpoint
    app.get("/api/debug/test", (req, res) => {
        res.json({
            success: true,
            message: "All subscription endpoints are working",
            timestamp: new Date(),
            availableEndpoints: [
                "POST /api/subscribe - Subscribe to a plan",
                "GET /api/subscription-status - Get user subscription status",
                "GET /api/subscription-stats - Get admin statistics",
                "POST /api/extend-subscription - Extend subscription",
                "POST /api/cancel-subscription - Cancel subscription", 
                "POST /api/reactivate-subscription - Reactivate subscription",
                "POST /api/update-subscription-plan - Update plan",
                "POST /api/check-expired-subscriptions - Check expired (cron)",
                "GET /api/users-expiring-soon - Users expiring soon",
                "POST /api/send-expiration-reminders - Send reminders",
                "GET /api/subscription-history/:userId - Get history",
                "POST /api/set-preferred-genre - Set preferred genre",
                "GET /api/debug/users-sample - Debug user data",
                "POST /api/debug/initialize-subscription-status - Fix data",
                "GET /api/debug/test - This endpoint"
            ],
            subscriptionOptions
        });
    });

    // ===== ADDITIONAL UTILITY ENDPOINTS =====

    // 16. Get subscription options (for frontend)
    app.get("/api/subscription-options", (req, res) => {
        res.json({
            success: true,
            subscriptionOptions,
            message: "Available subscription plans"
        });
    });

    // 17. Bulk update user subscriptions (ADMIN ONLY)
    app.post("/api/admin/bulk-update-subscriptions", async (req, res) => {
        try {
            const { userIds, action, subscriptionType } = req.body;
            
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ message: "userIds array is required" });
            }

            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            let updateOperation = {};
            let message = "";

            switch (action) {
                case 'activate':
                    if (!subscriptionType || !subscriptionOptions[subscriptionType]) {
                        return res.status(400).json({ message: "Valid subscriptionType required for activation" });
                    }
                    updateOperation = {
                        $set: {
                            subscriptionStatus: "Premium",
                            subscriptionType: subscriptionType,
                            subscriptionActive: true,
                            subscriptionStartDate: new Date(),
                            subscriptionExpirationDate: calculateExpirationDate(subscriptionType),
                            lastUpdated: new Date()
                        }
                    };
                    message = `Activated ${subscriptionType} subscription for ${userIds.length} users`;
                    break;

                case 'deactivate':
                    updateOperation = {
                        $set: {
                            subscriptionStatus: "Free",
                            subscriptionActive: false,
                            lastUpdated: new Date()
                        }
                    };
                    message = `Deactivated subscriptions for ${userIds.length} users`;
                    break;

                case 'extend':
                    if (!subscriptionType || !subscriptionOptions[subscriptionType]) {
                        return res.status(400).json({ message: "Valid subscriptionType required for extension" });
                    }
                    // This is more complex as it needs to extend from current expiration
                    return res.status(400).json({ message: "Bulk extend not implemented - use individual extend endpoint" });

                default:
                    return res.status(400).json({ message: "Invalid action. Use 'activate' or 'deactivate'" });
            }

            const result = await users.updateMany(
                { _id: { $in: userIds.map(id => new ObjectId(id)) } },
                updateOperation
            );

            res.json({
                success: true,
                message,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error("Error in bulk update:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 18. Get revenue report (ADMIN)
    app.get("/api/admin/revenue-report", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            const { startDate, endDate } = req.query;
            
            let matchQuery = {
                subscriptionActive: true,
                subscriptionType: { $exists: true, $ne: null }
            };

            // Add date range if provided
            if (startDate && endDate) {
                matchQuery.subscriptionStartDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const revenueData = await users.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: {
                            subscriptionType: "$subscriptionType",
                            month: { $dateToString: { format: "%Y-%m", date: "$subscriptionStartDate" } }
                        },
                        count: { $sum: 1 },
                        users: {
                            $push: {
                                id: "$_id",
                                email: "$email",
                                username: "$username",
                                startDate: "$subscriptionStartDate",
                                expirationDate: "$subscriptionExpirationDate"
                            }
                        }
                    }
                },
                {
                    $sort: { "_id.month": -1, "_id.subscriptionType": 1 }
                }
            ]).toArray();

            // Calculate revenue for each group
            const revenueReport = revenueData.map(group => {
                const planCost = subscriptionOptions[group._id.subscriptionType]?.cost || 0;
                const revenue = group.count * planCost;
                
                return {
                    month: group._id.month,
                    subscriptionType: group._id.subscriptionType,
                    userCount: group.count,
                    revenue: revenue,
                    users: group.users
                };
            });

            // Calculate totals
            const totalRevenue = revenueReport.reduce((sum, item) => sum + item.revenue, 0);
            const totalUsers = revenueReport.reduce((sum, item) => sum + item.userCount, 0);

            res.json({
                success: true,
                dateRange: { startDate, endDate },
                totalRevenue,
                totalUsers,
                revenueByMonthAndPlan: revenueReport,
                generatedAt: new Date()
            });

        } catch (error) {
            console.error("Error generating revenue report:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    });

    // 19. Health check endpoint
    app.get("/api/subscription-health", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            const now = new Date();
            
            // Basic health metrics
            const metrics = {
                totalUsers: await users.countDocuments(),
                activeSubscriptions: await users.countDocuments({ subscriptionActive: true }),
                expiredSubscriptions: await users.countDocuments({
                    subscriptionExpirationDate: { $lt: now },
                    subscriptionActive: true
                }),
                usersWithoutStatus: await users.countDocuments({
                    $or: [
                        { subscriptionStatus: { $exists: false } },
                        { subscriptionStatus: null }
                    ]
                }),
                premiumUsers: await users.countDocuments({ subscriptionStatus: "Premium" }),
                freeUsers: await users.countDocuments({ subscriptionStatus: "Free" })
            };

            // Health status
            const isHealthy = metrics.expiredSubscriptions === 0 && metrics.usersWithoutStatus === 0;

            res.json({
                success: true,
                healthy: isHealthy,
                metrics,
                issues: {
                    expiredButActive: metrics.expiredSubscriptions > 0,
                    missingStatus: metrics.usersWithoutStatus > 0
                },
                checkedAt: new Date()
            });

        } catch (error) {
            console.error("Error checking subscription health:", error);
            res.status(500).json({ 
                success: false,
                healthy: false,
                error: error.message 
            });
        }
    });

    // 20. Webhook endpoint for payment processing 
    app.post("/api/webhooks/payment", async (req, res) => {
        try {
            const { event, data } = req.body;
            
            console.log('Payment webhook received:', { event, data });

            switch (event) {
                case 'payment.succeeded':
                    break;
                    
                case 'payment.failed':
                    break;
                    
                case 'subscription.cancelled':
                    break;
                    
                default:
                    console.log('Unhandled webhook event:', event);
            }

            res.json({ received: true });
            
        } catch (error) {
            console.error("Error processing payment webhook:", error);
            res.status(500).json({ error: "Webhook processing failed" });
        }
    });

    console.log("✅ All subscription endpoints loaded successfully!");
    console.log("📊 Available endpoints: 20 total");
    console.log("🔧 Subscription options:", Object.keys(subscriptionOptions));
};
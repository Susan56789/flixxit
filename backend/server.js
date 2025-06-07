const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require("mongodb");

// Import subscription management services
const SubscriptionManager = require('./services/subscriptionCron');
const { 
    EmailService, 
    EnhancedSubscriptionManager, 
    SubscriptionScheduler 
} = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;

// Connection URI
const uri = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(uri);

// Use CORS middleware
const corsOptions = {
    origin: true,  // Allow all origins
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ]
};

app.use(cors(corsOptions));

// Additional middleware to ensure CORS headers are always present
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
app.use(bodyParser.json());

// Global subscription services
let subscriptionManager;
let emailSubscriptionManager;
let subscriptionScheduler;

// Authentication middleware
const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, 'secretkey');
        const database = client.db('sample_mflix');
        const users = database.collection('users');
        const user = await users.findOne({ _id: new ObjectId(decoded._id) });

        if (!user) return res.status(400).json({ message: 'Invalid token.' });

        req.user = user;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Create text index helper
const createTextIndex = async (collection) => {
    const indexes = await collection.indexes();
    const hasTextIndex = indexes.some(index => index.key && index.key._fts === "text");

    if (!hasTextIndex) {
        await collection.createIndex({ title: "text", description: "text" });
        console.log("Text index created on 'title' and 'description' fields.");
    } else {
        console.log("Text index already exists on 'title' and 'description' fields.");
    }
};

// Enhanced database connection with subscription service initialization
async function run() {
    try {
        await client.connect();
        console.log("Connected to the database");

        const database = client.db("sample_mflix");
        const movies = database.collection("movies");
        const users = database.collection("users");
        console.log("Collections initialized");

        // Initialize subscription management services
        await initializeSubscriptionServices();

    } catch (err) {
        console.error("Error connecting to the database:", err);
    }
}

// Initialize subscription services
async function initializeSubscriptionServices() {
    try {
        // Email configuration
        const emailConfig = {
            provider: process.env.EMAIL_PROVIDER || 'nodemailer',
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpPort: process.env.SMTP_PORT || 587,
            smtpUser: process.env.EMAIL_USER,
            smtpPass: process.env.EMAIL_PASS,
            sendgridApiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.FROM_EMAIL || 'noreply@flixxit.com'
        };

        // Initialize cron-based subscription manager
        subscriptionManager = new SubscriptionManager(
            process.env.SERVER_URL || `http://localhost:${PORT}`,
            {
                logFile: 'flixxit-subscription-logs.json',
                retryAttempts: 3,
                retryDelay: 5000,
                timezone: process.env.TIMEZONE || 'America/New_York'
            }
        );

        // Initialize email-based subscription manager
        emailSubscriptionManager = new EnhancedSubscriptionManager(
            process.env.SERVER_URL || `http://localhost:${PORT}`,
            { emailConfig }
        );

        // Test email service connection
        const emailTest = await emailSubscriptionManager.testEmailService();
        if (emailTest.success) {
            console.log('✅ Email service connected successfully');
            
            // Initialize scheduler only if email service works
            subscriptionScheduler = new SubscriptionScheduler(emailSubscriptionManager, {
                checkInterval: 30 * 60 * 1000, // 30 minutes
                warningDays: 7,
                adminEmail: process.env.ADMIN_EMAIL || 'admin@flixxit.com',
                enableWeeklyReports: true
            });

            // Start the scheduler
            subscriptionScheduler.start();
        } else {
            console.log('⚠️ Email service not available, using basic subscription manager only');
        }

        // Start cron jobs
        subscriptionManager.startCronJob();
        
        console.log('🚀 Subscription management services initialized');

    } catch (error) {
        console.error('❌ Failed to initialize subscription services:', error.message);
    }
}

run().catch(console.dir);

// Default landing page
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Flixxit Backend!",
        status: "running",
        timestamp: new Date().toISOString(),
        services: {
            database: "connected",
            subscriptionManager: subscriptionManager ? "active" : "inactive",
            emailService: emailSubscriptionManager ? "active" : "inactive"
        }
    });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
    try {
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            database: "connected",
            subscriptionServices: {}
        };

        // Check subscription manager health
        if (subscriptionManager) {
            const cronHealth = await subscriptionManager.healthCheck();
            health.subscriptionServices.cronManager = cronHealth;
        }

        // Check email service health
        if (emailSubscriptionManager) {
            const emailHealth = await emailSubscriptionManager.testEmailService();
            health.subscriptionServices.emailService = emailHealth;
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Subscription management endpoints
app.post("/api/check-expired-subscriptions", async (req, res) => {
    try {
        const { checkType = 'api' } = req.body;
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        // Find expired subscriptions
        const currentDate = new Date();
        const expiredUsers = await users.find({
            expiredOn: { $lt: currentDate },
            subscriptionType: { $ne: 'Free' }
        }).toArray();

        // Update expired users to Free subscription
        if (expiredUsers.length > 0) {
            await users.updateMany(
                { expiredOn: { $lt: currentDate }, subscriptionType: { $ne: 'Free' } },
                { 
                    $set: { 
                        subscriptionType: 'Free',
                        lastUpdated: currentDate
                    } 
                }
            );
        }

        console.log(`Found and processed ${expiredUsers.length} expired subscriptions`);

        res.json({
            success: true,
            expiredCount: expiredUsers.length,
            expiredUsers: expiredUsers.map(user => ({
                id: user._id,
                email: user.email,
                username: user.username,
                expiredOn: user.expiredOn,
                subscriptionType: user.subscriptionType
            })),
            checkType,
            timestamp: currentDate.toISOString()
        });

    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get users expiring soon
app.get("/api/users-expiring-soon", async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const currentDate = new Date();

        const expiringSoonUsers = await users.find({
            expiredOn: { 
                $gte: currentDate,
                $lte: futureDate 
            },
            subscriptionType: { $ne: 'Free' }
        }).toArray();

        // Calculate days remaining for each user
        const usersWithDaysRemaining = expiringSoonUsers.map(user => {
            const daysRemaining = Math.ceil((new Date(user.expiredOn) - currentDate) / (1000 * 60 * 60 * 24));
            return {
                id: user._id,
                email: user.email,
                username: user.username,
                expiredOn: user.expiredOn,
                subscriptionType: user.subscriptionType,
                daysRemaining
            };
        });

        res.json({
            success: true,
            count: expiringSoonUsers.length,
            users: usersWithDaysRemaining,
            daysThreshold: days,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting users expiring soon:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send expiration reminders
app.post("/api/send-expiration-reminders", async (req, res) => {
    try {
        const { days = 3 } = req.body;
        
        if (!emailSubscriptionManager) {
            return res.status(503).json({
                success: false,
                error: 'Email service not available'
            });
        }

        // Get users expiring in specified days
        const expiringSoonResponse = await fetch(`${req.protocol}://${req.get('host')}/api/users-expiring-soon?days=${days}`);
        const expiringSoonData = await expiringSoonResponse.json();

        if (!expiringSoonData.success || expiringSoonData.users.length === 0) {
            return res.json({
                success: true,
                remindersSent: 0,
                message: 'No users found expiring soon'
            });
        }

        // Send warnings to users
        const results = await emailSubscriptionManager.processExpiringSubscriptions(days);

        res.json({
            success: true,
            remindersSent: results.success,
            failed: results.failed,
            total: results.processed,
            users: expiringSoonData.users.map(u => ({ email: u.email, daysRemaining: u.daysRemaining }))
        });

    } catch (error) {
        console.error('Error sending expiration reminders:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get subscription statistics
app.get("/api/subscription-stats", async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const users = database.collection("users");

        // Get current date
        const currentDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        // Aggregate subscription statistics
        const stats = await users.aggregate([
            {
                $group: {
                    _id: "$subscriptionType",
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$subscriptionType", "Basic"] }, then: 9.99 },
                                    { case: { $eq: ["$subscriptionType", "Premium"] }, then: 15.99 },
                                    { case: { $eq: ["$subscriptionType", "Family"] }, then: 19.99 }
                                ],
                                default: 0
                            }
                        }
                    }
                }
            }
        ]).toArray();

        // Count users expiring soon
        const expiringSoon = await users.countDocuments({
            expiredOn: { $gte: currentDate, $lte: futureDate },
            subscriptionType: { $ne: 'Free' }
        });

        // Count expired users needing cleanup
        const needsCleanup = await users.countDocuments({
            expiredOn: { $lt: currentDate },
            subscriptionType: { $ne: 'Free' }
        });

        // Calculate totals
        const totalUsers = await users.countDocuments();
        const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);

        res.json({
            success: true,
            totalUsers,
            subscriptionBreakdown: stats,
            expiringSoon,
            needsCleanup,
            estimatedMonthlyRevenue: totalRevenue.toFixed(2),
            revenueByPlan: stats.map(stat => ({
                _id: stat._id,
                count: stat.count,
                revenue: stat.revenue.toFixed(2)
            })),
            lastUpdated: currentDate.toISOString()
        });

    } catch (error) {
        console.error('Error getting subscription stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin weekly summary endpoint
app.get("/api/admin/weekly-summary", async (req, res) => {
    try {
        // Get subscription stats
        const statsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/subscription-stats`);
        const statsData = await statsResponse.json();

        if (!statsData.success) {
            throw new Error('Failed to get subscription stats');
        }

        res.json({
            success: true,
            ...statsData,
            reportType: 'weekly',
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating weekly summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manual subscription check endpoint
app.post("/api/manual-subscription-check", async (req, res) => {
    try {
        if (!subscriptionManager) {
            return res.status(503).json({
                success: false,
                error: 'Subscription manager not available'
            });
        }

        const result = await subscriptionManager.manualCheck({
            checkType: 'manual-api'
        });

        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in manual subscription check:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Existing routes
require('./routes/admin')(client, app, bcrypt);
require('./routes/dislikes')(client, app, ObjectId);
require('./routes/genre')(client, app);
require('./routes/likes')(client, app, ObjectId);
require('./routes/movies')(client, app, authenticate, createTextIndex, ObjectId);
require('./routes/subscribers')(client, app, ObjectId);
require('./routes/users')(client, app, authenticate, bcrypt, jwt);
require('./routes/watchlist')(client, app, authenticate, ObjectId);
require('./routes/comments')(client, app, authenticate, ObjectId);

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Flixxit server...');
    
    // Stop subscription services
    if (subscriptionManager) {
        subscriptionManager.stopCronJobs();
    }
    if (subscriptionScheduler) {
        subscriptionScheduler.stop();
    }
    
    // Close database connection
    try {
        await client.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
    }
    
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Terminating Flixxit server...');
    
    if (subscriptionManager) {
        subscriptionManager.stopCronJobs();
    }
    if (subscriptionScheduler) {
        subscriptionScheduler.stop();
    }
    
    try {
        await client.close();
    } catch (error) {
        console.error('Error closing database:', error);
    }
    
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Flixxit server is running on port ${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
});

// Export for testing
module.exports = app;
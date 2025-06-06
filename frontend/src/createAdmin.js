// createAdmin.js - Run this script to create an initial admin user
// Usage: node createAdmin.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Replace with your MongoDB connection string
const uri = "YOUR_MONGODB_CONNECTION_STRING"; // e.g., "mongodb+srv://username:password@cluster.mongodb.net/"

async function createAdmin() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        
        const database = client.db("sample_mflix");
        const admins = database.collection("admins");
        
        // Check if admin already exists
        const existingAdmin = await admins.findOne({ email: "admin@flixxit.com" });
        
        if (existingAdmin) {
            console.log("Admin already exists with email: admin@flixxit.com");
            console.log("Updating password...");
            
            // Update existing admin password
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await admins.updateOne(
                { email: "admin@flixxit.com" },
                { $set: { password: hashedPassword, updatedAt: new Date() } }
            );
            
            console.log("Password updated successfully!");
        } else {
            // Create new admin
            const hashedPassword = await bcrypt.hash("admin123", 10);
            
            const adminData = {
                email: "admin@flixxit.com",
                password: hashedPassword,
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await admins.insertOne(adminData);
            console.log("Admin created successfully with ID:", result.insertedId);
        }
        
        console.log("\n✅ Admin credentials:");
        console.log("Email: admin@flixxit.com");
        console.log("Password: admin123");
        console.log("\n⚠️  Please change this password after first login!");
        
        // List all admins
        const allAdmins = await admins.find({}).toArray();
        console.log("\nTotal admins in database:", allAdmins.length);
        allAdmins.forEach(admin => {
            console.log(`- ${admin.email} (created: ${admin.createdAt})`);
        });
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
        console.log("\nDisconnected from MongoDB");
    }
}

// Alternative: Add this endpoint to your existing backend
const createAdminEndpoint = `
// Add this to your backend API file
app.post('/api/admin/create-initial', async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const admins = database.collection("admins");
        
        // Check if any admin exists
        const adminCount = await admins.countDocuments();
        if (adminCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin already exists',
                count: adminCount 
            });
        }
        
        // Create default admin
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const result = await admins.insertOne({
            email: "admin@flixxit.com",
            password: hashedPassword,
            role: "admin",
            createdAt: new Date()
        });
        
        res.json({ 
            success: true, 
            message: 'Admin created successfully',
            adminId: result.insertedId,
            credentials: {
                email: "admin@flixxit.com",
                password: "admin123"
            }
        });
    } catch (err) {
        console.error('Error creating admin:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Debug endpoint to check admin status
app.get('/api/admin/status', async (req, res) => {
    try {
        const database = client.db("sample_mflix");
        const admins = database.collection("admins");
        
        const adminCount = await admins.countDocuments();
        const adminEmails = await admins.find({}, { projection: { email: 1 } }).toArray();
        
        res.json({
            success: true,
            totalAdmins: adminCount,
            adminEmails: adminEmails.map(a => a.email),
            databaseName: "sample_mflix",
            collectionName: "admins"
        });
    } catch (err) {
        console.error('Error checking admin status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
`;

// Run the script
createAdmin();
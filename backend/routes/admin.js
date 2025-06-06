module.exports = (client, app, bcrypt) => {

    // Admin Login
    app.post('/api/admin/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const database = client.db("sample_mflix");
            const admins = database.collection("admins");

            // Log login attempt for debugging
            console.log('Admin login attempt:', { email, timestamp: new Date() });

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const admin = await admins.findOne({ email: email.toLowerCase().trim() });

            if (!admin) {
                console.log('Admin not found:', email);
                return res.status(400).json({ success: false, message: 'Invalid email or password' });
            }

            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (!passwordMatch) {
                console.log('Password mismatch for:', email);
                return res.status(400).json({ success: false, message: 'Invalid email or password' });
            }

            // Update last login
            await admins.updateOne(
                { _id: admin._id },
                { $set: { lastLogin: new Date() } }
            );

            console.log('Admin login successful:', email);
            res.json({ 
                success: true, 
                message: 'Login successful',
                admin: {
                    email: admin.email,
                    role: admin.role || 'admin'
                }
            });
        } catch (err) {
            console.error('Error logging in admin:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Change Password
    app.post('/api/admin/change-password', async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            const database = client.db("sample_mflix");
            const admins = database.collection("admins");

            if (!email || !newPassword) {
                return res.status(400).json({ success: false, message: 'Email and new password are required' });
            }

            // Validate password strength
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
            }

            const admin = await admins.findOne({ email: email.toLowerCase().trim() });

            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await admins.updateOne(
                { email: email.toLowerCase().trim() }, 
                { 
                    $set: { 
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                        updatedAt: new Date()
                    } 
                }
            );

            if (result.modifiedCount === 1) {
                console.log('Password changed for admin:', email);
                res.json({ success: true, message: 'Password changed successfully' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to change password' });
            }
        } catch (err) {
            console.error('Error changing password:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Create Initial Admin
    app.post('/api/admin/create-initial', async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const admins = database.collection("admins");
            
            // Check if any admin exists
            const adminCount = await admins.countDocuments();
            if (adminCount > 0) {
                const existingAdmins = await admins.find({}, { projection: { email: 1 } }).toArray();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Admin already exists',
                    count: adminCount,
                    admins: existingAdmins.map(a => a.email)
                });
            }
            
            // Create default admin
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const result = await admins.insertOne({
                email: "admin@flixxit.com",
                password: hashedPassword,
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('Initial admin created:', result.insertedId);
            
            res.json({ 
                success: true, 
                message: 'Admin created successfully',
                adminId: result.insertedId,
                credentials: {
                    email: "admin@flixxit.com",
                    password: "admin123",
                    note: "Please change this password after first login!"
                }
            });
        } catch (err) {
            console.error('Error creating admin:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Create Custom Admin
    app.post('/api/admin/create', async (req, res) => {
        try {
            const { email, password } = req.body;
            const database = client.db("sample_mflix");
            const admins = database.collection("admins");
            
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            // Check if admin already exists
            const existingAdmin = await admins.findOne({ email: email.toLowerCase().trim() });
            if (existingAdmin) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Admin with this email already exists'
                });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new admin
            const result = await admins.insertOne({
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('New admin created:', email);
            
            res.json({ 
                success: true, 
                message: 'Admin created successfully',
                adminId: result.insertedId,
                email: email
            });
        } catch (err) {
            console.error('Error creating admin:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Check Admin Status
    app.get('/api/admin/status', async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const admins = database.collection("admins");
            
            const adminCount = await admins.countDocuments();
            const adminList = await admins.find({}, { 
                projection: { 
                    email: 1, 
                    role: 1, 
                    createdAt: 1,
                    lastLogin: 1
                } 
            }).toArray();
            
            res.json({
                success: true,
                totalAdmins: adminCount,
                admins: adminList.map(admin => ({
                    id: admin._id,
                    email: admin.email,
                    role: admin.role || 'admin',
                    createdAt: admin.createdAt,
                    lastLogin: admin.lastLogin || 'Never'
                })),
                databaseName: "sample_mflix",
                collectionName: "admins"
            });
        } catch (err) {
            console.error('Error checking admin status:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Delete Admin (for cleanup/testing)
    app.delete('/api/admin/:email', async (req, res) => {
        try {
            const { email } = req.params;
            const database = client.db("sample_mflix");
            const admins = database.collection("admins");
            
            // Prevent deleting last admin
            const adminCount = await admins.countDocuments();
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete the last admin' 
                });
            }
            
            const result = await admins.deleteOne({ email: email.toLowerCase().trim() });
            
            if (result.deletedCount === 1) {
                console.log('Admin deleted:', email);
                res.json({ success: true, message: 'Admin deleted successfully' });
            } else {
                res.status(404).json({ success: false, message: 'Admin not found' });
            }
        } catch (err) {
            console.error('Error deleting admin:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Test endpoint
    app.get('/api/test', (req, res) => {
        res.json({ 
            success: true, 
            message: 'Server is running',
            timestamp: new Date()
        });
    });

    console.log('Admin routes initialized');
};
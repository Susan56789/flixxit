module.exports = (client, app, authenticate, bcrypt, jwt) => {
    const { ObjectId } = require('mongodb');
    
    // Authentication
    app.post("/api/register", async (req, res) => {
        try {
            // Check if email already exists
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const existingEmail = await users.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).json({ message: "Email already exists" });
            }

            // Check if username already exists
            const existingUsername = await users.findOne({
                username: req.body.username,
            });
            if (existingUsername) {
                return res.status(400).json({ message: "Username already exists" });
            }

            // Check if password is at least 8 characters long
            if (req.body.password.length < 8) {
                return res
                    .status(400)
                    .json({ message: "Password must be at least 8 characters long" });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const user = {
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                createdAt: new Date(),
                watchlist: [],
                likedMovies: [],
                dislikedMovies: []
            };

            // Insert the user into the database
            const result = await users.insertOne(user);
            res.json({ userId: result.insertedId, message: "Registration successful" });
        } catch (err) {
            console.error("Registration error:", err);
            res.status(400).json({ message: err.message || "Registration failed" });
        }
    });

    app.post("/api/login", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const user = await users.findOne({ email: req.body.email });
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }
            const validPassword = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!validPassword) {
                return res.status(400).json({ message: "Invalid password" });
            }
            
            // Create token with user ID
            const token = jwt.sign({ _id: user._id.toString() }, "secretkey", { expiresIn: '7d' });
            
            // Remove password from user object before sending
            const { password, ...userWithoutPassword } = user;
            
            res.json({ token, user: userWithoutPassword });
        } catch (err) {
            console.error("Login error:", err);
            res.status(400).json({ message: err.message || "Login failed" });
        }
    });

    app.post("/api/reset-password", async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({ message: "Email and new password are required" });
            }

            // Validate new password strength
            if (newPassword.length < 8) {
                return res.status(400).json({ message: "New password must be at least 8 characters long" });
            }

            // Find the user by email
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const user = await users.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Hash the new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update the password in the database
            await users.updateOne(
                { email },
                { $set: { password: hashedNewPassword } }
            );

            res.json({ message: "Password reset successfully" });
        } catch (err) {
            console.error("Error resetting password:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Get user data by ID (public endpoint)
    app.get("/api/user/:id", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const user = await users.findOne({ _id: new ObjectId(req.params.id) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Remove sensitive data before sending
            const { password, email, ...publicUserData } = user;
            res.json(publicUserData);
        } catch (err) {
            console.error("Error fetching user:", err);
            res.status(500).json({ message: err.message || "Error fetching user" });
        }
    });

    // Get current user from JWT token (protected endpoint)
    app.get("/api/user", authenticate, async (req, res) => {
        try {
            // req.user is already populated by authenticate middleware
            // Remove password before sending
            const { password, ...userWithoutPassword } = req.user;
            res.json(userWithoutPassword);
        } catch (err) {
            console.error("Error fetching current user:", err);
            res.status(500).json({ message: err.message || "Error fetching user data" });
        }
    });

    // Alias endpoint for current user
    app.get("/api/users/:userId", authenticate, async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");

            const userId = req.params.userId;
            
            // Verify user is accessing their own data or is admin
            if (req.user._id.toString() !== userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
            
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (user) {
                const { password, ...userWithoutPassword } = user;
                res.json(userWithoutPassword);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            res.status(500).json({ message: err.message || "Error fetching user" });
        }
    });

    // Get all users (admin only - you might want to add admin check)
    app.get("/api/users", authenticate, async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const allUsers = await users.find().toArray();
            // Remove passwords from all users
            const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
            res.json(usersWithoutPasswords);
        } catch (err) {
            console.error("Error fetching users:", err);
            res.status(500).json({ message: err.message || "Error fetching users" });
        }
    });
    // Update user profile (protected endpoint)
    app.put("/api/user", authenticate, async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            
            const { username, email } = req.body;
            const userId = req.user._id;
            
            // Check if email is being changed and if it's already taken
            if (email && email !== req.user.email) {
                const existingEmail = await users.findOne({ email, _id: { $ne: userId } });
                if (existingEmail) {
                    return res.status(400).json({ message: "Email already exists" });
                }
            }
            
            // Check if username is being changed and if it's already taken
            if (username && username !== req.user.username) {
                const existingUsername = await users.findOne({ username, _id: { $ne: userId } });
                if (existingUsername) {
                    return res.status(400).json({ message: "Username already exists" });
                }
            }
            
            // Update user
            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            
            const result = await users.findOneAndUpdate(
                { _id: userId },
                { $set: updateData },
                { returnDocument: 'after' }
            );
            
            if (!result) {
                return res.status(404).json({ message: "User not found" });
            }
            
            const { password, ...userWithoutPassword } = result;
            res.json({ user: userWithoutPassword, message: "Profile updated successfully" });
        } catch (err) {
            console.error("Error updating user:", err);
            res.status(500).json({ message: err.message || "Error updating profile" });
        }
    });
};
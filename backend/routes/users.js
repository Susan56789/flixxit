module.exports = (client, app, authenticate, bcrypt, jwt) => {
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
                alert("Username already exists");
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
            };

            // Insert the user into the database
            const result = await users.insertOne(user);
            res.json({ userId: result.insertedId });
        } catch (err) {
            res.status(400).json({ message: err });
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
            const token = jwt.sign({ _id: user._id.toString() }, "secretkey");
            res.json({ token, user }); // <-- Send both the token and the user object
        } catch (err) {
            res.status(400).json({ message: err });
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


    //get user data
    app.get("/api/user/:id", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const user = await users.findOne({ _id: ObjectId(req.params.id) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            console.log("user", user);
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: err });
        }
    });

    app.get("/api/user", async (req, res) => {
        try {
            const database = client.db("sample_mflix");
            const users = database.collection("users");
            const token = req.header("Authorization").split(" ")[1]; // Extract token from Authorization header
            const user = await users.findOne({ _id: ObjectId(token) });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: err });
        }
    });

}
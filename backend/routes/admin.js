module.exports = (client, app, bcrypt) => {
    const database = client.db("sample_mflix");
    const admins = database.collection("admins");

    // Admin Login
    app.post('/api/admin/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const admin = await admins.findOne({ email });

            if (!admin) {
                return res.status(400).json({ success: false, message: 'Invalid email or password' });
            }

            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (!passwordMatch) {
                return res.status(400).json({ success: false, message: 'Invalid email or password' });
            }

            res.json({ success: true, message: 'Login successful' });
        } catch (err) {
            console.error('Error logging in admin:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Change Password
    app.post('/api/admin/change-password', async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({ success: false, message: 'Email and new password are required' });
            }

            const admin = await admins.findOne({ email });

            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await admins.updateOne({ email }, { $set: { password: hashedPassword } });

            if (result.modifiedCount === 1) {
                res.json({ success: true, message: 'Password changed successfully' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to change password' });
            }
        } catch (err) {
            console.error('Error changing password:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });
};

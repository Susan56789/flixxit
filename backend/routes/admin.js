module.exports = (client, app) => {
    //aDMIN LOGIN
    app.post('/api/admin/login', async (req, res, bcrypt) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const database = client.db("sample_mflix");
            const admins = database.collection("admins");
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


    // Change Password endpoint
    app.post('/api/admin/change-password', async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            // Check if email and newPassword are provided
            if (!email || !newPassword) {
                return res.status(400).json({ success: false, message: 'Email and new password are required' });
            }

            // Find the admin by email
            const admin = await db.collection('admins').findOne({ email });

            // If admin not found, return an error
            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the admin's password
            const result = await db.collection('admins').updateOne({ email }, { $set: { password: hashedPassword } });

            // Check if the update was successful
            if (result.modifiedCount === 1) {
                return res.json({ success: true, message: 'Password changed successfully' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to change password' });
            }
        } catch (err) {
            console.error('Error changing password:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });


}
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function addAdmin() {
    // MongoDB connection URI
    const uri = process.env.MONGODB_URI;

    // Create a new MongoClient
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB server
        await client.connect();

        // Access the database
        const database = client.db('sample_mflix');

        // Access the admins collection (create it if it doesn't exist)
        const admins = database.collection('admins');

        // Define the admin document
        const adminDocument = {
            username: 'admin',
            password: 'admin_password',
            email: 'admin@example.com'
            // You can add more fields as needed
        };

        // Insert the admin document into the collection
        const result = await admins.insertOne(adminDocument);

        console.log(`${result.insertedCount} admin inserted`);
    } catch (err) {
        console.error('Error adding admin:', err);
    } finally {
        // Close the connection
        await client.close();
    }
}

// Call the function to add the admin
addAdmin();

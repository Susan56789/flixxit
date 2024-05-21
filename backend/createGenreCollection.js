const { MongoClient } = require('mongodb');

async function createGenreCollection() {
    const uri = 'your_mongodb_connection_string';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('sample_mflix');
        const genres = database.collection('genres');

        const sampleGenres = [
            { "_id": "1", "name": "Action", "description": "A genre characterized by fast-paced sequences and physical activity, including fights, chases, explosions, and stunts." },
            { "_id": "2", "name": "Comedy", "description": "A genre focused on humor, aiming to provoke laughter and provide amusement through funny characters and situations." },
            { "_id": "3", "name": "Drama", "description": "A genre that explores realistic narratives, character development, and emotional themes, often with serious subject matter." },
            { "_id": "4", "name": "Horror", "description": "A genre designed to evoke fear, dread, and shock, often featuring supernatural elements, monsters, or psychological terror." },
            { "_id": "5", "name": "Science Fiction", "description": "A genre that deals with futuristic concepts, advanced technology, space exploration, time travel, and extraterrestrial life." },
            { "_id": "6", "name": "Romance", "description": "A genre centered around love stories and romantic relationships, often with an emphasis on emotional connections and happy endings." },
            { "_id": "7", "name": "Thriller", "description": "A genre that creates suspense, excitement, and tension, often involving crime, espionage, and plot twists." },
            { "_id": "8", "name": "Fantasy", "description": "A genre that features magical elements, mythical creatures, and fantastical worlds, often drawing on folklore and mythology." },
            { "_id": "9", "name": "Documentary", "description": "A genre that presents factual information about real-life events, people, and phenomena, often with a focus on education and storytelling." },
            { "_id": "10", "name": "Animation", "description": "A genre that uses animated visuals to tell stories, appealing to both children and adults, often with a wide range of styles and themes." }
        ];

        const result = await genres.insertMany(sampleGenres);
        console.log(`${result.insertedCount} genres were inserted`);
    } catch (err) {
        console.error('Error creating genre collection:', err);
    } finally {
        await client.close();
    }
}

createGenreCollection();

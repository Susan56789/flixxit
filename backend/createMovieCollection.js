const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://devnimoh:INM8mbnUneU1mGFu@cluster0.inrpjl1.mongodb.net/sample_mflix?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function createMovieCollection() {
    try {
        await client.connect();
        const database = client.db("sample_mflix");
        const movies = database.collection("movies");

        const newMovies = [
            {

                title: "Power",
                genre: "Drama",
                rating: 9,
                year: 2014,
                imageUrl: "https://m.media-amazon.com/images/I/91CR-KW6eQL._AC_UF894,1000_QL80_.jpg",
                videoUrl: "",
                description: "James St Patrick, the owner of a nightclub, is wealthy and has everything he needs. However, he is also a drug lord but wishes to quit the life of crime."
            },

        ];

        const result = await movies.insertMany(newMovies);
        console.log(`${result.insertedCount} movies inserted successfully.`);
    } catch (error) {
        console.error("Error creating movie collection:", error);
    } finally {
        await client.close();
    }
}

createMovieCollection();

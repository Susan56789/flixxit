const axios = require('axios');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');

// Function to fetch all movie IDs
async function fetchMovieIds() {
    try {
        const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
        return response.data.map(movie => movie._id);
    } catch (error) {
        console.error('Error fetching movie IDs:', error);
        throw error;
    }
}

// Function to generate the sitemap
async function generateSitemap() {
    try {
        const movieIds = await fetchMovieIds();
        const links = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/login', changefreq: 'monthly', priority: 0.8 },
            { url: '/register', changefreq: 'monthly', priority: 0.8 },
            { url: '/about-us', changefreq: 'monthly', priority: 0.8 },
            { url: '/categories', changefreq: 'monthly', priority: 0.8 },
            { url: '/watchlist', changefreq: 'monthly', priority: 0.8 },
            { url: '/profile', changefreq: 'monthly', priority: 0.8 },
            { url: '/reset-password', changefreq: 'monthly', priority: 0.8 },
            { url: '/admin/login', changefreq: 'monthly', priority: 0.8 },
            { url: '/admin/dashboard', changefreq: 'monthly', priority: 0.8 },
            // Add more static routes here if needed
        ];

        movieIds.forEach(id => {
            links.push({ url: `/movies/${id}`, changefreq: 'daily', priority: 1.0 });
        });

        const stream = new SitemapStream({ hostname: 'https://flixxit-five.vercel.app' });
        const writeStream = createWriteStream('./public/sitemap.xml');

        streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
            writeStream.write(data.toString())
        );

        console.log('Sitemap generated successfully!');
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();

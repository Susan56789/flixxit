const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

async function generateSitemap() {
    const sitemap = new SitemapStream({ hostname: 'https://flixxit-five.vercel.app' });
    const writeStream = createWriteStream(path.join(__dirname, 'public', 'sitemap.xml'));

    sitemap.pipe(writeStream);

    // Add your routes here
    const routes = [
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/about', changefreq: 'monthly', priority: 0.8 },
        // Add more routes as needed
    ];

    routes.forEach(route => {
        sitemap.write(route);
    });

    sitemap.end();

    // Ensure the stream is properly closed and handled
    await streamToPromise(sitemap).then(() => {
        console.log('Sitemap generated successfully!');
    }).catch(console.error);
}

generateSitemap();

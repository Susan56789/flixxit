// Step 1: Create SEO Component - src/components/SEO.js
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'Flixxit - Discover, Watch & Rate Movies Online',
  description = 'Flixxit is the ultimate movie streaming platform. Discover new movies, create watchlists, rate films, and enjoy unlimited streaming.',
  keywords = 'Flixxit, movies, streaming, watch movies online, movie reviews',
  image = '/og-image.jpg',
  url = '',
  type = 'website'
}) => {
  const siteUrl = 'https://flixxit-five.vercel.app';
  const fullUrl = `${siteUrl}${url}`;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Flixxit" />
      
      {/* Twitter */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:card" content="summary_large_image" />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Flixxit Team" />
    </Helmet>
  );
};

export default SEO;
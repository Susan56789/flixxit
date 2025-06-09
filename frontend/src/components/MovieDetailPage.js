import React, { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { Helmet } from 'react-helmet-async';
import { AuthContext } from "../AuthContext";
import { getUserToken } from "../utils/helpers";
import { useTheme } from '../themeContext';
import ReactPlayer from 'react-player';

const MovieDetailPage = ({ handleLike, handleDislike }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [likeStatus, setLikeStatus] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [alertMessage, setAlertMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SEO Component for Movie Details
  const MovieSEO = ({ movie }) => {
    if (!movie) return null;

    const title = `${movie.title} (${movie.year || 'Movie'}) - Watch on Flixxit`;
    const description = movie.description 
      ? `Watch ${movie.title} online on Flixxit. ${movie.description.substring(0, 140)}...`
      : `Watch ${movie.title} (${movie.year}) online. Stream this ${movie.genres || 'movie'} film on Flixxit, your ultimate movie platform.`;
    
    const keywords = [
      movie.title,
      `watch ${movie.title}`,
      `${movie.title} online`,
      `${movie.title} streaming`,
      movie.genres,
      movie.year,
      'Flixxit',
      'movie streaming',
      'watch online',
      'HD movies'
    ].filter(Boolean).join(', ');

    const movieImage = movie.imageUrl || movie.image || 'https://flixxit-five.vercel.app/og-image.jpg';
    const canonicalUrl = `https://flixxit-five.vercel.app/movie/${movie._id}`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.title,
      "description": movie.description || `${movie.title} - Available for streaming on Flixxit`,
      "image": movieImage,
      "datePublished": movie.year,
      "genre": Array.isArray(movie.genres) ? movie.genres : [movie.genres || 'Movie'],
      "director": movie.director ? {
        "@type": "Person",
        "name": movie.director
      } : undefined,
      "actor": movie.cast ? movie.cast.split(',').map(actor => ({
        "@type": "Person",
        "name": actor.trim()
      })) : undefined,
      "aggregateRating": movie.rating ? {
        "@type": "AggregateRating",
        "ratingValue": movie.rating,
        "bestRating": 10,
        "worstRating": 1,
        "ratingCount": (movie.likes || 0) + (movie.dislikes || 0) || 1
      } : undefined,
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/LikeAction",
          "userInteractionCount": movie.likes || 0
        },
        {
          "@type": "InteractionCounter", 
          "interactionType": "https://schema.org/DislikeAction",
          "userInteractionCount": movie.dislikes || 0
        }
      ],
      "potentialAction": {
        "@type": "WatchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": canonicalUrl,
          "inLanguage": "en"
        }
      },
      "provider": {
        "@type": "Organization",
        "name": "Flixxit",
        "url": "https://flixxit-five.vercel.app"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "category": "Free"
      }
    };

    // Remove undefined fields
    Object.keys(structuredData).forEach(key => {
      if (structuredData[key] === undefined) {
        delete structuredData[key];
      }
    });

    return (
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="video.movie" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={movieImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Flixxit" />
        <meta property="og:locale" content="en_US" />
        
        {/* Movie specific Open Graph */}
        <meta property="video:duration" content="120" />
        <meta property="video:release_date" content={movie.year} />
        {movie.director && <meta property="video:director" content={movie.director} />}
        {movie.cast && <meta property="video:actor" content={movie.cast} />}
        {movie.genres && <meta property="video:tag" content={movie.genres} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={movieImage} />
        <meta name="twitter:site" content="@Flixxit" />
        
        {/* Additional Meta Tags */}
        <meta name="author" content="Flixxit" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* Additional Schema for Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://flixxit-five.vercel.app/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Movies",
                "item": "https://flixxit-five.vercel.app/movies"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": movie.title,
                "item": canonicalUrl
              }
            ]
          })}
        </script>
      </Helmet>
    );
  };

  // Loading SEO Component
  const LoadingSEO = () => (
    <Helmet>
      <title>Loading Movie - Flixxit | Movie Streaming Platform</title>
      <meta name="description" content="Loading movie details on Flixxit. Please wait while we fetch the latest movie information." />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  // Error SEO Component
  const ErrorSEO = () => (
    <Helmet>
      <title>Movie Not Found - Flixxit | Error Loading Movie</title>
      <meta name="description" content="Sorry, we couldn't find this movie. Browse our extensive collection of movies on Flixxit." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href="https://flixxit-five.vercel.app/movies" />
    </Helmet>
  );

  // Updated comment fetching function
  const fetchComments = async (movieId) => {
    try {
      const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${movieId}/comments`);
      if (response.data.success) {
        const commentsData = response.data.data.comments || [];
        setComments(commentsData);
      } else {
        console.error('Failed to fetch comments:', response.data.message);
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  // Fetch movie details, recommended movies, comments, and users
  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);

        // Fetch likes and dislikes with proper error handling
        try {
          const likesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/likes`);
          const likesCount = likesResponse.data.data ? likesResponse.data.data.likes : likesResponse.data.likes || 0;
          
          const dislikesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/dislikes`);
          const dislikesCount = dislikesResponse.data.data ? dislikesResponse.data.data.dislikes : dislikesResponse.data.dislikes || 0;

          movieData.likes = likesCount;
          movieData.dislikes = dislikesCount;
        } catch (likeDislikeError) {
          console.warn('Error fetching likes/dislikes:', likeDislikeError);
          movieData.likes = 0;
          movieData.dislikes = 0;
        }
       // Set like status based on user - check both API and local arrays
if (user) {
  try {
    const token = getUserToken();
    const userId = user.id || user._id || user.userId; 
    if (!userId) {
      console.warn("User ID not found in user object:", user);
      return;
    }
    if (token) {
      // Check like status from API
      const [likeStatusResponse, dislikeStatusResponse] = await Promise.all([
        axios.get(
          `https://flixxit-h9fa.onrender.com/api/movies/${id}/likes/${userId}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { data: { hasLiked: false } } })),
        axios.get(
          `https://flixxit-h9fa.onrender.com/api/movies/${id}/dislike/${userId}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { data: { hasDisliked: false } } }))
      ]);

      const hasLiked = likeStatusResponse.data.data?.hasLiked || false;
      const hasDisliked = dislikeStatusResponse.data.data?.hasDisliked || false;

      setLikeStatus(hasLiked ? 1 : hasDisliked ? -1 : null);
    }
  } catch (statusError) {
    console.warn('Error checking like/dislike status:', statusError);
    // Fallback to checking arrays if they exist
    setLikeStatus(
      movieData.likesBy?.includes(user._id)
        ? 1
        : movieData.dislikesBy?.includes(user._id)
        ? -1
        : null
    );
  }
}

        fetchRecommendedMovies(movieData);
        fetchComments(movieData._id);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedMovies = async (currentMovie) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies`);
        const allMovies = response.data;

        // Filter by same genre and exclude current movie
        const genreMovies = allMovies.filter(movie => 
          movie.genres && currentMovie.genres && 
          movie.genres.toLowerCase().includes(currentMovie.genres.toLowerCase()) && 
          movie._id !== currentMovie._id
        );

        // If not enough movies in same genre, add random movies
        let recommendedMovies = genreMovies.slice(0, 4);
        
        if (recommendedMovies.length < 4) {
          const otherMovies = allMovies
            .filter(movie => movie._id !== currentMovie._id && !genreMovies.includes(movie))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 4 - recommendedMovies.length);
          
          recommendedMovies = [...recommendedMovies, ...otherMovies];
        }

        // Sort by rating
        recommendedMovies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        setRecommendedMovies(recommendedMovies);
      } catch (error) {
        console.error('Error fetching recommended movies:', error);
      }
    };

    const fetchUsers = async () => {
  try {
    const token = getUserToken(); 

    if (!token) {
      console.warn("No token found — user might not be logged in.");
      return;
    }

    const response = await axios.get("https://flixxit-h9fa.onrender.com/api/users", {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });

    setUsers(response.data);
  } catch (err) {
    console.error("Error fetching users:", err.response?.data || err.message);
  }
};

    fetchUsers();
    fetchMovieDetail();
  }, [id, user]);

  // Map usernames to comments
  useEffect(() => {
    if (comments.length > 0 && users.length > 0) {
      const needsUsernames = comments.some(comment => !comment.username && !comment.userName);
      
      if (needsUsernames) {
        const updatedComments = comments.map(comment => {
          if (comment.username || comment.userName) {
            return comment;
          }
          
          const user = users.find(user => user._id === comment.userId);
          return {
            ...comment,
            username: user ? (user.username || user.name) : 'Unknown'
          };
        });
        setComments(updatedComments);
      }
    }
  }, [comments, users]);

  const handleWatchClick = () => {
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  // Hide alert message after 3 seconds
  useEffect(() => {
    let timeout;
    if (alertMessage) {
      timeout = setTimeout(() => {
        setAlertMessage('');
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [alertMessage]);

 const handleLikeClick = async () => {
  if (!user) {
    setAlertMessage('Please log in to like the movie.');
    return;
  }

  try {
    const result = await handleLike(movie._id, user._id);

    if (result.success) {
      const { likes, dislikes, hasLiked } = result.data;

      setMovie(prev => ({
        ...prev,
        likes,
        dislikes,
      }));

      setLikeStatus(hasLiked ? 1 : null); // 1 = liked, null = no reaction
      setAlertMessage('You liked this movie!');
    } else {
      setAlertMessage('Failed to like this movie.');
    }
  } catch (err) {
    console.error('Error handling like:', err);
    setAlertMessage('An error occurred while liking. Try again.');
  }
};


const handleDislikeClick = async () => {
  if (!user) {
    setAlertMessage('Please log in to dislike the movie.');
    return;
  }

  try {
    const result = await handleDislike(movie._id, user._id);
    if (result.success) {
      const { likes, dislikes, hasDisliked } = result;

      setMovie(prev => ({
        ...prev,
        likes,
        dislikes,
      }));

      setLikeStatus(hasDisliked ? -1 : null);
      setAlertMessage('You disliked this movie!');
    }
  } catch (err) {
    console.error('Error handling dislike:', err);
    setAlertMessage('An error occurred while disliking. Try again.');
  }
};


  // Fixed comment submission with new API structure
  const handleCommentSubmit = async () => {
    if (!user) {
      setAlertMessage('Please log in to post a comment.');
      return;
    }

    if (!commentText.trim()) {
      setAlertMessage('Comment cannot be empty.');
      return;
    }

    const words = commentText.trim().split(/\s+/);
    const maxWords = 300;
    const trimmedCommentText = words.slice(0, maxWords).join(' ');

    const commentPayload = { text: trimmedCommentText };
    const token = getUserToken();

    if (!token) {
      setAlertMessage('Please log in to post a comment.');
      return;
    }

    try {
      const response = await axios.post(
        `https://flixxit-h9fa.onrender.com/api/movies/${movie._id}/comments`,
        commentPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newComment = response.data.data;
        
        setComments(prevComments => [newComment, ...prevComments]);
        setCommentText('');
        setAlertMessage('Comment posted successfully.');
      } else {
        setAlertMessage(response.data.message || 'Failed to post comment.');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      if (err.response?.status === 401) {
        setAlertMessage('Please log in to post a comment.');
      } else if (err.response?.status === 400) {
        setAlertMessage(err.response.data.message || 'Invalid comment data.');
      } else {
        setAlertMessage('Error posting comment. Please try again.');
      }
    }
  };

  // Mobile-optimized pagination component
  const MobilePagination = ({ currentPage, totalPages, onPageChange }) => {
    const getVisiblePages = () => {
      if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      if (isMobile) {
        // Show fewer pages on mobile
        const pages = [];
        if (currentPage > 1) pages.push(currentPage - 1);
        pages.push(currentPage);
        if (currentPage < totalPages) pages.push(currentPage + 1);
        return pages;
      }
      
      // Desktop logic
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
      <div className="d-flex justify-content-center align-items-center mt-3">
        <div className="pagination-controls">
          {currentPage > 1 && (
            <button
              className="btn btn-sm me-1"
              onClick={() => onPageChange(currentPage - 1)}
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-text)',
                padding: isMobile ? '6px 10px' : '4px 8px'
              }}
            >
              ‹
            </button>
          )}
          
          {getVisiblePages().map(page => (
            <button
              key={page}
              className={`btn btn-sm me-1 ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              style={{
                backgroundColor: page === currentPage ? 'var(--accent-color)' : 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: page === currentPage ? '#fff' : 'var(--primary-text)',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minWidth: isMobile ? '36px' : '32px'
              }}
            >
              {page}
            </button>
          ))}
          
          {currentPage < totalPages && (
            <button
              className="btn btn-sm"
              onClick={() => onPageChange(currentPage + 1)}
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-text)',
                padding: isMobile ? '6px 10px' : '4px 8px'
              }}
            >
              ›
            </button>
          )}
        </div>
        
        {!isMobile && (
          <small className="text-muted ms-3">
            Page {currentPage} of {totalPages}
          </small>
        )}
      </div>
    );
  };

  // Mobile-optimized comments component
  const CommentsWithPagination = ({ comments }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = isMobile ? 3 : 5; // Show fewer comments on mobile
    
    const totalPages = Math.ceil(comments.length / commentsPerPage);
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const currentComments = comments.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
      setCurrentPage(page);
      // Scroll to comments section on mobile
      if (isMobile) {
        document.querySelector('.comments-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    return (
      <div className="comments-list">
        {comments.length > 0 ? (
          <>
            {currentComments.map((comment) => (
              <div 
                key={comment._id} 
                className="card comment-card mb-2" 
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: isMobile ? '6px' : '8px'
                }}
              >
                <div className={`card-body ${isMobile ? 'p-2' : 'p-3'}`}>
                  <div className="comment-header d-flex justify-content-between align-items-start mb-2">
                    <div className="comment-username fw-bold small" style={{ color: 'var(--accent-color)' }}>
                      <i className="fas fa-user-circle me-1"></i>
                      {comment.username || comment.userName || 'Anonymous'}
                    </div>
                    <small className={`comment-date text-muted ${isMobile ? 'fs-mobile-xs' : ''}`} style={{ fontSize: '0.75rem' }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown date'}
                    </small>
                  </div>
                  <div className="comment-text">
                    <p className={`mb-0 ${isMobile ? 'fs-mobile-sm' : 'small'}`} 
                       style={{ lineHeight: '1.5', color: 'var(--primary-text)', wordWrap: 'break-word' }}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <MobilePagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="no-comments text-center py-4" style={{ color: 'var(--secondary-text)' }}>
            <i className="fas fa-comments fa-2x mb-3 opacity-50"></i>
            <h6>No comments yet</h6>
            <p className="small mb-0">Be the first to share your thoughts about this movie!</p>
          </div>
        )}
      </div>
    );
  };

  // Mobile-optimized movie actions
  const MovieActions = () => (
    <div className="movie-actions">
      <button 
        className={`btn btn-primary ${isMobile ? 'btn-lg w-100 mb-3' : 'btn-lg px-4 py-3 me-3 mb-3'}`}
        onClick={handleWatchClick}
        disabled={!movie.videoUrl}
        style={{
          background: movie.videoUrl ? 'var(--accent-color)' : '#6c757d',
          border: 'none',
          borderRadius: '12px',
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        <FaPlay className="me-2" />
        {movie.videoUrl ? 'Watch Trailer' : 'No Trailer Available'}
      </button>
      
      <div className={`like-dislike-container ${isMobile ? 'd-flex flex-column gap-2' : 'd-flex gap-3'} mt-3`}>
        <button
          className={`btn btn-outline-success ${isMobile ? 'btn-lg w-100' : 'btn-lg px-4 py-2'} ${likeStatus === 1 ? 'active' : ''}`}
          onClick={handleLikeClick}
          disabled={!user}
          style={{
            borderRadius: '12px',
            fontWeight: '600',
            backgroundColor: likeStatus === 1 ? '#28a745' : 'transparent',
            borderColor: '#28a745',
            color: likeStatus === 1 ? '#fff' : '#28a745'
          }}
        >
          <FaThumbsUp className="me-2" />
          Like ({movie.likes || 0})
        </button>
        
        <button
          className={`btn btn-outline-danger ${isMobile ? 'btn-lg w-100' : 'btn-lg px-4 py-2'} ${likeStatus === -1 ? 'active' : ''}`}
          onClick={handleDislikeClick}
          disabled={!user}
          style={{
            borderRadius: '12px',
            fontWeight: '600',
            backgroundColor: likeStatus === -1 ? '#dc3545' : 'transparent',
            borderColor: '#dc3545',
            color: likeStatus === -1 ? '#fff' : '#dc3545'
          }}
        >
          <FaThumbsDown className="me-2" />
          Dislike ({movie.dislikes || 0})
        </button>
      </div>
    </div>
  );

  // Mobile-optimized comment form
  const CommentForm = () => {
    const wordCount = commentText.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    return (
      <>
        {user && (
          <div 
            className={`comment-form ${isMobile ? 'mb-2 p-2' : 'mb-3 p-3'} rounded`}
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <div className="form-group mb-2">
              <textarea
                className="form-control comment-textarea"
                rows={isMobile ? "2" : "3"}
                placeholder="Share your thoughts about this movie..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: isMobile ? '6px' : '8px',
                  color: 'var(--primary-text)',
                  fontSize: isMobile ? '0.95rem' : '0.9rem',
                  padding: isMobile ? '10px' : '12px'
                }}
              />
              <div className="comment-word-count mt-1 small text-muted">
                {wordCount}/300 words
              </div>
            </div>
            <button
              className={`btn ${isMobile ? 'btn-sm w-100' : 'btn-sm px-3'} py-1`}
              onClick={handleCommentSubmit}
              disabled={!commentText.trim() || wordCount > 300}
              style={{
                backgroundColor: 'var(--accent-color)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              Post Comment
            </button>
          </div>
        )}

        {!user && (
          <div className={`alert alert-info ${isMobile ? 'mb-2 py-2' : 'mb-3 py-2'} small`} 
               style={{ borderRadius: isMobile ? '6px' : '8px' }}>
            <Link to="/login" className="text-decoration-none fw-bold">Log in</Link> to post a comment.
          </div>
        )}
      </>
    );
  };

  // Handle loading and error states
  if (error) {
    return (
      <>
        <ErrorSEO />
        <div className="container movie-detail-container">
          <div className="error-container">
            <div className="error-message">Error: {error}</div>
          </div>
        </div>
      </>
    );
  }

  if (loading || !movie) {
    return (
      <>
        <LoadingSEO />
        <div className="container movie-detail-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading movie details...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <MovieSEO movie={movie} />
      
      <div className={`container movie-detail-container ${isMobile ? 'py-2' : 'py-4'}`}>
        {/* Alert message */}
        {alertMessage && (
          <div className={`alert alert-warning alert-custom alert-dismissible fade show ${isMobile ? 'mb-2' : 'mb-4'}`} role="alert">
            {alertMessage}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setAlertMessage('')}
            />
          </div>
        )}
        
        {/* Video player modal */}
        {showPlayer && (
          <div className="modal d-flex justify-content-center align-items-center video-modal position-fixed top-0 start-0 w-100 h-100" 
               style={{ display: "block", zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className={`modal-dialog ${isMobile ? 'modal-fullscreen-sm-down' : 'modal-xl'}`}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{movie.title} - Trailer</h5>
                  <button type="button" className="btn-close" onClick={handleClosePlayer}></button>
                </div>
                <div className="modal-body p-0">
                  <ReactPlayer 
                    url={movie.videoUrl} 
                    playing 
                    controls 
                    width="100%" 
                    height={isMobile ? "300px" : "500px"} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Breadcrumb - hide on very small screens */}
        <nav aria-label="breadcrumb" className={`${isMobile ? 'mb-2 d-none d-sm-block' : 'mb-4'}`}>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/movies" className="text-decoration-none">Movies</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {movie.title}
            </li>
          </ol>
        </nav>
        
        {/* Main movie details section */}
        <div className={`row g-4 ${isMobile ? 'mb-3' : 'mb-5'}`}>
          <div className={isMobile ? "col-12" : "col-lg-5 col-md-6"}>
            <div className="movie-poster-container">
              <img
                src={movie.imageUrl || movie.image}
                alt={`${movie.title} movie poster`}
                className="img-fluid movie-poster w-100"
                style={{
                  minHeight: isMobile ? '350px' : '600px',
                  maxHeight: isMobile ? '400px' : '800px',
                  objectFit: 'cover',
                  borderRadius: isMobile ? '8px' : '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onError={(e) => {
                  if (e.target.src !== movie.image && movie.image) {
                    e.target.src = movie.image;
                  } else if (e.target.src !== '/placeholder-movie.jpg') {
                    e.target.src = '/placeholder-movie.jpg';
                  } else {
                    e.target.src = 'https://via.placeholder.com/400x600/333/fff?text=No+Image';
                  }
                }}
              />
            </div>
          </div>
          
          <div className={isMobile ? "col-12" : "col-lg-7 col-md-6"}>
            <div className="movie-info">
              <h1 className={`movie-title ${isMobile ? 'display-6' : 'display-4'} fw-bold mb-3`} 
                  style={{ color: 'var(--primary-text)', lineHeight: '1.2' }}>
                {movie.title}
              </h1>
              
              <div className="movie-rating-badge mb-3">
                <span className={`badge bg-warning text-dark ${isMobile ? 'fs-6' : 'fs-5'} px-3 py-2`}>
                  <i className="fas fa-star me-1"></i>
                  {movie.rating}/10
                </span>
              </div>
              
              <p className={`movie-description ${isMobile ? 'fs-6' : 'fs-5'} mb-4`} 
                 style={{ color: 'var(--secondary-text)', lineHeight: '1.6' }}>
                {movie.description}
              </p>
              
              <div className="movie-meta mb-4">
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div 
                      className={`meta-item ${isMobile ? 'p-2' : 'p-3'} rounded`}
                      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                    >
                      <strong style={{ color: 'var(--accent-color)' }}>Genre:</strong>
                      <div style={{ color: 'var(--primary-text)' }} className="fs-6">{movie.genres}</div>
                    </div>
                  </div>
                  
                  <div className="col-sm-6">
                    <div 
                      className={`meta-item ${isMobile ? 'p-2' : 'p-3'} rounded`}
                      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                    >
                      <strong style={{ color: 'var(--accent-color)' }}>Release Year:</strong>
                      <div style={{ color: 'var(--primary-text)' }} className="fs-6">{movie.year}</div>
                    </div>
                  </div>
                  {movie.director && (
                    <div className="col-sm-6">
                      <div 
                        className={`meta-item ${isMobile ? 'p-2' : 'p-3'} rounded`}
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                      >
                        <strong style={{ color: 'var(--accent-color)' }}>Director:</strong>
                        <div style={{ color: 'var(--primary-text)' }} className="fs-6">{movie.director}</div>
                      </div>
                    </div>
                  )}
                  {movie.cast && (
                    <div className="col-12">
                      <div 
                        className={`meta-item ${isMobile ? 'p-2' : 'p-3'} rounded`}
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                      >
                        <strong style={{ color: 'var(--accent-color)' }}>Cast:</strong>
                        <div style={{ color: 'var(--primary-text)' }} className="fs-6">{movie.cast}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <MovieActions />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className={`comments-section ${isMobile ? 'mb-3' : 'mb-5'}`}>
          <div className="row">
            <div className="col-12">
              <h3 className={`comments-title ${isMobile ? 'h5' : 'h4'} mb-3`} style={{ color: 'var(--primary-text)' }}>
                <i className="fas fa-comments me-2"></i>
                Comments ({comments.length})
              </h3>
              
              <CommentForm />
              <CommentsWithPagination comments={comments} />
            </div>
          </div>
        </div>

        {/* Recommended Movies Section */}
        {recommendedMovies.length > 0 && (
          <div className="recommended-section">
            <div className="row">
              <div className="col-12">
                <h3 className={`recommended-title ${isMobile ? 'h5' : 'h4'} mb-3`} style={{ color: 'var(--primary-text)' }}>
                  <i className="fas fa-film me-2"></i>
                  More {movie.genres} Movies
                </h3>
                <div className="row g-3">
                  {recommendedMovies.map((recMovie) => (
                    <div key={recMovie._id} className={isMobile ? "col-6" : "col-6 col-md-4 col-lg-3"}>
                      <div 
                        className="recommended-movie-card h-100 position-relative overflow-hidden"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: isMobile ? '8px' : '12px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Link
                          to={`/movie/${recMovie._id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                          aria-label={`Watch ${recMovie.title}`}
                        >
                          <div className="position-relative">
                            <img
                              src={recMovie.imageUrl || recMovie.image}
                              alt={`${recMovie.title} movie poster`}
                              className="recommended-movie-img w-100"
                              loading="lazy"
                              style={{
                                height: isMobile ? '200px' : '250px',
                                objectFit: 'cover',
                                borderRadius: isMobile ? '8px 8px 0 0' : '12px 12px 0 0'
                              }}
                              onError={(e) => {
                                if (e.target.src !== recMovie.image && recMovie.image) {
                                  e.target.src = recMovie.image;
                                } else if (e.target.src !== '/placeholder-movie.jpg') {
                                  e.target.src = '/placeholder-movie.jpg';
                                } else {
                                  e.target.src = 'https://via.placeholder.com/300x250/333/fff?text=No+Image';
                                }
                              }}
                            />

                            {recMovie.rating && (
                              <div className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark"
                                   style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', padding: '4px 8px' }}>
                                <i className="fas fa-star me-1"></i>
                                {parseFloat(recMovie.rating).toFixed(1)}
                              </div>
                            )}
                          </div>

                          <div className={`card-body ${isMobile ? 'p-2' : 'p-2'}`}>
                            <h6 
                              className="recommended-movie-title mb-1 fw-bold"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: isMobile ? '0.8rem' : '0.9rem',
                                color: 'var(--primary-text)'
                              }}
                            >
                              {recMovie.title}
                            </h6>
                            <div className={`recommended-movie-meta d-flex align-items-center text-muted ${isMobile ? 'flex-column' : ''}`} 
                                 style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                              <i className="fas fa-calendar me-1" style={{ fontSize: '0.7rem' }}></i>
                              <span>{recMovie.year || recMovie.releaseYear}</span>
                              {recMovie.genres && !isMobile && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
                                    {recMovie.genres.length > 15 ? recMovie.genres.substring(0, 15) + '...' : recMovie.genres}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MovieDetailPage;
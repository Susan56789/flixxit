import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getUserToken } from "../utils/helpers";
import { useTheme } from "../themeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faShare, faPlus, faStar, faCalendar } from "@fortawesome/free-solid-svg-icons";

const MovieList = ({ movies, type, showCount = 4 }) => {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('warning');
  const [watchlistStatus, setWatchlistStatus] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  const { theme, isDark } = useTheme();

  // Hide alert message after 3 seconds
  useEffect(() => {
    let timeout;
    if (alertMessage) {
      timeout = setTimeout(() => {
        setAlertMessage('');
        setAlertType('warning');
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  // Check watchlist status for all movies
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      const token = getUserToken();
      if (!token || !movies.length) return;

      try {
        const response = await axios.get(
          'https://flixxit-h9fa.onrender.com/api/watchlist',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const watchlistMovieIds = response.data.map(item => item.movieId || item._id);
        const statusMap = {};
        movies.forEach(movie => {
          statusMap[movie._id] = watchlistMovieIds.includes(movie._id);
        });
        setWatchlistStatus(statusMap);
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      }
    };

    checkWatchlistStatus();
  }, [movies]);

  const showAlert = useCallback((message, type = 'warning') => {
    setAlertMessage(message);
    setAlertType(type);
  }, []);

  const addToWatchlist = async (movieId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = getUserToken();
      if (!token) {
        showAlert("Please log in to add movies to your watchlist.", 'warning');
        return;
      }

      setLoadingStates(prev => ({ ...prev, [movieId]: true }));

      const response = await axios.post(
        'https://flixxit-h9fa.onrender.com/api/watchlist',
        { movieId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setWatchlistStatus(prev => ({ ...prev, [movieId]: true }));
      showAlert(response.data.message || 'Added to watchlist!', 'success');

    } catch (error) {
      console.error("Error adding to watchlist:", error);
      if (error.response?.status === 409) {
        showAlert('Movie already in watchlist', 'info');
      } else {
        showAlert('Failed to add to watchlist. Please try again.', 'danger');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [movieId]: false }));
    }
  };

  const shareMovie = (movie, e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: `Check out: ${movie.title}`,
      text: `I found this great movie "${movie.title}" (${movie.year}). ${movie.genres ? `genres: ${movie.genres}` : ''}`,
      url: `${window.location.origin}/movies/${movie._id}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => showAlert('Shared successfully!', 'success'))
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            copyToClipboard(shareData.url);
          }
        });
    } else {
      copyToClipboard(shareData.url);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch(() => showAlert('Failed to copy link', 'danger'));
  };

  // Sort movies based on type
  const getSortedMovies = useCallback(() => {
    if (!Array.isArray(movies)) return [];

    const moviesCopy = [...movies];

    switch (type) {
      case 'newArrivals':
        return moviesCopy.sort((a, b) => {
          // Sort by createdAt or ObjectId timestamp
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(parseInt(a._id.substring(0, 8), 16) * 1000);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(parseInt(b._id.substring(0, 8), 16) * 1000);
          return dateB.getTime() - dateA.getTime();
        });
      case 'mostPopular':
        return moviesCopy.sort((a, b) => {
          const likesA = parseInt(a.likeCount, 10) || 0;
          const likesB = parseInt(b.likeCount, 10) || 0;
          return likesB - likesA;
        });
      case 'mostRated':
      case 'recommended': // Keep compatibility with old naming
        return moviesCopy
          .filter(movie => movie.rating && !isNaN(parseFloat(movie.rating)))
          .sort((a, b) => {
            const ratingA = parseFloat(a.rating) || 0;
            const ratingB = parseFloat(b.rating) || 0;
            return ratingB - ratingA;
          });
      default:
        return moviesCopy;
    }
  }, [movies, type]);

  const sortedMovies = getSortedMovies();
  const displayMovies = sortedMovies.slice(0, showCount);

  return (
    <div className="movie-list-container">
      {/* Alert Message */}
      {alertMessage && (
        <div
          className={`alert alert-${alertType} alert-dismissible fade show position-fixed`}
          role="alert"
          style={{
            top: '80px',
            right: '20px',
            zIndex: 1050,
            maxWidth: '350px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {alertMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlertMessage('')}
          />
        </div>
      )}

      {/* Movie Grid - Updated responsive classes */}
      <div className="row g-3 g-md-4">
        {displayMovies.length > 0 ? (
          displayMovies.map((movie) => (
            <div key={movie._id} className="col-6 col-md-4 col-lg-3">
              <div className="movie-card h-100 position-relative overflow-hidden rounded-3 shadow-sm hover-scale-animation"
                style={{
                  backgroundColor: 'var(--secondary-bg)',
                  border: `1px solid var(--border-color)`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                <Link
                  to={`/movies/${movie._id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="position-relative">
                    <img
                      src={movie.imageUrl}
                      className="card-img-top"
                      alt={movie.title}
                      style={{
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px 12px 0 0'
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/placeholder-movie.jpg'; // Fallback image
                      }}
                    />

                    {/* Rating Badge - Responsive sizing */}
                    {movie.rating && (
                      <div className="position-absolute top-0 end-0 m-1 m-md-2 badge bg-dark bg-opacity-75"
                        style={{ fontSize: '0.7rem' }}>
                        <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                        {parseFloat(movie.rating).toFixed(1)}
                      </div>
                    )}

                    {/* Show popularity indicator for mostPopular type */}
                    {type === 'mostPopular' && movie.likeCount !== undefined && (
                      <div className="position-absolute top-0 start-0 m-1 m-md-2 badge bg-danger bg-opacity-75"
                        style={{ fontSize: '0.7rem' }}>
                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                        {movie.likeCount}
                      </div>
                    )}
                  </div>

                  <div className="card-body p-2 p-md-3">
                    <h6 className="card-title fw-bold mb-1"
                      style={{
                        color: 'var(--primary-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.9rem'
                      }}>
                      {movie.title}
                    </h6>
                    <div className="d-flex align-items-center text-muted small"
                      style={{ fontSize: '0.75rem' }}>
                      <FontAwesomeIcon icon={faCalendar} className="me-1" style={{ fontSize: '0.7rem' }} />
                      <span>{movie.year}</span>
                      {movie.genres && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="d-none d-sm-inline">{movie.genres}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action Buttons - Responsive sizing */}
                <div className="card-footer bg-transparent border-0 d-flex justify-content-around p-1 p-md-2">
                  <button
                    className={`btn btn-sm ${watchlistStatus[movie._id] ? 'btn-danger' : 'btn-outline-danger'} flex-fill me-1`}
                    onClick={(e) => addToWatchlist(movie._id, e)}
                    disabled={loadingStates[movie._id] || watchlistStatus[movie._id]}
                    title={watchlistStatus[movie._id] ? "In watchlist" : "Add to watchlist"}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    {loadingStates[movie._id] ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <FontAwesomeIcon
                        icon={watchlistStatus[movie._id] ? faHeart : faPlus}
                        className={watchlistStatus[movie._id] ? "text-white" : ""}
                      />
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary flex-fill ms-1"
                    onClick={(e) => shareMovie(movie, e)}
                    title="Share movie"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <FontAwesomeIcon icon={faShare} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="text-muted">
              <FontAwesomeIcon icon={faStar} size="3x" className="mb-3 opacity-50" />
              <h5>No movies found</h5>
              <p>Try adjusting your filters or check back later for new content.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieList;
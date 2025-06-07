import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getUser, getUserToken } from '../utils/helpers';
import { useTheme } from '../themeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faTrash, 
    faPlay, 
    faStar, 
    faCalendar, 
    faFilm,
    faBookmark,
    faSpinner,
    faExclamationTriangle,
    faBroom
} from '@fortawesome/free-solid-svg-icons';

// Fallback image for when movie images fail to load
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23444"%2F%3E%3Cg fill="%23888"%3E%3Ccircle cx="200" cy="180" r="50"%2F%3E%3Cpath d="M100 300 L300 300 L280 250 L200 280 L150 240 Z"%2F%3E%3C%2Fg%3E%3Ctext x="50%25" y="400" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%23999"%3ENo Image%3C%2Ftext%3E%3Ctext x="50%25" y="430" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%23999"%3EAvailable%3C%2Ftext%3E%3C%2Fsvg%3E';

const Watchlist = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [imageErrors, setImageErrors] = useState({});
    const [removingIds, setRemovingIds] = useState(new Set());
    const [clearingWatchlist, setClearingWatchlist] = useState(false);
    const { theme } = useTheme();

    // Handle image loading errors
    const handleImageError = useCallback((movieId) => {
        setImageErrors(prev => ({ ...prev, [movieId]: true }));
    }, []);

    // Get image URL with fallback
    const getImageUrl = useCallback((movie) => {
        if (imageErrors[movie._id]) {
            return FALLBACK_IMAGE;
        }
        if (movie.imageUrl) {
            let url = movie.imageUrl.trim();
            
            // Handle base64 images - return as is
            if (url.startsWith('data:image/')) {
                return url;
            }
            
            // Handle relative URLs
            if (url.startsWith('//')) {
                url = 'https:' + url;
            } else if (url.startsWith('/')) {
                url = 'https://image.tmdb.org' + url; // Assuming TMDB images
            } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            // Remove any double slashes except after http:
            url = url.replace(/([^:]\/)\/+/g, "$1");
            return url;
        }
        return FALLBACK_IMAGE;
    }, [imageErrors]);

    // Show alert message
    const showAlert = useCallback((message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setTimeout(() => setAlertMessage(''), 4000);
    }, []);

    // Format date for display
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return '';
        }
    }, []);

    // Fetch watchlist
    const fetchWatchlist = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getUserToken();
            const user = getUser();
            const userId = user?._id;

            if (!token || !userId) {
                setError('Please log in to view your watchlist.');
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `https://flixxit-h9fa.onrender.com/api/watchlist/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Handle different response structures
            const watchlistData = Array.isArray(response.data) ? response.data : [];
            
            // Sort by most recently added if addedToWatchlistAt is available
            const sortedMovies = watchlistData.sort((a, b) => {
                if (a.addedToWatchlistAt && b.addedToWatchlistAt) {
                    return new Date(b.addedToWatchlistAt) - new Date(a.addedToWatchlistAt);
                }
                return 0;
            });

            setMovies(sortedMovies);
            setError(null);

        } catch (error) {
            console.error('Watchlist fetch error:', error);
            
            if (error.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else if (error.response?.status === 404) {
                setError('Watchlist not found. Please try again.');
            } else if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Error fetching watchlist. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    // Remove movie from watchlist
    const removeFromWatchlist = async (movieId) => {
        try {
            const token = getUserToken();
            const user = getUser();
            const userId = user?._id;

            if (!token || !userId) {
                showAlert('Please log in to remove movies from your watchlist.', 'error');
                return;
            }

            // Add to removing set for loading state
            setRemovingIds(prev => new Set([...prev, movieId]));

            await axios.delete(
                `https://flixxit-h9fa.onrender.com/api/watchlist/${movieId}/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Remove from state immediately for better UX
            setMovies(prevMovies => 
                prevMovies.filter(movie => movie._id.toString() !== movieId.toString())
            );
            
            showAlert("Movie removed from watchlist successfully!", 'success');

        } catch (error) {
            console.error('Remove from watchlist error:', error);
            
            if (error.response?.status === 401) {
                showAlert('Session expired. Please log in again.', 'error');
            } else if (error.response?.status === 404) {
                showAlert('Movie not found in watchlist.', 'warning');
                // Still remove from UI since it's not in the watchlist anyway
                setMovies(prevMovies => 
                    prevMovies.filter(movie => movie._id.toString() !== movieId.toString())
                );
            } else {
                showAlert('Error removing from watchlist. Please try again.', 'error');
            }
        } finally {
            // Remove from removing set
            setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
        }
    };

    // Clear entire watchlist
    const clearWatchlist = async () => {
        if (!window.confirm('Are you sure you want to clear your entire watchlist? This action cannot be undone.')) {
            return;
        }

        try {
            setClearingWatchlist(true);
            const token = getUserToken();
            const user = getUser();
            const userId = user?._id;

            if (!token || !userId) {
                showAlert('Please log in to clear your watchlist.', 'error');
                return;
            }

            await axios.delete(
                `https://flixxit-h9fa.onrender.com/api/watchlist/${userId}/clear`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMovies([]);
            showAlert('Watchlist cleared successfully!', 'success');

        } catch (error) {
            console.error('Clear watchlist error:', error);
            showAlert('Error clearing watchlist. Please try again.', 'error');
        } finally {
            setClearingWatchlist(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className={`watchlist-page ${theme} page-content`}>
                <div className="container">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                        <div className="text-center">
                            <FontAwesomeIcon 
                                icon={faSpinner} 
                                spin 
                                size="3x" 
                                style={{ color: 'var(--accent-color)', marginBottom: '20px' }}
                            />
                            <h4 style={{ color: 'var(--primary-text)' }}>Loading your watchlist...</h4>
                            <p style={{ color: 'var(--secondary-text)' }}>Please wait while we fetch your saved movies</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`watchlist-page ${theme} page-content`}>
                <div className="container mt-5">
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <div className="card border-danger">
                                <div className="card-body text-center">
                                    <FontAwesomeIcon 
                                        icon={faExclamationTriangle} 
                                        size="3x" 
                                        className="text-danger mb-3"
                                    />
                                    <h4 className="card-title text-danger">Oops! Something went wrong</h4>
                                    <p className="card-text" style={{ color: 'var(--secondary-text)' }}>
                                        {error}
                                    </p>
                                    <div>
                                        <button 
                                            className="btn btn-danger me-3"
                                            onClick={fetchWatchlist}
                                        >
                                            Try Again
                                        </button>
                                        <Link to="/" className="btn btn-outline-primary">
                                            Go Home
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (movies.length === 0) {
        return (
            <div className={`watchlist-page ${theme} page-content`}>
                <div className="container">
                    {/* Alert Message */}
                    {alertMessage && (
                        <div
                            className={`alert alert-${alertType === 'success' ? 'success' : alertType === 'error' ? 'danger' : 'warning'} alert-dismissible fade show position-fixed`}
                            role="alert"
                            style={{ 
                                top: '20px', 
                                right: '20px', 
                                zIndex: 1050,
                                maxWidth: '400px'
                            }}
                        >
                            <FontAwesomeIcon 
                                icon={alertType === 'success' ? faHeart : faExclamationTriangle} 
                                className="me-2"
                            />
                            {alertMessage}
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setAlertMessage('')}
                            />
                        </div>
                    )}

                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                        <div className="text-center">
                            <FontAwesomeIcon 
                                icon={faBookmark} 
                                size="4x" 
                                style={{ color: 'var(--accent-color)', marginBottom: '30px', opacity: 0.5 }}
                            />
                            <h2 style={{ color: 'var(--primary-text)', marginBottom: '20px' }}>
                                Your watchlist is empty
                            </h2>
                            <p style={{ color: 'var(--secondary-text)', marginBottom: '30px', fontSize: '1.1rem' }}>
                                Start building your collection by adding movies you want to watch later
                            </p>
                            <Link 
                                to="/" 
                                className="btn btn-lg"
                                style={{
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px'
                                }}
                            >
                                <FontAwesomeIcon icon={faFilm} className="me-2" />
                                Browse Movies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`watchlist-page ${theme} page-content`}>
            <div className="container">
                {/* Alert Message */}
                {alertMessage && (
                    <div
                        className={`alert alert-${alertType === 'success' ? 'success' : alertType === 'error' ? 'danger' : 'warning'} alert-dismissible fade show position-fixed`}
                        role="alert"
                        style={{ 
                            top: '20px', 
                            right: '20px', 
                            zIndex: 1050,
                            maxWidth: '400px'
                        }}
                    >
                        <FontAwesomeIcon 
                            icon={alertType === 'success' ? faHeart : faExclamationTriangle} 
                            className="me-2"
                        />
                        {alertMessage}
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => setAlertMessage('')}
                        />
                    </div>
                )}

                {/* Header Section */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-wrap">
                            <div className="mb-3 mb-md-0">
                                <h1 className="display-5 fw-bold mb-2" style={{ color: 'var(--primary-text)' }}>
                                    <FontAwesomeIcon icon={faBookmark} className="me-3" style={{ color: 'var(--accent-color)' }} />
                                    My Watchlist
                                </h1>
                                <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem' }}>
                                    {movies.length} movie{movies.length !== 1 ? 's' : ''} saved for later
                                </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                <Link 
                                    to="/" 
                                    className="btn btn-outline-primary"
                                    style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                                >
                                    <FontAwesomeIcon icon={faFilm} className="me-2" />
                                    Browse More
                                </Link>
                                {movies.length > 0 && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={clearWatchlist}
                                        disabled={clearingWatchlist}
                                        title="Clear entire watchlist"
                                    >
                                        {clearingWatchlist ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                Clearing...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faBroom} className="me-2" />
                                                Clear All
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                        <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />
                    </div>
                </div>

                {/* Movies Grid */}
                <div className="row g-4">
                    {movies.map((movie) => (
                        <div key={movie._id} className="col-lg-3 col-md-4 col-sm-6 col-12">
                            <div 
                                className="card h-100 movie-card"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                }}
                            >
                                {/* Movie Poster */}
                                <div style={{ position: 'relative', overflow: 'hidden' }}>
                                    <img 
                                        src={getImageUrl(movie)} 
                                        className="card-img-top" 
                                        alt={movie.title}
                                        style={{ 
                                            height: '300px', 
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease',
                                            backgroundColor: '#f8f9fa'
                                        }}
                                        onError={() => handleImageError(movie._id)}
                                        onLoad={(e) => {
                                            // Remove any loading placeholder
                                            e.target.style.backgroundColor = 'transparent';
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    />
                                    
                                    {/* Loading placeholder for images - only show for non-base64 images */}
                                    {!imageErrors[movie._id] && !movie.imageUrl?.startsWith('data:image/') && (
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                color: '#6c757d',
                                                fontSize: '0.9rem',
                                                pointerEvents: 'none',
                                                opacity: getImageUrl(movie) === FALLBACK_IMAGE ? 1 : 0,
                                                transition: 'opacity 0.3s ease'
                                            }}
                                        >
                                            Loading...
                                        </div>
                                    )}
                                    
                                    {/* Overlay with actions */}
                                    <div 
                                        className="movie-overlay"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
                                            opacity: 0,
                                            transition: 'opacity 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            padding: '20px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = 1;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = 0;
                                        }}
                                    >
                                        <Link
                                            to={`/movies/${movie._id}`}
                                            className="btn btn-sm text-white"
                                            style={{
                                                backgroundColor: 'var(--accent-color)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                padding: '8px 16px'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faPlay} className="me-2" />
                                            Watch Now
                                        </Link>
                                    </div>

                                    {/* Added date badge */}
                                    {movie.addedToWatchlistAt && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                backdropFilter: 'blur(5px)'
                                            }}
                                        >
                                            Added {formatDate(movie.addedToWatchlistAt)}
                                        </div>
                                    )}
                                </div>

                                {/* Movie Info */}
                                <div className="card-body d-flex flex-column" style={{ padding: '16px' }}>
                                    <h6 
                                        className="card-title fw-bold mb-2" 
                                        style={{ 
                                            color: 'var(--primary-text)',
                                            fontSize: '1rem',
                                            lineHeight: '1.3',
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}
                                        title={movie.title}
                                    >
                                        {movie.title}
                                    </h6>
                                    
                                    <div className="movie-meta mb-3">
                                        {movie.year && (
                                            <span 
                                                className="badge me-2"
                                                style={{ 
                                                    backgroundColor: 'var(--accent-color)', 
                                                    color: 'white',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCalendar} className="me-1" />
                                                {movie.year}
                                            </span>
                                        )}
                                        {movie.rating && (
                                            <span 
                                                className="badge"
                                                style={{ 
                                                    backgroundColor: '#ffc107', 
                                                    color: '#000',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faStar} className="me-1" />
                                                {movie.rating}
                                            </span>
                                        )}
                                        {movie.likeCount !== undefined && (
                                            <span 
                                                className="badge ms-2"
                                                style={{ 
                                                    backgroundColor: '#28a745', 
                                                    color: 'white',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                {movie.likeCount}
                                            </span>
                                        )}
                                    </div>

                                    {movie.genres && (
                                        <p 
                                            style={{ 
                                                color: 'var(--secondary-text)', 
                                                fontSize: '0.85rem',
                                                marginBottom: '12px',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                                        </p>
                                    )}

                                    {movie.description && (
                                        <p 
                                            style={{ 
                                                color: 'var(--secondary-text)', 
                                                fontSize: '0.8rem',
                                                marginBottom: '12px',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: '1.4'
                                            }}
                                            title={movie.description}
                                        >
                                            {movie.description}
                                        </p>
                                    )}

                                    {/* Action Button */}
                                    <div className="mt-auto">
                                        <button
                                            className="btn btn-outline-danger btn-sm w-100"
                                            onClick={() => removeFromWatchlist(movie._id)}
                                            disabled={removingIds.has(movie._id)}
                                            style={{
                                                borderColor: 'var(--accent-color)',
                                                color: 'var(--accent-color)',
                                                borderRadius: '20px',
                                                padding: '8px 16px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {removingIds.has(movie._id) ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                    Removing...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                                                    Remove from Watchlist
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Statistics Section */}
                {movies.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <div className="card" style={{ backgroundColor: 'var(--secondary-bg)', border: '1px solid var(--border-color)' }}>
                                <div className="card-body">
                                    <h5 className="card-title" style={{ color: 'var(--primary-text)' }}>
                                        <FontAwesomeIcon icon={faBookmark} className="me-2" style={{ color: 'var(--accent-color)' }} />
                                        Watchlist Statistics
                                    </h5>
                                    <div className="row text-center">
                                        <div className="col-md-3 col-6 mb-3">
                                            <div className="h4 mb-1" style={{ color: 'var(--accent-color)' }}>
                                                {movies.length}
                                            </div>
                                            <small style={{ color: 'var(--secondary-text)' }}>Total Movies</small>
                                        </div>
                                        <div className="col-md-3 col-6 mb-3">
                                            <div className="h4 mb-1" style={{ color: 'var(--accent-color)' }}>
                                                {movies.filter(m => m.year && parseInt(m.year) >= new Date().getFullYear() - 2).length}
                                            </div>
                                            <small style={{ color: 'var(--secondary-text)' }}>Recent Movies</small>
                                        </div>
                                        <div className="col-md-3 col-6 mb-3">
                                            <div className="h4 mb-1" style={{ color: 'var(--accent-color)' }}>
                                                {movies.filter(m => m.rating && parseFloat(m.rating) >= 8).length}
                                            </div>
                                            <small style={{ color: 'var(--secondary-text)' }}>Highly Rated (8+)</small>
                                        </div>
                                        <div className="col-md-3 col-6 mb-3">
                                            <div className="h4 mb-1" style={{ color: 'var(--accent-color)' }}>
                                                {Math.round(movies.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / movies.filter(m => m.rating).length * 10) / 10 || 0}
                                            </div>
                                            <small style={{ color: 'var(--secondary-text)' }}>Average Rating</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import MovieList from './MovieList';
import { Link } from 'react-router-dom';
import { useTheme } from '../themeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faChevronLeft, faChevronRight, faFilm } from '@fortawesome/free-solid-svg-icons';
import '../styles/HomePage.css';

// Fallback image for when movie images fail to load
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23333"%2F%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30" fill="%23666"%3ENo Image Available%3C%2Ftext%3E%3C%2Fsvg%3E';

const HomePage = () => {
    const [newArrivals, setNewArrivals] = useState([]);
    const [mostPopular, setMostPopular] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [imageErrors, setImageErrors] = useState({});
    const intervalRef = useRef(null);

    const { theme, isDark } = useTheme();

    // Handle image loading errors
    const handleImageError = useCallback((movieId) => {
        setImageErrors(prev => ({ ...prev, [movieId]: true }));
    }, []);

    // Get image URL with fallback
    const getImageUrl = useCallback((movie) => {
        if (imageErrors[movie._id]) {
            return FALLBACK_IMAGE;
        }
        // Fix common image URL issues
        if (movie.imageUrl) {
            // Remove any double slashes except after http:
            let url = movie.imageUrl.replace(/([^:]\/)\/+/g, "$1");
            // Ensure proper URL format
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return url;
        }
        return FALLBACK_IMAGE;
    }, [imageErrors]);

    const fetchMovies = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
            const moviesData = response.data;

            // Filter out movies without required data
            const validMovies = moviesData.filter(movie => movie && movie._id);

            // Sort movies for different categories
            const newArrivalsData = [...validMovies].sort((a, b) =>
                new Date(b.createdAt || b._id).getTime() - new Date(a.createdAt || a._id).getTime()
            );

            const mostPopularData = [...validMovies].sort((a, b) =>
                (parseInt(b.likeCount, 10) || 0) - (parseInt(a.likeCount, 10) || 0)
            );

            const recommendedData = [...validMovies].sort((a, b) =>
                (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)
            );

            setNewArrivals(newArrivalsData);
            setMostPopular(mostPopularData);
            setRecommended(recommendedData);
            setMovies(validMovies);
            setError(null);
        } catch (error) {
            console.error('Error fetching movies:', error);
            setError('Failed to load movies. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    // Auto-rotate carousel
    useEffect(() => {
        if (!isPaused && movies.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    const nextIndex = prevIndex + 1;
                    return nextIndex >= Math.min(movies.length, 5) ? 0 : nextIndex;
                });
            }, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [movies.length, isPaused]);

    const handlePrev = useCallback(() => {
        const maxIndex = Math.min(movies.length, 5) - 1;
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? maxIndex : prevIndex - 1
        );
    }, [movies.length]);

    const handleNext = useCallback(() => {
        const maxIndex = Math.min(movies.length, 5) - 1;
        setCurrentIndex((prevIndex) =>
            prevIndex === maxIndex ? 0 : prevIndex + 1
        );
    }, [movies.length]);

    const handleIndicatorClick = (index) => {
        setCurrentIndex(index);
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="spinner-border" role="status" style={{ color: 'var(--accent-color)' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <FontAwesomeIcon icon={faFilm} className="me-2" />
                    {error}
                    <button className="btn btn-sm btn-danger ms-auto" onClick={fetchMovies}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const carouselMovies = movies.slice(0, 5);

    return (
        <div className={`home-page ${theme}`}>
            <div className="container-fluid p-0">
                {/* Hero Carousel */}
                {carouselMovies.length > 0 && (
                    <div
                        className="carousel position-relative"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        style={{ height: '70vh', overflow: 'hidden', backgroundColor: 'var(--secondary-bg)' }}
                    >
                        <div
                            className="slides-container"
                            style={{
                                display: 'flex',
                                transform: `translateX(-${currentIndex * 100}%)`,
                                transition: 'transform 0.5s ease-in-out',
                                height: '100%'
                            }}
                        >
                            {carouselMovies.map((movie) => (
                                <div
                                    className="slide"
                                    key={movie._id}
                                    style={{
                                        position: 'relative',
                                        flexShrink: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#1a1a1a'
                                    }}
                                >
                                    {/* Background Image with Fallback */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${getImageUrl(movie)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    >
                                        {/* Hidden img tag to handle errors */}
                                        <img
                                            src={movie.imageUrl}
                                            alt=""
                                            style={{ display: 'none' }}
                                            onError={() => handleImageError(movie._id)}
                                        />
                                    </div>

                                    {/* Overlay Content */}
                                    <div className="overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
                                        style={{
                                            background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
                                            zIndex: 1
                                        }}>
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-lg-6 col-md-8">
                                                    <h1 className="display-4 fw-bold text-white mb-3">
                                                        {movie.title || 'Untitled'}
                                                    </h1>
                                                    <p className="text-white mb-4" style={{ fontSize: '1.1rem' }}>
                                                        {movie.year || 'Year N/A'}
                                                        {movie.genre && ` • ${movie.genre}`}
                                                        {movie.rating && ` • ⭐ ${movie.rating}`}
                                                    </p>
                                                    {movie.description && (
                                                        <p className="text-white mb-4" style={{
                                                            overflow: 'hidden',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 3,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}>
                                                            {movie.description}
                                                        </p>
                                                    )}
                                                    <Link
                                                        to={`/movies/${movie._id}`}
                                                        className="btn btn-danger btn-lg hover-scale-animation"
                                                        style={{
                                                            backgroundColor: 'var(--accent-color)',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faPlay} className="me-2" />
                                                        Watch Now
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons - Only show if more than 1 slide */}
                        {carouselMovies.length > 1 && (
                            <>
                                <button
                                    className="carousel-control-prev"
                                    onClick={handlePrev}
                                    aria-label="Previous slide"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '20px',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 2
                                    }}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-white" />
                                </button>
                                <button
                                    className="carousel-control-next"
                                    onClick={handleNext}
                                    aria-label="Next slide"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '20px',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 2
                                    }}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="text-white" />
                                </button>

                                {/* Indicators */}
                                <div className="carousel-indicators position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 2 }}>
                                    {carouselMovies.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                            onClick={() => handleIndicatorClick(index)}
                                            aria-label={`Go to slide ${index + 1}`}
                                            style={{
                                                width: index === currentIndex ? '30px' : '10px',
                                                height: '10px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                backgroundColor: index === currentIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                                                margin: '0 5px',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Movie Sections */}
                <div className="container mt-5">
                    {/* New Arrivals */}
                    <section className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="Movie-title h3 fw-bold" style={{ color: 'var(--primary-text)' }}>
                                New Arrivals
                            </h2>
                            <Link to="/categories?filter=new" className="text-decoration-none" style={{ color: 'var(--accent-color)' }}>
                                View All →
                            </Link>
                        </div>
                        <hr style={{ borderColor: 'var(--border-color)' }} />
                        <MovieList movies={newArrivals} type="newArrivals" />
                    </section>

                    {/* Most Popular */}
                    <section className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="Movie-title h3 fw-bold" style={{ color: 'var(--primary-text)' }}>
                                Most Popular
                            </h2>
                            <Link to="/categories?filter=popular" className="text-decoration-none" style={{ color: 'var(--accent-color)' }}>
                                View All →
                            </Link>
                        </div>
                        <hr style={{ borderColor: 'var(--border-color)' }} />
                        <MovieList movies={mostPopular} type="mostPopular" />
                    </section>

                    {/* Recommended */}
                    <section className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="Movie-title h3 fw-bold" style={{ color: 'var(--primary-text)' }}>
                                Recommended
                            </h2>
                            <Link to="/categories?filter=recommended" className="text-decoration-none" style={{ color: 'var(--accent-color)' }}>
                                View All →
                            </Link>
                        </div>
                        <hr style={{ borderColor: 'var(--border-color)' }} />
                        <MovieList movies={recommended} type="recommended" />
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
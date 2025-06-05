import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from "../themeContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilter,
    faSortAmountDown,
    faCalendarAlt,
    faStar,
    faHeart,
    faFilm,
    faChevronLeft,
    faChevronRight,
    faGrip,
    faList
} from '@fortawesome/free-solid-svg-icons';


// Fallback image for movie posters
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect width="300" height="450" fill="%23333"%2F%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23666"%3ENo Poster%3C%2Ftext%3E%3C%2Fsvg%3E';

const MovieCategories = () => {
    const [searchParams] = useSearchParams();
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [sortBy, setSortBy] = useState('title');
    const [viewMode, setViewMode] = useState('grid');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [imageErrors, setImageErrors] = useState({});
    const moviesPerPage = viewMode === 'grid' ? 12 : 10;

    const { theme, isDark } = useTheme();

    // Initialize from URL params
    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'new') {
            setSortBy('newest');
        } else if (filter === 'popular') {
            setSortBy('popularity');
        } else if (filter === 'recommended') {
            setSortBy('rating');
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
                setMovies(response.data);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError('Failed to load movies. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const handleImageError = useCallback((movieId) => {
        setImageErrors(prev => ({ ...prev, [movieId]: true }));
    }, []);

    const getImageUrl = useCallback((movie) => {
        if (imageErrors[movie._id]) {
            return FALLBACK_IMAGE;
        }
        return movie.imageUrl || FALLBACK_IMAGE;
    }, [imageErrors]);

    const handleGenreChange = (event) => {
        setSelectedGenre(event.target.value);
        setCurrentPage(1);
    };

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
        setCurrentPage(1);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
        setCurrentPage(1);
    };

    // Extract unique genres and years
    const { genres, years } = useMemo(() => {
        const uniqueGenres = new Set();
        const uniqueYears = new Set();

        movies.forEach(movie => {
            if (movie.genre) {
                // Handle multiple genres separated by comma
                movie.genre.split(',').forEach(g => uniqueGenres.add(g.trim()));
            }
            if (movie.year) {
                uniqueYears.add(movie.year);
            }
        });

        return {
            genres: Array.from(uniqueGenres).sort(),
            years: Array.from(uniqueYears).sort((a, b) => b - a)
        };
    }, [movies]);

    // Filter and sort movies
    const filteredAndSortedMovies = useMemo(() => {
        let filtered = [...movies];

        // Apply genre filter
        if (selectedGenre) {
            filtered = filtered.filter(movie =>
                movie.genre && movie.genre.includes(selectedGenre)
            );
        }

        // Apply year filter
        if (selectedYear) {
            filtered = filtered.filter(movie => movie.year === selectedYear);
        }

        // Apply sorting
        switch (sortBy) {
            case 'title':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'newest':
                filtered.sort((a, b) =>
                    new Date(b.createdAt || b._id).getTime() - new Date(a.createdAt || a._id).getTime()
                );
                break;
            case 'rating':
                filtered.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
                break;
            case 'popularity':
                filtered.sort((a, b) => (parseInt(b.likeCount, 10) || 0) - (parseInt(a.likeCount, 10) || 0));
                break;
            case 'year':
                filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            default:
                break;
        }

        return filtered;
    }, [selectedGenre, selectedYear, sortBy, movies]);

    // Pagination
    const currentMovies = useMemo(() => {
        const startIndex = (currentPage - 1) * moviesPerPage;
        return filteredAndSortedMovies.slice(startIndex, startIndex + moviesPerPage);
    }, [currentPage, filteredAndSortedMovies, moviesPerPage]);

    const totalPages = Math.ceil(filteredAndSortedMovies.length / moviesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSelectedGenre('');
        setSelectedYear('');
        setSortBy('title');
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
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
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4 px-lg-5">
            {/* Header and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                            <FontAwesomeIcon icon={faFilm} className="me-2" />
                            Movie Categories
                        </h2>
                        <div className="d-flex gap-2">
                            <button
                                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <FontAwesomeIcon icon={faGrip} />
                            </button>
                            <button
                                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <FontAwesomeIcon icon={faList} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="card" style={{
                        backgroundColor: 'var(--secondary-bg)',
                        borderColor: 'var(--border-color)'
                    }}>
                        <div className="card-body">
                            <div className="row g-3 align-items-end">
                                {/* Genre Filter */}
                                <div className="col-md-3">
                                    <label htmlFor="genre-select" className="form-label">
                                        <FontAwesomeIcon icon={faFilter} className="me-1" />
                                        Genre
                                    </label>
                                    <select
                                        id="genre-select"
                                        className="form-select"
                                        value={selectedGenre}
                                        onChange={handleGenreChange}
                                        style={{
                                            backgroundColor: 'var(--primary-bg)',
                                            color: 'var(--primary-text)',
                                            borderColor: 'var(--border-color)'
                                        }}
                                    >
                                        <option value="">All Genres</option>
                                        {genres.map((genre) => (
                                            <option key={genre} value={genre}>
                                                {genre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Filter */}
                                <div className="col-md-3">
                                    <label htmlFor="year-select" className="form-label">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                        Year
                                    </label>
                                    <select
                                        id="year-select"
                                        className="form-select"
                                        value={selectedYear}
                                        onChange={handleYearChange}
                                        style={{
                                            backgroundColor: 'var(--primary-bg)',
                                            color: 'var(--primary-text)',
                                            borderColor: 'var(--border-color)'
                                        }}
                                    >
                                        <option value="">All Years</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="col-md-3">
                                    <label htmlFor="sort-select" className="form-label">
                                        <FontAwesomeIcon icon={faSortAmountDown} className="me-1" />
                                        Sort By
                                    </label>
                                    <select
                                        id="sort-select"
                                        className="form-select"
                                        value={sortBy}
                                        onChange={handleSortChange}
                                        style={{
                                            backgroundColor: 'var(--primary-bg)',
                                            color: 'var(--primary-text)',
                                            borderColor: 'var(--border-color)'
                                        }}
                                    >
                                        <option value="title">Title (A-Z)</option>
                                        <option value="newest">Newest First</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="popularity">Most Popular</option>
                                        <option value="year">Year (Newest)</option>
                                    </select>
                                </div>

                                {/* Clear Filters */}
                                <div className="col-md-3">
                                    <button
                                        className="btn btn-outline-secondary w-100"
                                        onClick={clearFilters}
                                        disabled={!selectedGenre && !selectedYear && sortBy === 'title'}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="mt-3 text-muted">
                                Showing {currentMovies.length} of {filteredAndSortedMovies.length} movies
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Movies Display */}
            {currentMovies.length === 0 ? (
                <div className="text-center py-5">
                    <FontAwesomeIcon icon={faFilm} size="3x" className="text-muted mb-3" />
                    <p className="text-muted">No movies found with the selected filters</p>
                    <button className="btn btn-primary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                // Grid View
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-4">
                    {currentMovies.map((movie) => (
                        <div key={movie._id} className="col">
                            <Link
                                to={`/movies/${movie._id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card h-100 hover-scale-animation" style={{
                                    backgroundColor: 'var(--secondary-bg)',
                                    borderColor: 'var(--border-color)',
                                    overflow: 'hidden'
                                }}>
                                    <div className="position-relative">
                                        <img
                                            src={getImageUrl(movie)}
                                            className="card-img-top"
                                            alt={movie.title}
                                            style={{ height: '300px', objectFit: 'cover' }}
                                            onError={() => handleImageError(movie._id)}
                                        />
                                        {movie.rating && (
                                            <div className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75">
                                                <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                                                {parseFloat(movie.rating).toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-body p-3">
                                        <h6 className="card-title mb-1" style={{
                                            color: 'var(--primary-text)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {movie.title}
                                        </h6>
                                        <small className="text-muted">
                                            {movie.year} {movie.genre && `• ${movie.genre.split(',')[0]}`}
                                        </small>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                // List View
                <div className="row g-3">
                    {currentMovies.map((movie) => (
                        <div key={movie._id} className="col-12">
                            <Link
                                to={`/movies/${movie._id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card hover-scale-animation" style={{
                                    backgroundColor: 'var(--secondary-bg)',
                                    borderColor: 'var(--border-color)'
                                }}>
                                    <div className="row g-0">
                                        <div className="col-md-2">
                                            <img
                                                src={getImageUrl(movie)}
                                                className="img-fluid rounded-start"
                                                alt={movie.title}
                                                style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                                                onError={() => handleImageError(movie._id)}
                                            />
                                        </div>
                                        <div className="col-md-10">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h5 className="card-title mb-1" style={{ color: 'var(--primary-text)' }}>
                                                            {movie.title}
                                                        </h5>
                                                        <p className="card-text">
                                                            <small className="text-muted">
                                                                {movie.year} • {movie.genre} • {movie.duration || 'N/A'}
                                                            </small>
                                                        </p>
                                                        {movie.description && (
                                                            <p className="card-text" style={{
                                                                color: 'var(--secondary-text)',
                                                                overflow: 'hidden',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {movie.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-end">
                                                        {movie.rating && (
                                                            <div className="badge bg-dark">
                                                                <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                                                                {parseFloat(movie.rating).toFixed(1)}
                                                            </div>
                                                        )}
                                                        {movie.likeCount > 0 && (
                                                            <div className="mt-2">
                                                                <small className="text-muted">
                                                                    <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                                    {movie.likeCount}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                    <nav>
                        <ul className="pagination">
                            {/* Previous Button */}
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        backgroundColor: 'var(--secondary-bg)',
                                        color: 'var(--primary-text)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                            </li>

                            {/* Page Numbers */}
                            {(() => {
                                const pages = [];
                                const maxVisible = 5;
                                let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                let end = Math.min(totalPages, start + maxVisible - 1);

                                if (end - start + 1 < maxVisible) {
                                    start = Math.max(1, end - maxVisible + 1);
                                }

                                if (start > 1) {
                                    pages.push(
                                        <li key={1} className="page-item">
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(1)}
                                                style={{
                                                    backgroundColor: 'var(--secondary-bg)',
                                                    color: 'var(--primary-text)',
                                                    borderColor: 'var(--border-color)'
                                                }}
                                            >
                                                1
                                            </button>
                                        </li>
                                    );
                                    if (start > 2) {
                                        pages.push(
                                            <li key="dots1" className="page-item disabled">
                                                <span className="page-link" style={{
                                                    backgroundColor: 'var(--secondary-bg)',
                                                    color: 'var(--primary-text)',
                                                    borderColor: 'var(--border-color)'
                                                }}>...</span>
                                            </li>
                                        );
                                    }
                                }

                                for (let i = start; i <= end; i++) {
                                    pages.push(
                                        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(i)}
                                                style={currentPage === i ? {
                                                    backgroundColor: 'var(--accent-color)',
                                                    borderColor: 'var(--accent-color)'
                                                } : {
                                                    backgroundColor: 'var(--secondary-bg)',
                                                    color: 'var(--primary-text)',
                                                    borderColor: 'var(--border-color)'
                                                }}
                                            >
                                                {i}
                                            </button>
                                        </li>
                                    );
                                }

                                if (end < totalPages) {
                                    if (end < totalPages - 1) {
                                        pages.push(
                                            <li key="dots2" className="page-item disabled">
                                                <span className="page-link" style={{
                                                    backgroundColor: 'var(--secondary-bg)',
                                                    color: 'var(--primary-text)',
                                                    borderColor: 'var(--border-color)'
                                                }}>...</span>
                                            </li>
                                        );
                                    }
                                    pages.push(
                                        <li key={totalPages} className="page-item">
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(totalPages)}
                                                style={{
                                                    backgroundColor: 'var(--secondary-bg)',
                                                    color: 'var(--primary-text)',
                                                    borderColor: 'var(--border-color)'
                                                }}
                                            >
                                                {totalPages}
                                            </button>
                                        </li>
                                    );
                                }

                                return pages;
                            })()}

                            {/* Next Button */}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        backgroundColor: 'var(--secondary-bg)',
                                        color: 'var(--primary-text)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default MovieCategories;
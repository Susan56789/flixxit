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
    faList,
    faSearch,
    faClock,
    faFireAlt,
    faPlus,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

// Fallback image for movie posters
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect width="300" height="450" fill="%23333"%2F%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23666"%3ENo Poster%3C%2Ftext%3E%3C%2Fsvg%3E';

const MovieCategories = () => {
    const [searchParams] = useSearchParams();
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [sortBy, setSortBy] = useState('title');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [imageErrors, setImageErrors] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const moviesPerPage = viewMode === 'grid' ? 12 : 10;

    const { theme, isDark } = useTheme();

    // Initialize from URL params
    useEffect(() => {
        const filter = searchParams.get('filter');
        const search = searchParams.get('search');
        const genre = searchParams.get('genre');
        const year = searchParams.get('year');
        
        if (filter === 'new') {
            setSortBy('newest');
        } else if (filter === 'popular') {
            setSortBy('popularity');
        } else if (filter === 'recommended') {
            setSortBy('rating');
        }
        
        if (search) setSearchQuery(search);
        if (genre) setSelectedGenre(genre);
        if (year) setSelectedYear(year);
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

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setCurrentPage(1);
    };

    const handleDateFilterChange = (event) => {
        setDateFilter(event.target.value);
        setCurrentPage(1);
    };

    const handleRatingFilterChange = (event) => {
        setRatingFilter(event.target.value);
        setCurrentPage(1);
    };

    // Check if a movie is newly added (within last 30 days)
    const isNewlyAdded = useCallback((movie) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const movieDate = movie.createdAt 
            ? new Date(movie.createdAt) 
            : new Date(parseInt(movie._id.substring(0, 8), 16) * 1000);
            
        return movieDate > thirtyDaysAgo;
    }, []);

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

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(movie =>
                (movie.title && movie.title.toLowerCase().includes(query)) ||
                (movie.genre && movie.genre.toLowerCase().includes(query)) ||
                (movie.description && movie.description.toLowerCase().includes(query)) ||
                (movie.director && movie.director.toLowerCase().includes(query)) ||
                (movie.cast && movie.cast.some && movie.cast.some(actor => 
                    typeof actor === 'string' && actor.toLowerCase().includes(query)
                ))
            );
        }

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

        // Apply date filter for newly added movies
        if (dateFilter === 'newly-added') {
            filtered = filtered.filter(movie => isNewlyAdded(movie));
        } else if (dateFilter === 'this-week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filtered = filtered.filter(movie => {
                const movieDate = movie.createdAt 
                    ? new Date(movie.createdAt) 
                    : new Date(parseInt(movie._id.substring(0, 8), 16) * 1000);
                return movieDate > weekAgo;
            });
        } else if (dateFilter === 'this-month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filtered = filtered.filter(movie => {
                const movieDate = movie.createdAt 
                    ? new Date(movie.createdAt) 
                    : new Date(parseInt(movie._id.substring(0, 8), 16) * 1000);
                return movieDate > monthAgo;
            });
        }

        // Apply rating filter
        if (ratingFilter) {
            const [min, max] = ratingFilter.split('-').map(Number);
            filtered = filtered.filter(movie => {
                const rating = parseFloat(movie.rating) || 0;
                return rating >= min && (max ? rating <= max : true);
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'title':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'newest':
                filtered.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(parseInt(a._id.substring(0, 8), 16) * 1000);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(parseInt(b._id.substring(0, 8), 16) * 1000);
                    return dateB.getTime() - dateA.getTime();
                });
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
            case 'alphabetical':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'reverse-alphabetical':
                filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
                break;
            default:
                break;
        }

        return filtered;
    }, [searchQuery, selectedGenre, selectedYear, dateFilter, ratingFilter, sortBy, movies, isNewlyAdded]);

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
        setSearchQuery('');
        setDateFilter('');
        setRatingFilter('');
        setSortBy('title');
        setCurrentPage(1);
    };

    const hasActiveFilters = selectedGenre || selectedYear || searchQuery || dateFilter || ratingFilter || sortBy !== 'title';

    // Generate pagination buttons
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtonsToShow = 5;
        const halfRange = Math.floor(maxButtonsToShow / 2);
        
        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = Math.min(totalPages, currentPage + halfRange);
        
        // Adjust if we're near the beginning or end
        if (endPage - startPage + 1 < maxButtonsToShow) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
            } else {
                startPage = Math.max(1, endPage - maxButtonsToShow + 1);
            }
        }

        // Previous button
        buttons.push(
            <button
                key="prev"
                className="btn btn-outline-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>
        );

        // First page button
        if (startPage > 1) {
            buttons.push(
                <button
                    key={1}
                    className="btn btn-outline-secondary"
                    onClick={() => handlePageChange(1)}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(<span key="ellipsis1" className="px-2">...</span>);
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    className={`btn ${i === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        // Last page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="ellipsis2" className="px-2">...</span>);
            }
            buttons.push(
                <button
                    key={totalPages}
                    className="btn btn-outline-secondary"
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </button>
            );
        }

        // Next button
        buttons.push(
            <button
                key="next"
                className="btn btn-outline-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <FontAwesomeIcon icon={faChevronRight} />
            </button>
        );

        return buttons;
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
            {/* Header and Search */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                            <FontAwesomeIcon icon={faFilm} className="me-2" />
                            Movie Categories
                            {filteredAndSortedMovies.length !== movies.length && (
                                <span className="badge bg-primary ms-2">
                                    {filteredAndSortedMovies.length} filtered
                                </span>
                            )}
                        </h2>
                        <div className="d-flex gap-2">
                            <button
                                className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setShowFilters(!showFilters)}
                                title="Toggle filters"
                            >
                                <FontAwesomeIcon icon={faFilter} />
                                {hasActiveFilters && <span className="badge bg-danger ms-1">!</span>}
                            </button>
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

                    {/* Search Bar */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text" style={{
                                    backgroundColor: 'var(--secondary-bg)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--primary-text)'
                                }}>
                                    <FontAwesomeIcon icon={faSearch} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search movies by title, genre, director, or cast..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    style={{
                                        backgroundColor: 'var(--primary-bg)',
                                        color: 'var(--primary-text)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        title="Clear search"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    {showFilters && (
                        <div className="card mb-3" style={{
                            backgroundColor: 'var(--secondary-bg)',
                            borderColor: 'var(--border-color)'
                        }}>
                            <div className="card-body">
                                <div className="row g-3 align-items-end">
                                    {/* Genre Filter */}
                                    <div className="col-md-2">
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
                                    <div className="col-md-2">
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

                                    {/* Date Added Filter */}
                                    <div className="col-md-2">
                                        <label htmlFor="date-filter" className="form-label">
                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                            Added
                                        </label>
                                        <select
                                            id="date-filter"
                                            className="form-select"
                                            value={dateFilter}
                                            onChange={handleDateFilterChange}
                                            style={{
                                                backgroundColor: 'var(--primary-bg)',
                                                color: 'var(--primary-text)',
                                                borderColor: 'var(--border-color)'
                                            }}
                                        >
                                            <option value="">All Time</option>
                                            <option value="newly-added">
                                                Newly Added (30 days)
                                            </option>
                                            <option value="this-week">This Week</option>
                                            <option value="this-month">This Month</option>
                                        </select>
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="col-md-2">
                                        <label htmlFor="rating-filter" className="form-label">
                                            <FontAwesomeIcon icon={faStar} className="me-1" />
                                            Rating
                                        </label>
                                        <select
                                            id="rating-filter"
                                            className="form-select"
                                            value={ratingFilter}
                                            onChange={handleRatingFilterChange}
                                            style={{
                                                backgroundColor: 'var(--primary-bg)',
                                                color: 'var(--primary-text)',
                                                borderColor: 'var(--border-color)'
                                            }}
                                        >
                                            <option value="">All Ratings</option>
                                            <option value="8-10">8.0+ Excellent</option>
                                            <option value="7-8">7.0-7.9 Good</option>
                                            <option value="6-7">6.0-6.9 Average</option>
                                            <option value="0-6">Below 6.0</option>
                                        </select>
                                    </div>

                                    {/* Sort By */}
                                    <div className="col-md-2">
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
                                            <option value="reverse-alphabetical">Title (Z-A)</option>
                                            <option value="newest">Newest Added</option>
                                            <option value="rating">Highest Rated</option>
                                            <option value="popularity">Most Popular</option>
                                            <option value="year">Year (Newest)</option>
                                        </select>
                                    </div>

                                    {/* Clear Filters */}
                                    <div className="col-md-2">
                                        <button
                                            className="btn btn-outline-secondary w-100"
                                            onClick={clearFilters}
                                            disabled={!hasActiveFilters}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {hasActiveFilters && (
                                    <div className="mt-3">
                                        <small className="text-muted">Active filters:</small>
                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                            {searchQuery && (
                                                <span className="badge bg-primary">
                                                    Search: "{searchQuery}"
                                                    <button
                                                        className="btn-close btn-close-white ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => setSearchQuery('')}
                                                    />
                                                </span>
                                            )}
                                            {selectedGenre && (
                                                <span className="badge bg-info">
                                                    Genre: {selectedGenre}
                                                    <button
                                                        className="btn-close btn-close-white ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => setSelectedGenre('')}
                                                    />
                                                </span>
                                            )}
                                            {selectedYear && (
                                                <span className="badge bg-warning">
                                                    Year: {selectedYear}
                                                    <button
                                                        className="btn-close btn-close-white ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => setSelectedYear('')}
                                                    />
                                                </span>
                                            )}
                                            {dateFilter && (
                                                <span className="badge bg-success">
                                                    Added: {dateFilter === 'newly-added' ? 'Last 30 days' : 
                                                            dateFilter === 'this-week' ? 'This week' : 'This month'}
                                                    <button
                                                        className="btn-close btn-close-white ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => setDateFilter('')}
                                                    />
                                                </span>
                                            )}
                                            {ratingFilter && (
                                                <span className="badge bg-danger">
                                                    Rating: {ratingFilter.replace('-', ' - ')}
                                                    <button
                                                        className="btn-close btn-close-white ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => setRatingFilter('')}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Results Count */}
                                <div className="mt-3 text-muted">
                                    Showing {currentMovies.length} of {filteredAndSortedMovies.length} movies
                                    {hasActiveFilters && ` (${movies.length} total)`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Movies Display */}
            {currentMovies.length === 0 ? (
                <div className="text-center py-5">
                    <FontAwesomeIcon icon={faFilm} size="3x" className="text-muted mb-3" />
                    <h4 className="text-muted mb-2">No movies found</h4>
                    <p className="text-muted">
                        {hasActiveFilters 
                            ? "Try adjusting your filters to see more results" 
                            : "No movies available at the moment"
                        }
                    </p>
                    {hasActiveFilters && (
                        <button className="btn btn-primary" onClick={clearFilters}>
                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                            Clear All Filters
                        </button>
                    )}
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
                                <div className="card h-100 hover-scale-animation position-relative" style={{
                                    backgroundColor: 'var(--secondary-bg)',
                                    borderColor: 'var(--border-color)',
                                    overflow: 'hidden'
                                }}>
                                    {/* New Badge */}
                                    {isNewlyAdded(movie) && (
                                        <div className="position-absolute top-0 start-0 m-2 z-3">
                                            <span className="badge bg-success">
                                                <FontAwesomeIcon icon={faFireAlt} className="me-1" />
                                                NEW
                                            </span>
                                        </div>
                                    )}
                                    
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
                                        <small className="text-muted d-block">
                                            {movie.year && `${movie.year} • `}
                                            {movie.genre}
                                        </small>
                                        {movie.likeCount && (
                                            <small className="text-muted">
                                                <FontAwesomeIcon icon={faHeart} className="text-danger me-1" />
                                                {movie.likeCount} likes
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                // List View
                <div className="row">
                    <div className="col-12">
                        {currentMovies.map((movie) => (
                            <Link
                                key={movie._id}
                                to={`/movies/${movie._id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card mb-3 hover-scale-animation" style={{
                                    backgroundColor: 'var(--secondary-bg)',
                                    borderColor: 'var(--border-color)'
                                }}>
                                    <div className="row g-0">
                                        <div className="col-md-2">
                                            <div className="position-relative">
                                                <img
                                                    src={getImageUrl(movie)}
                                                    className="img-fluid rounded-start"
                                                    alt={movie.title}
                                                    style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                                                    onError={() => handleImageError(movie._id)}
                                                />
                                                {isNewlyAdded(movie) && (
                                                    <div className="position-absolute top-0 start-0 m-1">
                                                        <span className="badge bg-success">
                                                            <FontAwesomeIcon icon={faFireAlt} className="me-1" />
                                                            NEW
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-10">
                                            <div className="card-body h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h5 className="card-title mb-0" style={{ color: 'var(--primary-text)' }}>
                                                            {movie.title}
                                                        </h5>
                                                        {movie.rating && (
                                                            <div className="badge bg-dark">
                                                                <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                                                                {parseFloat(movie.rating).toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                                        {movie.year && (
                                                            <span className="badge bg-secondary">
                                                                <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                                                {movie.year}
                                                            </span>
                                                        )}
                                                        {movie.genre && (
                                                            <span className="badge bg-info">
                                                                {movie.genre}
                                                            </span>
                                                        )}
                                                        {movie.likeCount && (
                                                            <span className="badge bg-danger">
                                                                <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                                {movie.likeCount} likes
                                                            </span>
                                                        )}
                                                    </div>
                                                    {movie.description && (
                                                        <p className="card-text text-muted mb-2" style={{
                                                            overflow: 'hidden',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}>
                                                            {movie.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    {movie.director && (
                                                        <small className="text-muted">
                                                            Director: {movie.director}
                                                        </small>
                                                    )}
                                                    {movie.cast && movie.cast.length > 0 && (
                                                        <small className="text-muted">
                                                            Cast: {Array.isArray(movie.cast) 
                                                                ? movie.cast.slice(0, 3).join(', ') 
                                                                : movie.cast}
                                                            {Array.isArray(movie.cast) && movie.cast.length > 3 && '...'}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="row mt-5">
                    <div className="col-12">
                        <nav aria-label="Movie pagination">
                            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                                {renderPaginationButtons()}
                            </div>
                        </nav>
                        <div className="text-center mt-3 text-muted">
                            <small>
                                Page {currentPage} of {totalPages} • 
                                Showing {(currentPage - 1) * moviesPerPage + 1} to {Math.min(currentPage * moviesPerPage, filteredAndSortedMovies.length)} of {filteredAndSortedMovies.length} movies
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="row mt-5 mb-4">
                <div className="col-12">
                    <div className="card" style={{
                        backgroundColor: 'var(--secondary-bg)',
                        borderColor: 'var(--border-color)'
                    }}>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-md-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faFilm} size="2x" className="text-primary mb-2" />
                                        <h4 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                                            {movies.length}
                                        </h4>
                                        <small className="text-muted">Total Movies</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faFilter} size="2x" className="text-success mb-2" />
                                        <h4 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                                            {genres.length}
                                        </h4>
                                        <small className="text-muted">Genres</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faFireAlt} size="2x" className="text-warning mb-2" />
                                        <h4 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                                            {movies.filter(movie => isNewlyAdded(movie)).length}
                                        </h4>
                                        <small className="text-muted">New This Month</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faStar} size="2x" className="text-info mb-2" />
                                        <h4 className="mb-0" style={{ color: 'var(--primary-text)' }}>
                                            {movies.filter(movie => parseFloat(movie.rating) >= 8).length}
                                        </h4>
                                        <small className="text-muted">Highly Rated (8.0+)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
                <button
                    className="btn btn-primary rounded-circle"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    title="Back to top"
                >
                    <FontAwesomeIcon icon={faChevronLeft} style={{ transform: 'rotate(90deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default MovieCategories;
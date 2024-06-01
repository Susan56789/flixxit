import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ThemeContext } from "../themeContext";

const MovieCategories = () => {
    const [selectedGenre, setSelectedGenre] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const moviesPerPage = 12;

    const { theme } = useContext(ThemeContext);

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

    const handleGenreChange = (event) => {
        setSelectedGenre(event.target.value);
        setCurrentPage(1); // Reset to the first page when genre changes
    };

    const genres = useMemo(() => {
        const uniqueGenres = new Set();
        movies.forEach(movie => {
            if (movie.genre) {
                uniqueGenres.add(movie.genre);
            }
        });
        return Array.from(uniqueGenres);
    }, [movies]);

    const filteredMovies = useMemo(() => {
        if (!selectedGenre) return movies;
        return movies.filter(movie => movie.genre === selectedGenre);
    }, [selectedGenre, movies]);

    const currentMovies = useMemo(() => {
        const startIndex = (currentPage - 1) * moviesPerPage;
        return filteredMovies.slice(startIndex, startIndex + moviesPerPage);
    }, [currentPage, filteredMovies]);

    const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Movie Categories</h2>
                <div>
                    <label htmlFor="genre-select" className="form-label me-2">
                        Select Genre:
                    </label>
                    <select
                        id="genre-select"
                        className={`form-select d-inline-block ${theme === 'dark' ? 'bg-dark text-light' : ''}`}
                        value={selectedGenre}
                        onChange={handleGenreChange}
                    >
                        <option value="">All</option>
                        {genres.map((genre) => (
                            <option key={genre} value={genre}>
                                {genre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {loading ? (
                <p>Loading movies...</p>
            ) : error ? (
                <p className="text-danger">{error}</p>
            ) : currentMovies.length === 0 ? (
                <p>No movies in this category</p>
            ) : (
                <div>
                    <div className="row row-cols-1 row-cols-md-4 g-4">
                        {currentMovies.map((movie) => (
                            <div key={movie._id} className="col">
                                <Link
                                    to={`/movies/${movie._id}`}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="card h-100">
                                        <img
                                            src={movie.imageUrl}
                                            className="card-img-top"
                                            alt={movie.title}
                                        />
                                        <div className="card-body">
                                            <h5 className="card-title">{movie.title}</h5>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex justify-content-center mt-4">
                        <nav>
                            <ul className="pagination">
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <li
                                        key={index + 1}
                                        className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                                    >
                                        <button
                                            className={`page-link ${theme === 'dark' ? 'bg-dark text-light' : ''}`}
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieCategories;

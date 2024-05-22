import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MovieCategories = () => {
    const [selectedGenre, setSelectedGenre] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        className="form-select d-inline-block"
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
            ) : filteredMovies.length === 0 ? (
                <p>No movies in this category</p>
            ) : (
                <div className="row row-cols-1 row-cols-md-4 g-4">
                    {filteredMovies.map((movie) => (
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
            )}
        </div>
    );
};

export default MovieCategories;

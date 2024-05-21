import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MovieCategories = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [genresResponse, moviesResponse] = await Promise.all([
                    axios.get('https://flixxit-h9fa.onrender.com/api/genres'),
                    axios.get(selectedGenre === 'All' ? 'https://flixxit-h9fa.onrender.com/api/movies' : `https://flixxit-h9fa.onrender.com/api/movies?genre=${selectedGenre}`),
                ]);
                setGenres(['All', ...genresResponse.data]);
                setMovies(moviesResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedGenre]);

    const handleGenreChange = (event) => {
        setSelectedGenre(event.target.value);
    };

    const genreOptions = useMemo(() => genres.map((genre) => (
        <option key={genre} value={genre}>
            {genre}
        </option>
    )), [genres]);

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
                        {genreOptions}
                    </select>
                </div>
            </div>
            {loading ? (
                <p>Loading movies...</p>
            ) : error ? (
                <p className="text-danger">{error}</p>
            ) : (
                <div className="row row-cols-1 row-cols-md-3 g-4">
                    {movies.map((movie) => (
                        <div key={movie._id} className="col">
                            <Link to={`/movies/${movie._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card h-100">
                                    <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
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

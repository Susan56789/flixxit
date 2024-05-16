import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MovieCategories = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [genresResponse, moviesResponse] = await Promise.all([
                    axios.get('/api/genres'),
                    axios.get(selectedGenre === 'All' ? '/api/movies' : `/api/movies?genre=${selectedGenre}`),
                ]);
                setGenres(['All', ...genresResponse.data]);
                setMovies(moviesResponse.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData(); // Initial fetch
    }, [selectedGenre]); // Refetch when selectedGenre changes

    const handleGenreChange = async (event) => {
        const genre = event.target.value;
        setSelectedGenre(genre);
        try {
            const moviesResponse = await axios.get(genre === 'All' ? '/api/movies' : `/api/movies?genre=${genre}`);
            setMovies(moviesResponse.data);
        } catch (error) {
            console.error(error);
        }
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
                        className="form-select d-inline-block"
                        value={selectedGenre}
                        onChange={handleGenreChange}
                    >
                        {genres.map((genre) => (
                            <option key={genre} value={genre}>
                                {genre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
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
        </div>
    );
};

export default MovieCategories;

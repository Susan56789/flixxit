import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MovieCategories = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('Action');
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get('/api/genres');
                setGenres(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchGenres();
    }, []);

    useEffect(() => {
        const fetchMoviesByGenre = async () => {
            try {
                const response = await axios.get(`/api/movies?genre=${selectedGenre}`);
                setMovies(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchMoviesByGenre();
    }, [selectedGenre]);

    const handleGenreChange = (genre) => {
        setSelectedGenre(genre);
    };

    return (
        <div className="container mt-4">
            <h2>Movie Categories</h2>
            <ul className="nav nav-tabs">
                {genres.map((genre) => (
                    <li className="nav-item" key={genre}>
                        <button
                            className={`nav-link ${selectedGenre === genre ? 'active' : ''}`}
                            onClick={() => handleGenreChange(genre)}
                        >
                            {genre}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="row mt-4">
                <div className="col-md-12">
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {movies.map((movie) => (
                            <div key={movie._id} className="col">
                                <Link to={`/movies/${movie._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card h-100">
                                        <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
                                        <div className="card-body">
                                            <h5 className="card-title">{movie.title}</h5>
                                            {/* <p className="card-text">{movie.description}</p> */}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieCategories;

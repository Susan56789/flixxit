
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MovieDetailPage = ({ match }) => {
    const [movie, setMovie] = useState(null);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const response = await axios.get(`/api/movies/${match.params.id}`);
                setMovie(response.data);
            } catch (error) {
                console.error('Error fetching movie:', error);
            }
        };

        fetchMovie();
    }, [match.params.id]);

    return (
        <div className="container mt-3">
            {movie ? (
                <div>
                    <h2>{movie.title}</h2>
                    <p><strong>Description:</strong> {movie.description}</p>
                    <p><strong>Genre:</strong> {movie.genre}</p>
                    <p><strong>Rating:</strong> {movie.rating}</p>
                    <p><strong>Year:</strong> {movie.year}</p>
                    {/* You can add more details here */}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default MovieDetailPage;

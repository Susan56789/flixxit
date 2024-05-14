import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Import useParams hook

const MovieDetailPage = () => {
    const [movie, setMovie] = useState(null);
    const [error, setError] = useState(null);

    // Use useParams hook to get the movie ID from the URL
    const { id } = useParams();

    useEffect(() => {
        const fetchMovieDetail = async () => {
            try {
                const response = await axios.get(`/api/movies/${id}`);
                setMovie(response.data);
            } catch (error) {
                setError(error);
            }
        };

        fetchMovieDetail();
    }, [id]); // Make sure to include id in the dependency array

    if (error) {
        return <div>Error fetching movie details: {error.message}</div>;
    }

    if (!movie) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{movie.title}</h2>
            <p>Description: {movie.description}</p>
            <p>Genre: {movie.genre}</p>
            <p>Rating: {movie.rating}</p>
            <p>Year: {movie.year}</p>
            <img src={movie.imageUrl} alt={movie.title} />
        </div>
    );
};

export default MovieDetailPage;

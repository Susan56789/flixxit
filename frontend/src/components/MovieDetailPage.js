import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const MovieDetailPage = () => {
    const [movie, setMovie] = useState(null);
    const [error, setError] = useState(null);
    const [recommendedMovies, setRecommendedMovies] = useState([]);

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

        const fetchRecommendedMovies = async () => {
            try {
                const response = await axios.get(`/api/movies?genre=${movie?.genre}&limit=4`);
                setRecommendedMovies(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        if (movie) {
            fetchRecommendedMovies();
        }

        fetchMovieDetail();
    }, [id, movie]);

    if (error) {
        return <div>Error fetching movie details: {error.message}</div>;
    }

    if (!movie) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-4">
                    <img src={movie.imageUrl} alt={movie.title} className="img-fluid mb-3" />
                </div>
                <div className="col-md-8">
                    <h2>{movie.title}</h2>
                    <p>{movie.description}</p>
                    <p>Genre: {movie.genre}</p>
                    <p>Rating: {movie.rating}</p>
                    <p>Year: {movie.year}</p>
                    <div className="btn-group" role="group">
                        <Link to="#" className="btn btn-primary">Watch</Link>
                        <button type="button" className="btn btn-outline-primary">Like</button>
                        <button type="button" className="btn btn-outline-primary">Dislike</button>
                    </div>
                </div>
            </div>
            <hr />
            <h3>Recommended Videos</h3>
            <div className="row">
                {recommendedMovies.map((recommendedMovie) => (
                    <div key={recommendedMovie._id} className="col-md-3 mb-4">
                        <Link to={`/movies/${recommendedMovie._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card">
                                <img src={recommendedMovie.imageUrl} alt={recommendedMovie.title} className="card-img-top" />
                                <div className="card-body">
                                    <h5 className="card-title">{recommendedMovie.title}</h5>
                                    {/* <p className="card-text">{recommendedMovie.description}</p> */}
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MovieDetailPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaPlay, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const MovieDetailPage = ({ user, handleLike, handleDislike }) => {
    const [movie, setMovie] = useState(null);
    const [error, setError] = useState(null);
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [likeStatus, setLikeStatus] = useState(null); // 1 for like, -1 for dislike
    const [showTrailer, setShowTrailer] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        const fetchMovieDetail = async () => {
            try {
                const response = await axios.get(`/api/movies/${id}`);
                setMovie(response.data);
                setLikeStatus(user ? response.data.likesBy.includes(user._id) ? 1 : response.data.dislikesBy.includes(user._id) ? -1 : null : null);
                fetchRecommendedMovies(response.data.genre);
                checkSubscription(user ? user._id : null, response.data._id);
            } catch (error) {
                setError(error);
            }
        };

        const fetchRecommendedMovies = async (genre) => {
            try {
                const response = await axios.get(`/api/movies?genre=${genre}&limit=4`);
                setRecommendedMovies(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        const checkSubscription = async (userId, movieId) => {
            try {
                if (userId) {
                    const response = await axios.get(`/api/subscriptions/${userId}/${movieId}`);
                    setIsSubscribed(response.data.isSubscribed);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchMovieDetail();
    }, [id, user]);

    const handleWatchClick = async () => {
        if (isSubscribed || !user) {
            setShowTrailer(true);
            setTimeout(() => {
                setShowTrailer(false);
                if (!isSubscribed && user) {
                    setShowSubscribePrompt(true);
                }
            }, 5000);
        } else {
            setShowSubscribePrompt(true);
        }
    };

    const handleSubscribeCancel = () => {
        setShowSubscribePrompt(false);
    };

    const handleSubscribe = async () => {
        if (!user) {
            alert("Please log in to subscribe.");
            return;
        }
        try {
            const response = await axios.post('/api/subscribe', { userId: user._id, movieId: movie._id });
            console.log(response.data);
            setIsSubscribed(true);
            setShowSubscribePrompt(false);
        } catch (err) {
            console.error(err);
        }
    };


    const handleLikeClick = async () => {
        if (!user) {
            alert("Please log in to like the movie.");
            return;
        }
        try {
            await handleLike(movie._id);
            setLikeStatus(1);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDislikeClick = async () => {
        if (!user) {
            alert("Please log in to dislike the movie.");
            return;
        }
        try {
            await handleDislike(movie._id);
            setLikeStatus(-1);
        } catch (err) {
            console.error(err);
        }
    };

    if (error) {
        return <div>Error fetching movie details: {error.message}</div>;
    }

    if (!movie) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-4">
            {showSubscribePrompt && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Subscribe to Watch</h5>
                                <button type="button" className="close" onClick={handleSubscribeCancel}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Please subscribe to our platform to watch the full movie.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleSubscribeCancel}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleSubscribe}>
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showTrailer && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{movie.title} Trailer</h5>
                                <button type="button" className="close" onClick={() => setShowTrailer(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <iframe width="100%" height="315" title={movie.title}
                                    src={`https://www.youtube.com/embed/${movie.videoUrl.split('v=')[1]}`}
                                    frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; 
                                gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                        <button type="button" className="btn btn-primary" onClick={handleWatchClick}>
                            <FaPlay className="mr-2" />
                            Watch
                        </button>
                        <button
                            type="button"
                            className={`btn ${likeStatus === 1 ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={handleLikeClick}
                        >
                            <FaThumbsUp className="mr-2" />
                            Like ({movie.likes})
                        </button>
                        <button
                            type="button"
                            className={`btn ${likeStatus === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleDislikeClick}
                        >
                            <FaThumbsDown className="mr-2" />
                            Dislike ({movie.dislikes})
                        </button>
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUser, getUserToken } from '../utils/helpers';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const token = getUserToken();
                const user = getUser();
                const userId = user ? user._id : null;

                if (!token || !userId) {
                    setError('Please log in to view your watchlist.');
                    setLoading(false);
                    return;
                }

                // Fetch the watchlist data from the API
                const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/watchlist/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setWatchlist(response.data);

                // Fetch the movie details based on the movieId values in the watchlist
                const movieIds = response.data.map(item => item.movieId);
                const moviesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies`, {
                    params: {
                        ids: movieIds.join(',')
                    }
                });

                setMovies(moviesResponse.data);
            } catch (error) {
                setError('Error fetching watchlist. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, []); // Empty dependency array ensures useEffect runs only on component mount

    const removeFromWatchlist = async (movieId) => {
        try {
            const token = getUserToken();
            if (!token) {
                setError('Please log in to remove movies from your watchlist.');
                return;
            }

            await axios.delete(`https://flixxit-h9fa.onrender.com/api/watchlist/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setWatchlist(prevWatchlist => prevWatchlist.filter(item => item.movieId !== movieId));
            setMovies(prevMovies => prevMovies.filter(movie => movie._id !== movieId));
        } catch (error) {
            setError('Error removing from watchlist. Please try again later.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    if (movies.length === 0) {
        return <p>No movies found in your watchlist</p>;
    }

    return (
        <div className="container">
            <h2 className="mt-4 mb-4">My Watchlist</h2>
            <div className="row">
                {movies.map((movie) => (
                    <div key={movie._id} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
                        <div className="card h-100">
                            <div className="card-header">
                                <h6 className="mb-0 fs-sm">{movie.title}</h6>
                                <span className="text-muted fs-sm">{movie.year}</span>
                            </div>
                            <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
                            <div className="card-footer">
                                <button className="btn btn-subtle" onClick={() => removeFromWatchlist(movie._id)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Watchlist;

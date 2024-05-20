import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const token = localStorage.getItem('flixxItToken'); // Correct token key
                if (!token) {
                    setError('Please log in to view your watchlist.');
                    return;
                }

                const response = await axios.get('https://flixxit-h9fa.onrender.com/api/watchlist', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setWatchlist(response.data);
            } catch (error) {
                setError('Error fetching watchlist. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, []);

    const removeFromWatchlist = async (movieId) => {
        try {
            const token = localStorage.getItem('flixxItToken'); // Correct token key
            if (!token) {
                setError('Please log in to remove movies from your watchlist.');
                return;
            }

            await axios.delete(`https://flixxit-h9fa.onrender.com/api/watchlist/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setWatchlist(prevWatchlist => prevWatchlist.filter(item => item._id !== movieId));
        } catch (error) {
            setError('Error removing from watchlist. Please try again later.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="container">
            <h2 className="mt-4 mb-4">My Watchlist</h2>
            <div className="row">
                {watchlist.length > 0 ? (
                    watchlist.map((movie, index) => (
                        <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
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
                    ))
                ) : (
                    <p>No movies found in your watchlist</p>
                )}
            </div>
        </div>
    );
};

export default Watchlist;

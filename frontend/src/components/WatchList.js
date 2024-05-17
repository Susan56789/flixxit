import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('Please log in to view your watchlist.');
                    return;
                }

                const response = await axios.get('/api/watchlist', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setWatchlist(response.data);
            } catch (error) {
                console.error('Error fetching watchlist:', error);
            }
        };

        fetchWatchlist();
    }, []);

    const removeFromWatchlist = async (movieId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Please log in to remove movies from your watchlist.');
                return;
            }

            const response = await axios.delete(`/api/watchlist/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log(response.data.message);
            setWatchlist(watchlist.filter(item => item._id !== movieId));
        } catch (error) {
            console.error('Error removing from watchlist:', error);
        }
    };

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
                                <div className="card-body">
                                    {/* <p className="card-text">{movie.description.substring(0, 50)}...</p> */}
                                </div>
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
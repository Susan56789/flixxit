import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Watchlist = () => {
    // State variables to manage watchlist data, loading state, and error handling
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook to fetch watchlist data when the component mounts
    useEffect(() => {
        // Function to fetch watchlist data from the backend API
        const fetchWatchlist = async () => {
            try {
                // Retrieve JWT token from localStorage
                const token = localStorage.getItem('flixxItToken');
                if (!token) {
                    // If token doesn't exist, set error message
                    setError('Please log in to view your watchlist.');
                    return;
                }

                // Send GET request to backend API to fetch watchlist data
                const response = await axios.get('https://flixxit-h9fa.onrender.com/api/watchlist', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Set watchlist state with data from the response
                setWatchlist(response.data);
            } catch (error) {
                // If an error occurs during the fetch, set error message
                setError('Error fetching watchlist. Please try again later.');
            } finally {
                // Set loading state to false after fetch completes
                setLoading(false);
            }
        };

        // Call the fetchWatchlist function when the component mounts
        fetchWatchlist();
    }, []); // Empty dependency array ensures useEffect runs only on component mount

    // Function to handle removal of a movie from the watchlist
    const removeFromWatchlist = async (movieId) => {
        try {
            // Retrieve JWT token from localStorage
            const token = localStorage.getItem('flixxItToken');
            if (!token) {
                // If token doesn't exist, set error message
                setError('Please log in to remove movies from your watchlist.');
                return;
            }

            // Send DELETE request to backend API to remove movie from watchlist
            await axios.delete(`https://flixxit-h9fa.onrender.com/api/watchlist/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update watchlist state by filtering out the removed movie
            setWatchlist(prevWatchlist => prevWatchlist.filter(item => item._id !== movieId));
        } catch (error) {
            // If an error occurs during removal, set error message
            setError('Error removing from watchlist. Please try again later.');
        }
    };

    // If data is still loading, display a loading message
    if (loading) return <div>Loading...</div>;
    // If an error occurred during fetch, display the error message
    if (error) return <div>{error}</div>;

    // If watchlist is empty, display a message indicating no movies found
    if (watchlist.length === 0) {
        return <p>No movies found in your watchlist</p>;
    }

    // If watchlist contains movies, render them as cards with remove button
    return (
        <div className="container">
            <h2 className="mt-4 mb-4">My Watchlist</h2>
            <div className="row">
                {watchlist.map((movie, index) => (
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
                ))}
            </div>
        </div>
    );
};

export default Watchlist;

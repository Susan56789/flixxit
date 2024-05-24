import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './MovieList';
import { Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [newArrivals, setNewArrivals] = useState([]);
    const [mostPopular, setMostPopular] = useState([]);
    const [recommended, setRecommended] = useState([]);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
                const movies = response.data;

                // Sort movies based on different criteria
                const newArrivals = [...movies].sort((a, b) => {
                    const yearA = a.year || 0;
                    const yearB = b.year || 0;
                    return yearB - yearA;
                });

                const mostPopular = [...movies].sort((a, b) => {
                    const likesCountA = a.likesCount || 0;
                    const likesCountB = b.likesCount || 0;
                    return likesCountB - likesCountA;
                });

                const recommended = [...movies].sort((a, b) => {
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    return ratingB - ratingA;
                });
                setNewArrivals(newArrivals);
                setMostPopular(mostPopular);
                setRecommended(recommended);
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        fetchMovies();
    }, []);

    return (
        <div>
            <div className="container mt-3">
                <section>
                    <Carousel
                        interval={5000}
                        pause={false}
                        indicators={false}
                        prevIcon={<span className="carousel-control-prev-icon" />}
                        nextIcon={<span className="carousel-control-next-icon" />}
                    >
                        {newArrivals.map((movie) => (
                            <Carousel.Item key={movie._id}>
                                <Link to={`/movies/${movie._id}`}>
                                    <img
                                        className="d-block w-100"
                                        src={movie.imageUrl}
                                        alt={movie.title}
                                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                                    />
                                </Link>
                                <Carousel.Caption>
                                    <h3>{movie.title}</h3>
                                </Carousel.Caption>
                            </Carousel.Item>
                        ))}
                    </Carousel>
                    <br />
                    <h2>New Arrivals</h2>
                    <hr />
                    <MovieList movies={newArrivals} type="newArrivals" />
                </section>
                <section>
                    <h2>Most Popular</h2>
                    <hr />
                    <MovieList movies={mostPopular} type="mostPopular" />
                </section>
                <section>
                    <h2>Recommended</h2>
                    <hr />
                    <MovieList movies={recommended} type="recommended" />
                </section>
            </div>
        </div>
    );
};

export default HomePage;

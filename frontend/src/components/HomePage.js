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
        // Fetch new arrivals (movies added in the last 30 days)
        axios.get('https://flixxit-h9fa.onrender.com/api/movies?sort=newest&limit=4')
            .then(res => {
                setNewArrivals(res.data);
            })
            .catch(err => {
                console.log(err);
            });

        // Fetch most popular movies (based on number of likes)
        axios.get('https://flixxit-h9fa.onrender.com/api/movies?sort=likes&limit=4')
            .then(res => {
                setMostPopular(res.data);
            })
            .catch(err => {
                console.log(err);
            });

        // Fetch recommended movies (based on collaborative filtering or user preferences)
        axios.get('https://flixxit-h9fa.onrender.com/api/movies?sort=recommended&limit=4')
            .then(res => {
                setRecommended(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    }, []);

    return (
        <div>
            <div className="container mt-3">
                <section>
                    <Carousel interval={5000} pause={false}
                        indicators={false}
                        prevIcon={<span className="carousel-control-prev-icon" />}
                        nextIcon={<span className="carousel-control-next-icon" />}
                    >
                        {newArrivals.map(movie => (
                            <Carousel.Item key={movie._id}>
                                <Link to={`/movies/${movie._id}`}>
                                    <img className="d-block w-100" src={movie.imageUrl}
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
                </section>


                <section>
                    <h2>New Arrivals</h2>
                    <MovieList movies={newArrivals} type="newArrivals" />
                </section>

                <section>
                    <h2>Most Popular</h2>
                    <MovieList movies={mostPopular} type="mostPopular" />
                </section>

                <section>
                    <h2>Recommended</h2>
                    <MovieList movies={recommended} type="recommended" />
                </section>
            </div>
        </div>
    );
}

export default HomePage;

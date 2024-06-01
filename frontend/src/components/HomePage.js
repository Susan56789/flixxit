import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './MovieList';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const [newArrivals, setNewArrivals] = useState([]);
    const [mostPopular, setMostPopular] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
                const movies = response.data;

                const newArrivals = [...movies].sort((a, b) => b._id.localeCompare(a._id));
                const mostPopular = [...movies].sort((a, b) => (parseInt(b.likeCount, 10) || 0) - (parseInt(a.likeCount, 10) || 0));
                const recommended = [...movies].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));

                setNewArrivals(newArrivals);
                setMostPopular(mostPopular);
                setRecommended(recommended);
                setMovies(movies);
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        fetchMovies();
    }, []);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? movies.length - 1 : prevIndex - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex === movies.length - 1 ? 0 : prevIndex + 1));
    };

    return (
        <div className="home-page">
            <div className="container mt-3">
                <div className="carousel">
                    <div className="slides-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {movies.map((movie) => (
                            <div className="slide" key={movie._id} style={{ backgroundImage: `url(${movie.imageUrl})` }}>
                                <div className="overlay">
                                    <div className="play-button">
                                        <span className="detail-span">{movie.title}</span>
                                        <br /><br />
                                        <Link to={`/movies/${movie._id}`} className="btn">
                                            <span className="play-icon">▶</span> Watch Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="prev-button" onClick={handlePrev}>❮</button>
                    <button className="next-button" onClick={handleNext}>❯</button>
                </div>
                <br />
                <h2>New Arrivals</h2>
                <hr />
                <MovieList movies={newArrivals} type="newArrivals" />
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

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getUserToken } from "../utils/helpers";

const MovieList = ({ movies, type }) => {
  const [alertMessage, setAlertMessage] = useState('');

  // Hide alert message after 3 seconds
  useEffect(() => {
    let timeout;
    if (alertMessage) {
      timeout = setTimeout(() => {
        setAlertMessage('');
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  const backgroundColor = () => {
    switch (type) {
      case "newArrivals":
        return "#f0f0f0";
      case "mostPopular":
        return "#f5f5f5";
      case "recommended":
        return "#fafafa";
      default:
        return "#fff";
    }
  };

  const addToWatchlist = async (movieId) => {
    try {
      const token = getUserToken();
      if (!token) {
        console.log("Please log in to add movies to your watchlist.");
        return;
      }

      const response = await axios.post(
        'https://flixxit-h9fa.onrender.com/api/watchlist',
        { movieId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      setAlertMessage(response.data.message);


    } catch (error) {
      console.error("Error adding to watchlist:", error.response ? error.response.data : error.message);
      setAlertMessage('Movie Already in Watchlist')
    }
  };

  const shareMovie = (title, id) => {
    if (navigator.share) {
      navigator.share({
        title: `Check out this movie: ${title}`,
        text: `I found this interesting movie titled "${title}". You can check it out here:`,
        url: `https://flixxit-h9fa.onrender.com/movies/${id}`,
      })
        .then(() => console.log('Successfully shared'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  // Ensure movies is an array before sorting
  const sortedMovies = Array.isArray(movies) ? movies.sort((a, b) => b._id - a._id) : [];

  return (
    <div>
      {alertMessage && (
        <div
          className="alert alert-warning alert-dismissible fade show position-fixed top-0 start-0 m-3"
          role="alert"
        >
          {alertMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlertMessage('')}
          />
        </div>
      )}
      <div
        className="row"
        style={{
          backgroundColor: backgroundColor(),
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        {sortedMovies.length > 0 ? (
          sortedMovies.slice(0, 4).map((movie, index) => ( // Display only the latest four movies
            <div key={index} className="col-lg-3 col-md-4 col-sm-6 col-12 mb-4"> {/* Adjusted column classes for better responsiveness */}
              <Link
                to={`/movies/${movie._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center">
                    <div className="ms-3">
                      <h6 className="mb-0 fs-sm">{movie.title}</h6>
                      <span className="text-muted fs-sm">{movie.year}</span>
                    </div>
                  </div>
                  <img
                    src={movie.imageUrl}
                    className="card-img-top"
                    alt={movie.title}
                  />
                </div>
              </Link>
              <div className="card-footer d-flex justify-content-between"> {/* Improved button alignment */}
                <button
                  className="btn btn-subtle me-2"
                  onClick={() => addToWatchlist(movie._id)}
                >
                  <i className="fas fa-heart fa-lg"></i>
                </button>
                <button
                  className="btn btn-subtle"
                  onClick={() => shareMovie(movie.title, movie._id)}
                >
                  <i className="fas fa-share fa-lg"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No movies found</p>
        )}
      </div>
    </div>
  );
};

export default MovieList;

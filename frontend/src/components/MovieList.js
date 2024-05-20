import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getUserToken } from "../utils/helpers";

const MovieList = ({ movies, type }) => {
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
        alert("Please log in to add movies to your watchlist.");
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

      if (response.status === 201) {
        alert(response.data.message); // Success message
      } else if (response.status === 409) {
        alert("This movie is already in your watchlist."); // Duplicate entry alert
      } else {
        alert("Failed to add movie to watchlist. Please try again later."); // Generic failure alert
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error.response ? error.response.data : error.message);
      alert("Failed to add movie to watchlist. Please try again later."); // Alert for other errors
    }
  };


  const shareMovie = (title, id) => {
    // Implementation for sharing movie omitted for brevity
  };

  // Sort movies by release date in descending order
  const sortedMovies = movies.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

  return (
    <div
      className="row"
      style={{
        backgroundColor: backgroundColor(),
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "20px",
      }}
    >
      {Array.isArray(sortedMovies) && sortedMovies.length > 0 ? (
        sortedMovies.slice(0, 4).map((movie, index) => ( // Display only the latest four movies
          <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
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
            <div className="card-footer d-flex">
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
  );
};

export default MovieList;

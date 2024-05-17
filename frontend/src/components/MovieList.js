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

      console.log(response.data.message);
    } catch (error) {
      console.error("Error adding to watchlist:", error.response ? error.response.data : error.message);
    }
  };


  const shareMovie = (title, id) => {
    const movieUrl = `${window.location.origin}/movies/${id}`;
    const shareText = `Check out this movie: ${title}`;

    // Facebook
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      movieUrl
    )}`;

    // Twitter
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      movieUrl
    )}&text=${encodeURIComponent(shareText)}`;

    // Instagram
    const instagramShareUrl = `https://www.instagram.com/?url=${encodeURIComponent(
      movieUrl
    )}`;

    // Open share options in a popup
    const popupOptions = "toolbar=0,status=0,width=626,height=436";
    window.open(facebookShareUrl, "Share on Facebook", popupOptions);
    window.open(twitterShareUrl, "Share on Twitter", popupOptions);
    window.open(instagramShareUrl, "Share on Instagram", popupOptions);
  };

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
      {Array.isArray(movies) && movies.length > 0 ? (
        movies.map((movie, index) => (
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
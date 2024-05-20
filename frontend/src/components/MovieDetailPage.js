import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AuthContext } from "../AuthContext";

const MovieDetailPage = ({ handleLike, handleDislike }) => {
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [likeStatus, setLikeStatus] = useState(null); // 1 for like, -1 for dislike
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { id } = useParams();
  const playerRef = useRef(null);
  const playerId = `player-${id}`; // Generate a unique ID for the player

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);
        setLikeStatus(
          user
            ? movieData.likesBy?.includes(user._id)
              ? 1
              : movieData.dislikesBy?.includes(user._id)
                ? -1
                : null
            : null
        );
        fetchRecommendedMovies(movieData.genre);
      } catch (error) {
        setError(error);
      }
    };

    const fetchRecommendedMovies = async (genre) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies?genre=${genre}&limit=4`);
        setRecommendedMovies(response.data.slice(0, 4)); // Ensure only 4 movies
      } catch (error) {
        console.error(error);
      }
    };

    fetchMovieDetail();
  }, [id, user]);

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          initializePlayer();
        };
      } else {
        initializePlayer();
      }
    };

    if (movie && movie.videoUrl) {
      loadYouTubeAPI();
    }
  }, [movie]);

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const initializePlayer = () => {
    if (window.YT && window.YT.Player) {
      const videoId = movie ? extractVideoId(movie.videoUrl) : null;
      if (videoId) {
        const player = new window.YT.Player(playerId, {
          height: "200",
          width: "100%",
          videoId: videoId,
          events: {
            onReady: onPlayerReady,
          },
        });
        playerRef.current = player;
      }
    }
  };

  const onPlayerReady = (event) => {
    setIsPlayerReady(true); // Set player as ready
    if (showPlayer) {
      event.target.playVideo();
    }
  };

  const handleWatchClick = () => {
    if (isPlayerReady && playerRef.current && typeof playerRef.current.playVideo === 'function') {
      setShowPlayer(true);
      playerRef.current.playVideo();
    } else {
      setShowPlayer(true); // Show player modal even if not ready, will show loading message
    }
  };

  const handleLikeClick = async () => {
    if (!user) {
      alert("Please log in to like the movie.");
      return;
    }
    try {
      const updatedMovie = await handleLike(movie._id, user._id);
      if (updatedMovie) {
        setMovie(updatedMovie);
        setLikeStatus(1);
      }
    } catch (err) {
      console.error(err);
      // Handle error, display error message, etc.
    }
  };

  const handleDislikeClick = async () => {
    if (!user) {
      alert("Please log in to dislike the movie.");
      return;
    }
    try {
      const updatedMovie = await handleDislike(movie._id, user._id);
      if (updatedMovie) {
        setMovie(updatedMovie);
        setLikeStatus(-1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (error) {
    return <div>Error fetching movie details: {error.message}</div>;
  }

  if (!movie) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
      {showPlayer && (
        <div className="modal d-flex justify-content-center align-items-center" style={{ display: "block" }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-body">
                {!isPlayerReady ? (
                  <p>Loading video...</p>
                ) : (
                  <div id={playerId} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-4">
          <img
            src={movie.imageUrl}
            alt={movie.title}
            className="img-fluid mb-3"
          />
        </div>
        <div className="col-md-8">
          <h2>{movie.title}</h2>
          <p>{movie.description}</p>
          <p>Genre: {movie.genre}</p>
          <p>Rating: {movie.rating}</p>
          <p>Year: {movie.year}</p>
          <div className="btn-group" role="group">
            {movie.videoUrl && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleWatchClick}
                disabled={!isPlayerReady && !showPlayer} // Disable button until player is ready
              >
                <FaPlay className="mr-2" />
                Watch
              </button>
            )}
            <button
              type="button"
              className={`btn ${likeStatus === 1 ? "btn-danger" : "btn-outline-danger"
                }`}
              onClick={handleLikeClick}
            >
              <FaThumbsUp className="mr-2" />
              Like ({movie.likes || 0})
            </button>
            <button
              type="button"
              className={`btn ${likeStatus === -1 ? "btn-primary" : "btn-outline-primary"
                }`}
              onClick={handleDislikeClick}
            >
              <FaThumbsDown className="mr-2" />
              Dislike ({movie.dislikes || 0})
            </button>
          </div>
        </div>
      </div>
      <hr />
      <h3>Recommended Videos</h3>
      <div className="row">
        {recommendedMovies.map((recommendedMovie) => (
          <div key={recommendedMovie._id} className="col-md-3 mb-4">
            <Link
              to={`/movies/${recommendedMovie._id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="card">
                <img
                  src={recommendedMovie.imageUrl}
                  alt={recommendedMovie.title}
                  className="card-img-top"
                />
                <div className="card-body">
                  <small className="card-title">{recommendedMovie.title}</small>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieDetailPage;

import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AuthContext } from "../AuthContext";

const MovieDetailPage = ({ handleLike, handleDislike }) => {
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [genre, setGenre] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [likeStatus, setLikeStatus] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const playerRef = useRef(null);
  const playerId = `player-${id}`;
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);
        setGenre(movieData.genre);

        const likesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/likes`);
        const likesCount = likesResponse.data.likes;

        const dislikesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/dislikes`);
        const dislikesCount = dislikesResponse.data.dislikes;

        movieData.likes = likesCount;
        movieData.dislikes = dislikesCount;

        setLikeStatus(
          user
            ? movieData.likesBy?.includes(user._id)
              ? 1
              : movieData.dislikesBy?.includes(user._id)
                ? -1
                : null
            : null
        );

        fetchRecommendedMovies(movieData.genre, movieData._id);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedMovies = async (genre, currentMovieId) => {
      try {
        const response = await axios.get(
          `https://flixxit-h9fa.onrender.com/api/movies?genre=${encodeURIComponent(genre)}&limit=4${currentMovieId ? `&exclude=${currentMovieId}` : ''
          }`
        );
        setRecommendedMovies(response.data);
      } catch (error) {
        console.error("Error fetching recommended movies:", error);
        setRecommendedMovies([]);
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
          height: "390",
          width: "640",
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
    setPlayerReady(true);
    if (showPlayer) {
      event.target.playVideo();
    }
  };

  const handleWatchClick = () => {
    setShowPlayer(true);
    if (playerReady && playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  useEffect(() => {
    let timeout;
    if (alertMessage) {
      timeout = setTimeout(() => {
        setAlertMessage('');
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  const handleLikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to like the movie.');
      return;
    }
    if (likeStatus === -1) {
      setAlertMessage('You have already disliked this movie.');
      return;
    }
    try {
      const updatedMovie = await handleLike(movie._id, user._id);
      setMovie(prevMovie => ({
        ...prevMovie,
        ...updatedMovie,
        likesBy: updatedMovie.likesBy,
      }));
      setLikeStatus(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to dislike the movie.');
      return;
    }
    if (likeStatus === 1) {
      setAlertMessage('You have already liked this movie.');
      return;
    }
    try {
      const updatedDislikesBy = await handleDislike(movie._id, user._id);
      setMovie(prevMovie => ({
        ...prevMovie,
        dislikesBy: updatedDislikesBy,
      }));
      setLikeStatus(-1);
    } catch (err) {
      console.error(err);
    }
  };

  if (error) {
    return <div>Error fetching movie details: {error}</div>;
  }

  if (loading || !movie) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
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
      {showPlayer && (
        <div className="modal d-flex justify-content-center align-items-center" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-body">
                {playerReady ? (
                  <div id={playerId} />
                ) : (
                  <p>Loading video...</p>
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
              >
                <FaPlay className="mr-2" />
                Watch
              </button>
            )}
            <button
              type="button"
              className={`btn ${likeStatus === 1 ? "btn-danger" : "btn-outline-danger"}`}
              onClick={handleLikeClick}
            >
              <FaThumbsUp className="mr-2" />
              Like ({movie.likes || 0})
            </button>
            <button
              type="button"
              className={`btn ${likeStatus === -1 ? "btn-primary" : "btn-outline-primary"}`}
              onClick={handleDislikeClick}
            >
              <FaThumbsDown className="mr-2" />
              Dislike ({movie.dislikes || 0})
            </button>
          </div>
        </div>
      </div>
      <hr />
      <h3>Recommended Movies</h3>
      {recommendedMovies.length > 0 ? (
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
      ) : (
        <p>No recommended movies found.</p>
      )}
    </div>
  );
};

export default MovieDetailPage;

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AuthContext } from "../AuthContext";
import ReactPlayer from 'react-player';

const MovieDetailPage = ({ handleLike, handleDislike }) => {
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [likeStatus, setLikeStatus] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [alertMessage, setAlertMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  // Fetch movie details and recommended movies
  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);

        // Fetch likes and dislikes
        const likesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/likes`);
        const likesCount = likesResponse.data.likes;
        const dislikesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/dislikes`);
        const dislikesCount = dislikesResponse.data.dislikes;

        movieData.likes = likesCount;
        movieData.dislikes = dislikesCount;

        // Set like status based on user
        setLikeStatus(
          user
            ? movieData.likesBy?.includes(user._id)
              ? 1
              : movieData.dislikesBy?.includes(user._id)
                ? -1
                : null
            : null
        );

        fetchRecommendedMovies(movieData);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedMovies = async (movie) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies`);
        const allMovies = response.data;
        const currentMovieID = movie._id;
        const sortedMovies = allMovies.sort((a, b) => b._id - a._id);
        const filteredMovies = sortedMovies.filter((m) => m._id !== currentMovieID);
        setRecommendedMovies(filteredMovies.slice(0, 4));
      } catch (error) {
        console.error('Error fetching recommended movies:', error);
      }
    };

    fetchMovieDetail();
  }, [id, user]);

  const handleWatchClick = () => {
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

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

  // Handle like button click
  const handleLikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to like the movie.');
      return;
    }
    if (likeStatus === -1) {
      setAlertMessage('You have already disliked this movie.');
      return;
    }
    if (likeStatus === 1) {
      setAlertMessage('You have already liked this movie.');
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
      setAlertMessage('You have liked this movie.');
    } catch (err) {
      console.error(err);
      setAlertMessage('Error liking the movie.');
    }
  };

  // Handle dislike button click
  const handleDislikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to dislike the movie.');
      return;
    }
    if (likeStatus === 1) {
      setAlertMessage('You have already liked this movie.');
      return;
    }
    if (likeStatus === -1) {
      setAlertMessage('You have already disliked this movie.');
      return;
    }
    try {
      const updatedDislikesBy = await handleDislike(movie._id, user._id);
      setMovie(prevMovie => ({
        ...prevMovie,
        dislikesBy: updatedDislikesBy,
      }));
      setLikeStatus(-1);
      setAlertMessage('You have disliked this movie.');
    } catch (err) {
      console.error(err);
      setAlertMessage('Error disliking the movie.');
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!user) {
      setAlertMessage('Please log in to post a comment.');
      return;
    }

    if (!commentText.trim()) {
      setAlertMessage('Comment cannot be empty.');
      return;
    }

    const commentPayload = { text: commentText };
    console.log('Submitting comment:', commentPayload);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://flixxit-h9fa.onrender.com/api/movies/${movie._id}/comments`,
        commentPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prevComments => [...prevComments, response.data]);
      setCommentText('');
      setAlertMessage('Comment posted successfully.');
    } catch (err) {
      console.error('Error posting comment:', err);
      setAlertMessage('Error posting comment.');
    }
  };

  // Handle loading and error states
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
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Movie Player</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleClosePlayer}></button>
              </div>
              <div className="modal-body">
                <div className="ratio ratio-16x9">
                  <ReactPlayer
                    url={movie.videoUrl}
                    controls
                    playing
                    width="100%"
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <h2 className="display-4 mb-3">{movie.title}</h2>
      <div className="row mb-3">
        <div className="col-md-6">
          <img src={movie.imageUrl} className="img-fluid" alt={movie.title} />
        </div>
        <div className="col-md-6">
          <p><strong>Year:</strong> {movie.year}</p>
          <p><strong>Genre:</strong> {movie.genre}</p>
          <p><strong>Rating:</strong> {movie.rating}</p>
          <p>{movie.description}</p>
          <button className="btn btn-primary me-2" onClick={handleWatchClick}>
            <FaPlay className="me-1" /> Trailer
          </button>
          <button className="btn btn-success me-2" onClick={handleLikeClick}>
            <FaThumbsUp className="me-1" /> Like {movie.likes ? `(${movie.likes})` : ''}
          </button>
          <button className="btn btn-danger" onClick={handleDislikeClick}>
            <FaThumbsDown className="me-1" /> Dislike {movie.dislikes ? `(${movie.dislikes})` : ''}
          </button>
        </div>
      </div>
      <div>
        <hr />
        <h3>Comments</h3>
        {comments.length > 0 ? (
          <ul className="list-group">
            {comments.map((comment, index) => (
              <li key={index} className="list-group-item">
                <strong>{comment.userName}</strong>: {comment.text} <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}
        <div className="mb-3 mt-3">
          <textarea
            className="form-control"
            rows="3"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
          ></textarea>
        </div>
        <button className="btn btn-primary" onClick={handleCommentSubmit}>
          Post Comment
        </button>
      </div>
      <div>
        <hr />
        <h3>Recommended Movies</h3>
        <div className="row">
          {recommendedMovies.map((recommendedMovie) => (
            <div key={recommendedMovie._id} className="col-md-3 mb-3">
              <div className="card">
                <img
                  src={recommendedMovie.imageUrl}
                  className="card-img-top"
                  alt={recommendedMovie.title}
                />
                <div className="card-body">
                  <h5 className="card-title">{recommendedMovie.title}</h5>
                  <p className="card-text">
                    <strong>Year:</strong> {recommendedMovie.year}
                    <br />
                    <strong>Genre:</strong> {recommendedMovie.genre}
                  </p>
                  <Link
                    to={`/movies/${recommendedMovie._id}`}
                    className="btn btn-primary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;

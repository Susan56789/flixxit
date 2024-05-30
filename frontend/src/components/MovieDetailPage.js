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
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState(null);


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
        fetchComments(movieData._id);
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

    const fetchComments = async (movieId) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${movieId}/comments`);
        if (response.data.length > 0) {
          setComments(response.data);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };


    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://flixxit-h9fa.onrender.com/api/users");
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();

    fetchMovieDetail();
  }, [id, user]);

  useEffect(() => {

    const findUserByUserId = async () => {

      if (comments && comments.length > 0 && comments[0].userId) {
        const userId = comments[0].userId;

        if (users && Array.isArray(users)) {

          for (const user of users) {
            if (user._id === userId) {
              setUsername(user.username);
              return;
            }
          }
        } else {

          console.error('users is not an iterable object');
        }
      } else {
        console.log('No comments or userId available yet');
      }


      return null;
    };
    findUserByUserId();
  }, [users, comments]);



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

    // Check if the user has already commented
    const hasCommented = comments.some(comment => comment.userId === user._id);
    if (hasCommented) {
      setAlertMessage('You have already posted a comment for this movie.');
      return;
    }

    // Limit the comment text to 300 words
    const maxLength = 300;
    const trimmedCommentText = commentText.trim().split(' ').slice(0, maxLength).join(' ');

    const commentPayload = { text: trimmedCommentText };
    const token = localStorage.getItem('token');

    try {
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
                <button type="button" className="btn btn-secondary" onClick={handleClosePlayer}>
                  Back to Details
                </button>
              </div>
              <div className="modal-body">
                <ReactPlayer url={movie.videoUrl} playing controls width="100%" />
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
                Trailer
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

        <hr />
        <div className="mt-4">

          <h3>Comments</h3>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div className="mb-2" key={comment._id}>
                <strong>
                  {username}:
                </strong>{" "}
                {comment.text}
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
          <div className="mt-3">
            <textarea
              className="form-control mb-2"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            ></textarea>
            <button className="btn btn-primary" onClick={handleCommentSubmit}>
              Post Comment
            </button>
          </div>
        </div>
        <hr />
        <h3>Recommended Movies</h3>
        <div className="row">
          {recommendedMovies.map(recommendedMovie => (
            <div className="col-md-3" key={recommendedMovie._id}>
              <Link to={`/movies/${recommendedMovie._id}`}>
                <img src={recommendedMovie.imageUrl} className="img-fluid" alt={recommendedMovie.title} />
                <p className="mt-2">{recommendedMovie.title}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MovieDetailPage;

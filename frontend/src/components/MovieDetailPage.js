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

  // Fetch movie details, recommended movies, comments, and users
  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);

        // Fetch likes and dislikes with proper error handling
        try {
          const likesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/likes`);
          const likesCount = likesResponse.data.data ? likesResponse.data.data.likes : likesResponse.data.likes || 0;
          
          const dislikesResponse = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${id}/dislikes`);
          const dislikesCount = dislikesResponse.data.data ? dislikesResponse.data.data.dislikes : dislikesResponse.data.dislikes || 0;

          movieData.likes = likesCount;
          movieData.dislikes = dislikesCount;
        } catch (likeDislikeError) {
          console.warn('Error fetching likes/dislikes:', likeDislikeError);
          movieData.likes = 0;
          movieData.dislikes = 0;
        }

        // Set like status based on user - check both API and local arrays
        if (user) {
          try {
            // Check like status from API
            const likeStatusResponse = await axios.get(
              `https://flixxit-h9fa.onrender.com/api/movies/${id}/like/status`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const hasLiked = likeStatusResponse.data.data?.hasLiked;

            // Check dislike status from API
            const dislikeStatusResponse = await axios.get(
              `https://flixxit-h9fa.onrender.com/api/movies/${id}/dislike/status`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const hasDisliked = dislikeStatusResponse.data.data?.hasDisliked;

            setLikeStatus(hasLiked ? 1 : hasDisliked ? -1 : null);
          } catch (statusError) {
            console.warn('Error checking like/dislike status:', statusError);
            // Fallback to checking arrays if they exist
            setLikeStatus(
              movieData.likesBy?.includes(user._id)
                ? 1
                : movieData.dislikesBy?.includes(user._id)
                ? -1
                : null
            );
          }
        }

        fetchRecommendedMovies(movieData);
        fetchComments(movieData._id);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedMovies = async (currentMovie) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies`);
        const allMovies = response.data;

        const recommendedMovies = allMovies
          .filter(movie => movie.genre === currentMovie.genre && movie._id !== currentMovie._id)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);

        setRecommendedMovies(recommendedMovies);
      } catch (error) {
        console.error('Error fetching recommended movies:', error);
      }
    };

    const fetchComments = async (movieId) => {
      try {
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/${movieId}/comments`);
        // Handle both response formats
        const commentsData = response.data.comments || response.data || [];
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
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

  // Map usernames to comments - fixed to avoid infinite loop
  useEffect(() => {
    if (comments.length > 0 && users.length > 0) {
      // Only update if comments don't already have usernames
      const needsUsernames = comments.some(comment => !comment.username && !comment.userName);
      
      if (needsUsernames) {
        const updatedComments = comments.map(comment => {
          if (comment.username || comment.userName) {
            return comment; // Already has username
          }
          
          const user = users.find(user => user._id === comment.userId);
          return {
            ...comment,
            username: user ? (user.username || user.name) : 'Unknown'
          };
        });
        setComments(updatedComments);
      }
    }
  }, [users]); // Only depend on users, not comments

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

  // Improved like handler
  const handleLikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to like the movie.');
      return;
    }
    
    if (likeStatus === 1) {
      setAlertMessage('You have already liked this movie.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage('Please log in to like the movie.');
        return;
      }

      // If using the parent handleLike function
      if (handleLike) {
        const updatedMovie = await handleLike(movie._id, user._id);
        setMovie(prevMovie => ({
          ...prevMovie,
          ...updatedMovie,
          likes: (updatedMovie.likes || prevMovie.likes || 0) + (likeStatus === -1 ? 2 : 1),
          dislikes: likeStatus === -1 ? Math.max(0, (prevMovie.dislikes || 0) - 1) : (prevMovie.dislikes || 0)
        }));
      } else {
        // Direct API call
        const response = await axios.post(
          `https://flixxit-h9fa.onrender.com/api/movies/${movie._id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setMovie(prevMovie => ({
            ...prevMovie,
            likes: response.data.data.likes,
            dislikes: response.data.data.dislikes
          }));
        }
      }
      
      setLikeStatus(1);
      setAlertMessage('You have liked this movie.');
    } catch (err) {
      console.error('Error liking movie:', err);
      if (err.response?.status === 409) {
        setAlertMessage('You have already liked this movie.');
      } else if (err.response?.status === 401) {
        setAlertMessage('Please log in to like the movie.');
      } else {
        setAlertMessage('Error liking the movie. Please try again.');
      }
    }
  };

  // Improved dislike handler
  const handleDislikeClick = async () => {
    if (!user) {
      setAlertMessage('Please log in to dislike the movie.');
      return;
    }
    
    if (likeStatus === -1) {
      setAlertMessage('You have already disliked this movie.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage('Please log in to dislike the movie.');
        return;
      }

      // If using the parent handleDislike function
      if (handleDislike) {
        const updatedDislikesBy = await handleDislike(movie._id, user._id);
        setMovie(prevMovie => ({
          ...prevMovie,
          dislikesBy: updatedDislikesBy,
          dislikes: (prevMovie.dislikes || 0) + (likeStatus === 1 ? 2 : 1),
          likes: likeStatus === 1 ? Math.max(0, (prevMovie.likes || 0) - 1) : (prevMovie.likes || 0)
        }));
      } else {
        // Direct API call
        const response = await axios.post(
          `https://flixxit-h9fa.onrender.com/api/movies/${movie._id}/dislike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setMovie(prevMovie => ({
            ...prevMovie,
            likes: response.data.data.likes,
            dislikes: response.data.data.dislikes
          }));
        }
      }
      
      setLikeStatus(-1);
      setAlertMessage('You have disliked this movie.');
    } catch (err) {
      console.error('Error disliking movie:', err);
      if (err.response?.status === 409) {
        setAlertMessage('You have already disliked this movie.');
      } else if (err.response?.status === 401) {
        setAlertMessage('Please log in to dislike the movie.');
      } else {
        setAlertMessage('Error disliking the movie. Please try again.');
      }
    }
  };

  // Improved comment submission
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
    const hasCommented = comments.some(comment => 
      comment.userId === user._id || comment.userId.toString() === user._id.toString()
    );
    
    if (hasCommented) {
      setAlertMessage('You have already posted a comment for this movie.');
      return;
    }

    // Limit the comment text to 300 words
    const words = commentText.trim().split(/\s+/);
    const maxWords = 300;
    const trimmedCommentText = words.slice(0, maxWords).join(' ');

    const commentPayload = { text: trimmedCommentText };
    const token = localStorage.getItem('token');

    if (!token) {
      setAlertMessage('Please log in to post a comment.');
      return;
    }

    try {
      const response = await axios.post(
        `https://flixxit-h9fa.onrender.com/api/movies/${movie._id}/comments`,
        commentPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new comment to the list
      const newComment = {
        ...response.data,
        username: response.data.userName || user.username || user.name || 'Anonymous'
      };
      
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentText('');
      setAlertMessage('Comment posted successfully.');
    } catch (err) {
      console.error('Error posting comment:', err);
      if (err.response?.status === 401) {
        setAlertMessage('Please log in to post a comment.');
      } else if (err.response?.status === 400) {
        setAlertMessage(err.response.data.message || 'Invalid comment data.');
      } else {
        setAlertMessage('Error posting comment. Please try again.');
      }
    }
  };

  // Handle loading and error states
  if (error) {
    return <div className="container mt-4">
      <div className="alert alert-danger">Error fetching movie details: {error}</div>
    </div>;
  }

  if (loading || !movie) {
    return <div className="container mt-4">
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading movie details...</p>
      </div>
    </div>;
  }

  return (
    <div className="container mt-4">
      {alertMessage && (
        <div
          className="alert alert-warning alert-dismissible fade show position-fixed top-0 start-0 m-3"
          role="alert"
          style={{ zIndex: 1050 }}
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
        <div className="modal d-flex justify-content-center align-items-center" style={{ display: "block", zIndex: 1055 }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{movie.title} - Trailer</h5>
                <button type="button" className="btn btn-secondary" onClick={handleClosePlayer}>
                  Close
                </button>
              </div>
              <div className="modal-body">
                <ReactPlayer url={movie.videoUrl} playing controls width="100%" height="400px" />
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
            style={{ maxHeight: '600px', objectFit: 'cover' }}
          />
        </div>
        <div className="col-md-8">
          <h2>{movie.title}</h2>
          <p className="lead">{movie.description}</p>
          <div className="row mb-3">
            <div className="col-sm-6">
              <p><strong>Genre:</strong> {movie.genre}</p>
              <p><strong>Rating:</strong> {movie.rating}</p>
            </div>
            <div className="col-sm-6">
              <p><strong>Year:</strong> {movie.year}</p>
            </div>
          </div>
          
          <div className="btn-group" role="group">
            {movie.videoUrl && (
              <button
                type="button"
                className="btn btn-danger me-2"
                onClick={handleWatchClick}
              >
                <FaPlay className="me-2" />
                Watch Trailer
              </button>
            )}
            <button
              type="button"
              className={`btn me-2 ${likeStatus === 1 ? "btn-success" : "btn-outline-success"}`}
              onClick={handleLikeClick}
              disabled={loading}
            >
              <FaThumbsUp className="me-2" />
              Like ({movie.likes || 0})
            </button>
            <button
              type="button"
              className={`btn ${likeStatus === -1 ? "btn-danger" : "btn-outline-danger"}`}
              onClick={handleDislikeClick}
              disabled={loading}
            >
              <FaThumbsDown className="me-2" />
              Dislike ({movie.dislikes || 0})
            </button>
          </div>
        </div>
      </div>

      <hr />

      <div className="mt-4">
        <h3>Comments ({comments.length})</h3>
        
        {/* Comment form */}
        <div className="mb-4">
          <div className="form-group mb-3">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Write a comment... (maximum 300 words)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength="2000"
            />
            <div className="form-text">
              {commentText.trim().split(/\s+/).filter(word => word.length > 0).length} / 300 words
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || loading}
          >
            Post Comment
          </button>
        </div>

        {/* Comments display */}
        {comments.length > 0 ? (
          <div className="comments-section">
            {comments.map((comment, index) => (
              <div className="card mb-3" key={comment._id || comment.id || index}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title mb-1">
                        {comment.username || comment.userName || 'Anonymous'}
                      </h6>
                      <p className="card-text">{comment.text}</p>
                    </div>
                    {comment.createdAt && (
                      <small className="text-muted">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            <p className="mb-0">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      <hr />

      <h3>Recommended Movies</h3>
      {recommendedMovies.length > 0 ? (
        <div className="row">
          {recommendedMovies.map(recommendedMovie => (
            <div className="col-md-3 col-sm-6 mb-4" key={recommendedMovie._id}>
              <div className="card h-100">
                <Link to={`/movies/${recommendedMovie._id}`} className="text-decoration-none">
                  <img 
                    src={recommendedMovie.imageUrl} 
                    className="card-img-top" 
                    alt={recommendedMovie.title}
                    style={{ height: '300px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h6 className="card-title text-dark">{recommendedMovie.title}</h6>
                    <p className="card-text text-muted">
                      <small>Rating: {recommendedMovie.rating} | {recommendedMovie.year}</small>
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          <p className="mb-0">No recommended movies available.</p>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
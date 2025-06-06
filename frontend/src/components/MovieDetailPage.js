import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AuthContext } from "../AuthContext";
import { getUserToken } from "../utils/helpers";
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
            const token = getUserToken();
            if (token) {
              // Check like status from API
              const likeStatusResponse = await axios.get(
                `https://flixxit-h9fa.onrender.com/api/movies/${id}/like/status`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const hasLiked = likeStatusResponse.data.data?.hasLiked;

              // Check dislike status from API
              const dislikeStatusResponse = await axios.get(
                `https://flixxit-h9fa.onrender.com/api/movies/${id}/dislike/status`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const hasDisliked = dislikeStatusResponse.data.data?.hasDisliked;

              setLikeStatus(hasLiked ? 1 : hasDisliked ? -1 : null);
            }
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

  // Map usernames to comments
  useEffect(() => {
    if (comments.length > 0 && users.length > 0) {
      const needsUsernames = comments.some(comment => !comment.username && !comment.userName);
      
      if (needsUsernames) {
        const updatedComments = comments.map(comment => {
          if (comment.username || comment.userName) {
            return comment;
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
  }, [users]);

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

  // Fixed like handler
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
      const token = getUserToken();
      if (!token) {
        setAlertMessage('Please log in to like the movie.');
        return;
      }

      if (handleLike) {
        const updatedMovie = await handleLike(movie._id, user._id);
        setMovie(prevMovie => ({
          ...prevMovie,
          ...updatedMovie,
          likes: (updatedMovie.likes || prevMovie.likes || 0) + (likeStatus === -1 ? 2 : 1),
          dislikes: likeStatus === -1 ? Math.max(0, (prevMovie.dislikes || 0) - 1) : (prevMovie.dislikes || 0)
        }));
      } else {
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

  // Fixed dislike handler
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
      const token = getUserToken();
      if (!token) {
        setAlertMessage('Please log in to dislike the movie.');
        return;
      }

      if (handleDislike) {
        const updatedDislikesBy = await handleDislike(movie._id, user._id);
        setMovie(prevMovie => ({
          ...prevMovie,
          dislikesBy: updatedDislikesBy,
          dislikes: (prevMovie.dislikes || 0) + (likeStatus === 1 ? 2 : 1),
          likes: likeStatus === 1 ? Math.max(0, (prevMovie.likes || 0) - 1) : (prevMovie.likes || 0)
        }));
      } else {
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

  // Fixed comment submission
  const handleCommentSubmit = async () => {
    if (!user) {
      setAlertMessage('Please log in to post a comment.');
      return;
    }

    if (!commentText.trim()) {
      setAlertMessage('Comment cannot be empty.');
      return;
    }

    const hasCommented = comments.some(comment => 
      comment.userId === user._id || comment.userId.toString() === user._id.toString()
    );
    
    if (hasCommented) {
      setAlertMessage('You have already posted a comment for this movie.');
      return;
    }

    const words = commentText.trim().split(/\s+/);
    const maxWords = 300;
    const trimmedCommentText = words.slice(0, maxWords).join(' ');

    const commentPayload = { text: trimmedCommentText };
    const token = getUserToken();

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
    return (
      <div className="container movie-detail-container">
        <div className="error-container">
          <div className="error-message">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (loading || !movie) {
    return (
      <div className="container movie-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading movie details...</div>
        </div>
      </div>
    );
  }

  const wordCount = commentText.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="container movie-detail-container py-4">
      {alertMessage && (
        <div className="alert alert-warning alert-custom alert-dismissible fade show mb-4" role="alert">
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
        <div className="modal d-flex justify-content-center align-items-center video-modal position-fixed top-0 start-0 w-100 h-100" 
             style={{ display: "block", zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{movie.title} - Trailer</h5>
                <button type="button" className="btn-close" onClick={handleClosePlayer}></button>
              </div>
              <div className="modal-body p-0">
                <ReactPlayer url={movie.videoUrl} playing controls width="100%" height="500px" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Movie Details Section */}
      <div className="row g-4 mb-5">
        <div className="col-lg-5 col-md-6">
          <div className="movie-poster-container position-sticky" style={{ top: '20px' }}>
            <img
              src={movie.imageUrl || movie.image}
              alt={movie.title}
              className="img-fluid movie-poster w-100"
              style={{
                minHeight: '600px',
                maxHeight: '800px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              onError={(e) => {
                if (e.target.src !== movie.image && movie.image) {
                  e.target.src = movie.image;
                } else if (e.target.src !== '/placeholder-movie.jpg') {
                  e.target.src = '/placeholder-movie.jpg';
                } else {
                  e.target.src = 'https://via.placeholder.com/400x600/333/fff?text=No+Image';
                }
              }}
            />
          </div>
        </div>
        
        <div className="col-lg-7 col-md-6">
          <div className="movie-info">
            <h1 className="movie-title display-4 fw-bold mb-3" style={{ color: '#fff', lineHeight: '1.2' }}>
              {movie.title}
            </h1>
            
            <div className="movie-rating-badge mb-3">
              <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                <i className="fas fa-star me-1"></i>
                {movie.rating}/10
              </span>
            </div>
            
            <p className="movie-description fs-5 mb-4" style={{ color: '#d1d5db', lineHeight: '1.6' }}>
              {movie.description}
            </p>
            
            <div className="movie-meta mb-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="meta-item p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <strong className="text-warning">Genre:</strong>
                    <div className="text-light fs-6">{movie.genre}</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="meta-item p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <strong className="text-warning">Duration:</strong>
                    <div className="text-light fs-6">{movie.duration} minutes</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="meta-item p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <strong className="text-warning">Release Year:</strong>
                    <div className="text-light fs-6">{movie.releaseYear}</div>
                  </div>
                </div>
                {movie.director && (
                  <div className="col-sm-6">
                    <div className="meta-item p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <strong className="text-warning">Director:</strong>
                      <div className="text-light fs-6">{movie.director}</div>
                    </div>
                  </div>
                )}
                {movie.cast && (
                  <div className="col-12">
                    <div className="meta-item p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <strong className="text-warning">Cast:</strong>
                      <div className="text-light fs-6">{movie.cast}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="movie-actions">
              <button 
                className="btn btn-primary btn-lg px-4 py-3 me-3 mb-3" 
                onClick={handleWatchClick}
                disabled={!movie.videoUrl}
                style={{
                  background: movie.videoUrl ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' : '#6c757d',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaPlay className="me-2" />
                {movie.videoUrl ? 'Watch Trailer' : 'No Trailer Available'}
              </button>
              
              <div className="like-dislike-container d-flex gap-3 mt-3">
                <button
                  className={`btn btn-outline-success btn-lg px-4 py-2 ${likeStatus === 1 ? 'active' : ''}`}
                  onClick={handleLikeClick}
                  disabled={!user}
                  style={{
                    borderRadius: '12px',
                    fontWeight: '600',
                    backgroundColor: likeStatus === 1 ? '#28a745' : 'transparent',
                    borderColor: '#28a745',
                    color: likeStatus === 1 ? '#fff' : '#28a745'
                  }}
                >
                  <FaThumbsUp className="me-2" />
                  Like ({movie.likes || 0})
                </button>
                
                <button
                  className={`btn btn-outline-danger btn-lg px-4 py-2 ${likeStatus === -1 ? 'active' : ''}`}
                  onClick={handleDislikeClick}
                  disabled={!user}
                  style={{
                    borderRadius: '12px',
                    fontWeight: '600',
                    backgroundColor: likeStatus === -1 ? '#dc3545' : 'transparent',
                    borderColor: '#dc3545',
                    color: likeStatus === -1 ? '#fff' : '#dc3545'
                  }}
                >
                  <FaThumbsDown className="me-2" />
                  Dislike ({movie.dislikes || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section mb-5">
        <div className="row">
          <div className="col-12">
            <h3 className="comments-title h2 mb-4 text-light">
              <i className="fas fa-comments me-3"></i>
              Comments
            </h3>
            
            {user && (
              <div className="comment-form mb-4 p-4 rounded" 
                   style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="form-group mb-3">
                  <textarea
                    className="form-control comment-textarea"
                    rows="4"
                    placeholder="Share your thoughts about this movie..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={2000}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      padding: '15px'
                    }}
                  />
                  <div className="comment-word-count mt-2 text-muted">
                    {wordCount}/300 words (characters: {commentText.length}/2000)
                  </div>
                </div>
                <button
                  className="btn btn-primary px-4 py-2"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || wordCount > 300}
                  style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  Post Comment
                </button>
              </div>
            )}

            {!user && (
              <div className="alert alert-info mb-4" style={{ borderRadius: '12px' }}>
                <Link to="/login" className="text-decoration-none fw-bold">Log in</Link> to post a comment.
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="card comment-card mb-3" 
                       style={{ 
                         backgroundColor: 'rgba(255,255,255,0.05)', 
                         border: '1px solid rgba(255,255,255,0.1)',
                         borderRadius: '12px'
                       }}>
                    <div className="card-body p-4">
                      <div className="comment-header d-flex justify-content-between align-items-center mb-3">
                        <div className="comment-username fw-bold text-warning fs-6">
                          <i className="fas fa-user-circle me-2"></i>
                          {comment.username || comment.userName || 'Anonymous'}
                        </div>
                        <small className="comment-date text-muted">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown date'}
                        </small>
                      </div>
                      <div className="comment-text">
                        <p className="mb-0 text-light fs-6" style={{ lineHeight: '1.6' }}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-comments text-center py-5" style={{ color: '#6c757d' }}>
                  <i className="fas fa-comments fa-4x mb-4 opacity-50"></i>
                  <h5>No comments yet</h5>
                  <p>Be the first to share your thoughts about this movie!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Movies Section */}
      {recommendedMovies.length > 0 && (
        <div className="recommended-section">
          <div className="row">
            <div className="col-12">
              <h3 className="recommended-title h2 mb-4 text-light">
                <i className="fas fa-film me-3"></i>
                Recommended Movies
              </h3>
              <div className="row g-4">
                {recommendedMovies.map((recMovie) => (
                  <div key={recMovie._id} className="col-6 col-md-4 col-lg-3">
                    <div className="recommended-movie-card h-100 position-relative overflow-hidden"
                         style={{
                           backgroundColor: 'rgba(255,255,255,0.05)',
                           border: '1px solid rgba(255,255,255,0.1)',
                           borderRadius: '16px',
                           transition: 'all 0.3s ease'
                         }}>
                      <Link
                        to={`/movies/${recMovie._id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div className="position-relative">
                          <img
                            src={recMovie.imageUrl || recMovie.image}
                            alt={recMovie.title}
                            className="recommended-movie-img w-100"
                            loading="lazy"
                            style={{
                              height: '300px',
                              objectFit: 'cover',
                              borderRadius: '16px 16px 0 0'
                            }}
                            onError={(e) => {
                              if (e.target.src !== recMovie.image && recMovie.image) {
                                e.target.src = recMovie.image;
                              } else if (e.target.src !== '/placeholder-movie.jpg') {
                                e.target.src = '/placeholder-movie.jpg';
                              } else {
                                e.target.src = 'https://via.placeholder.com/300x300/333/fff?text=No+Image';
                              }
                            }}
                          />

                          {recMovie.rating && (
                            <div className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark"
                                 style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
                              <i className="fas fa-star me-1"></i>
                              {parseFloat(recMovie.rating).toFixed(1)}
                            </div>
                          )}
                        </div>

                        <div className="card-body p-3">
                          <h6 className="recommended-movie-title mb-2 text-light fw-bold"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '1rem'
                              }}>
                            {recMovie.title}
                          </h6>
                          <div className="recommended-movie-meta d-flex align-items-center text-muted mb-2">
                            <i className="fas fa-calendar me-2" style={{ fontSize: '0.8rem' }}></i>
                            <span>{recMovie.year || recMovie.releaseYear}</span>
                            {recMovie.genre && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="d-none d-sm-inline">{recMovie.genre}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
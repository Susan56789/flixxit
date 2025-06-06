import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('add');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [editingMovie, setEditingMovie] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genres: '',  // Changed from 'genre' to 'genres'
    rating: '',
    year: '',
    imageUrl: '',
    videoUrl: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formError, setFormError] = useState({});

  // Genre options
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation'];

  // Check admin authentication
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!adminLoggedIn) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Fetch movies on component mount
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies');
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMessage({ type: 'error', text: 'Failed to fetch movies' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error for this field
    if (formError[name]) {
      setFormError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.genres) errors.genres = 'Genre is required';
    if (!formData.year || isNaN(formData.year) || formData.year < 1900 || formData.year > new Date().getFullYear() + 5) {
      errors.year = 'Enter a valid year';
    }
    if (!formData.rating || isNaN(formData.rating) || formData.rating < 0 || formData.rating > 10) {
      errors.rating = 'Rating must be between 0 and 10';
    }
    if (!formData.imageUrl.trim()) errors.imageUrl = 'Image URL is required';
    if (!formData.videoUrl.trim()) errors.videoUrl = 'Video URL is required';
    
    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const formattedData = {
      ...formData,
      rating: parseFloat(formData.rating),
      year: parseInt(formData.year, 10)
    };

    try {
      if (editingMovie) {
        // Update existing movie
        await axios.put(`https://flixxit-h9fa.onrender.com/api/movies/${editingMovie._id}`, formattedData);
        setMessage({ type: 'success', text: 'Movie updated successfully!' });
      } else {
        // Add new movie
        await axios.post('https://flixxit-h9fa.onrender.com/api/movies', formattedData);
        setMessage({ type: 'success', text: 'Movie added successfully!' });
      }
      
      resetForm();
      fetchMovies();
      setActiveTab('manage');
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${editingMovie ? 'update' : 'add'} movie. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genres: '',  // Changed from 'genre' to 'genres'
      rating: '',
      year: '',
      imageUrl: '',
      videoUrl: ''
    });
    setFormError({});
    setEditingMovie(null);
  };

  const handleEdit = (movie) => {
    setFormData({
      title: movie.title,
      description: movie.description,
      genres: movie.genres || movie.genre || '',  // Handle both 'genres' and 'genre' fields
      rating: movie.rating.toString(),
      year: movie.year.toString(),
      imageUrl: movie.imageUrl,
      videoUrl: movie.videoUrl
    });
    setEditingMovie(movie);
    setActiveTab('add');
  };

  const handleDelete = async () => {
    if (!movieToDelete) return;
    
    setLoading(true);
    try {
      await axios.delete(`https://flixxit-h9fa.onrender.com/api/movies/${movieToDelete._id}`);
      setMessage({ type: 'success', text: 'Movie deleted successfully!' });
      fetchMovies();
      setShowDeleteModal(false);
      setMovieToDelete(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete movie' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
  };

  // Filter and sort movies
  const filteredMovies = movies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movie.description.toLowerCase().includes(searchTerm.toLowerCase());
      const movieGenre = movie.genres || movie.genre || '';  // Handle both fields
      const matchesGenre = selectedGenre === 'all' || movieGenre === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        case 'oldest':
          return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
        case 'rating':
          return b.rating - a.rating;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Handle image error
  const handleImageError = (movieId) => {
    setImageErrors(prev => ({ ...prev, [movieId]: true }));
  };

  // Get unique genres from movies
  const movieGenres = [...new Set(movies.map(movie => movie.genres || movie.genre).filter(Boolean))];

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#000' }}>
      {/* Header */}
      <nav className="navbar navbar-dark" style={{ backgroundColor: '#1a1a1a', borderBottom: '3px solid #ff0000' }}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-film text-danger me-2"></i>
            Flixxit Admin Dashboard
          </span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <i className="fas fa-user-shield me-2"></i>
              {localStorage.getItem('adminEmail')}
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid py-4">
        {/* Alert Messages */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-film me-2"></i>Total Movies
                </h5>
                <h2 className="mb-0">{movies.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-star me-2"></i>Avg Rating
                </h5>
                <h2 className="mb-0">
                  {movies.length > 0 
                    ? (movies.reduce((acc, m) => acc + m.rating, 0) / movies.length).toFixed(1)
                    : '0.0'
                  }
                </h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-tags me-2"></i>Genres
                </h5>
                <h2 className="mb-0">{movieGenres.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-calendar me-2"></i>Latest Year
                </h5>
                <h2 className="mb-0">
                  {movies.length > 0 ? Math.max(...movies.map(m => m.year)) : 'N/A'}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" style={{ borderColor: '#333' }}>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'add' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('add')}
              style={{ border: 'none', borderBottom: activeTab === 'add' ? '3px solid #ff0000' : 'none' }}
            >
              <i className="fas fa-plus-circle me-2"></i>
              {editingMovie ? 'Edit Movie' : 'Add Movie'}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'manage' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('manage')}
              style={{ border: 'none', borderBottom: activeTab === 'manage' ? '3px solid #ff0000' : 'none' }}
            >
              <i className="fas fa-cog me-2"></i>
              Manage Movies ({filteredMovies.length})
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Add/Edit Movie Tab */}
          {activeTab === 'add' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card bg-dark text-white border-danger">
                  <div className="card-body p-4">
                    <h3 className="mb-4">
                      <i className={`fas fa-${editingMovie ? 'edit' : 'plus'} text-danger me-2`}></i>
                      {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                    </h3>
                    
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="title" className="form-label">
                            <i className="fas fa-heading me-1"></i> Title
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`form-control bg-secondary text-white border-secondary ${formError.title && 'is-invalid'}`}
                            placeholder="Enter movie title"
                          />
                          {formError.title && <div className="invalid-feedback">{formError.title}</div>}
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label htmlFor="genres" className="form-label">
                            <i className="fas fa-masks-theater me-1"></i> Genre
                          </label>
                          <select
                            id="genres"
                            name="genres"
                            value={formData.genres}
                            onChange={handleChange}
                            className={`form-select bg-secondary text-white border-secondary ${formError.genres && 'is-invalid'}`}
                          >
                            <option value="">Select a genre</option>
                            {genres.map(genre => (
                              <option key={genre} value={genre}>{genre}</option>
                            ))}
                          </select>
                          {formError.genres && <div className="invalid-feedback">{formError.genres}</div>}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">
                          <i className="fas fa-align-left me-1"></i> Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className={`form-control bg-secondary text-white border-secondary ${formError.description && 'is-invalid'}`}
                          rows="4"
                          placeholder="Enter movie description"
                        ></textarea>
                        {formError.description && <div className="invalid-feedback">{formError.description}</div>}
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="year" className="form-label">
                            <i className="fas fa-calendar-alt me-1"></i> Year
                          </label>
                          <input
                            type="number"
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className={`form-control bg-secondary text-white border-secondary ${formError.year && 'is-invalid'}`}
                            placeholder="e.g., 2024"
                            min="1900"
                            max={new Date().getFullYear() + 5}
                          />
                          {formError.year && <div className="invalid-feedback">{formError.year}</div>}
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label htmlFor="rating" className="form-label">
                            <i className="fas fa-star me-1"></i> Rating (0-10)
                          </label>
                          <input
                            type="number"
                            id="rating"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            className={`form-control bg-secondary text-white border-secondary ${formError.rating && 'is-invalid'}`}
                            placeholder="e.g., 8.5"
                            step="0.1"
                            min="0"
                            max="10"
                          />
                          {formError.rating && <div className="invalid-feedback">{formError.rating}</div>}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          <i className="fas fa-image me-1"></i> Image URL
                        </label>
                        <input
                          type="url"
                          id="imageUrl"
                          name="imageUrl"
                          value={formData.imageUrl}
                          onChange={handleChange}
                          className={`form-control bg-secondary text-white border-secondary ${formError.imageUrl && 'is-invalid'}`}
                          placeholder="https://example.com/movie-poster.jpg"
                        />
                        {formError.imageUrl && <div className="invalid-feedback">{formError.imageUrl}</div>}
                      </div>

                      <div className="mb-4">
                        <label htmlFor="videoUrl" className="form-label">
                          <i className="fas fa-video me-1"></i> Video URL
                        </label>
                        <input
                          type="url"
                          id="videoUrl"
                          name="videoUrl"
                          value={formData.videoUrl}
                          onChange={handleChange}
                          className={`form-control bg-secondary text-white border-secondary ${formError.videoUrl && 'is-invalid'}`}
                          placeholder="https://example.com/movie-trailer.mp4"
                        />
                        {formError.videoUrl && <div className="invalid-feedback">{formError.videoUrl}</div>}
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-danger" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {editingMovie ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            <>
                              <i className={`fas fa-${editingMovie ? 'save' : 'plus'} me-2`}></i>
                              {editingMovie ? 'Update Movie' : 'Add Movie'}
                            </>
                          )}
                        </button>
                        {editingMovie && (
                          <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            <i className="fas fa-times me-2"></i>Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manage Movies Tab */}
          {activeTab === 'manage' && (
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                {/* Search and Filter Bar */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-2">
                    <div className="input-group">
                      <span className="input-group-text bg-secondary border-secondary">
                        <i className="fas fa-search text-white"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-secondary text-white border-secondary"
                        placeholder="Search movies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mb-2">
                    <select
                      className="form-select bg-secondary text-white border-secondary"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                      <option value="all">All Genres</option>
                      {movieGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 mb-2">
                    <select
                      className="form-select bg-secondary text-white border-secondary"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="rating">Highest Rating</option>
                      <option value="title">Alphabetical</option>
                    </select>
                  </div>
                </div>

                {/* Movies Table */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredMovies.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-film fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No movies found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr className="text-danger">
                          <th>Poster</th>
                          <th>Title</th>
                          <th>Genre</th>
                          <th>Year</th>
                          <th>Rating</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovies.map(movie => (
                          <tr key={movie._id}>
                            <td>
                              {imageErrors[movie._id] ? (
                                <div 
                                  style={{ 
                                    width: '50px', 
                                    height: '75px', 
                                    backgroundColor: '#333', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    borderRadius: '0.25rem',
                                    fontSize: '20px',
                                    color: '#666'
                                  }}
                                >
                                  <i className="fas fa-film"></i>
                                </div>
                              ) : (
                                <img 
                                  src={movie.imageUrl} 
                                  alt={movie.title}
                                  style={{ 
                                    width: '50px', 
                                    height: '75px', 
                                    objectFit: 'cover',
                                    backgroundColor: '#333'
                                  }}
                                  className="rounded"
                                  onError={() => handleImageError(movie._id)}
                                />
                              )}
                            </td>
                            <td className="align-middle">
                              <strong>{movie.title}</strong>
                              <br />
                              <small className="text-muted">{movie.description.substring(0, 50)}...</small>
                            </td>
                            <td className="align-middle">{movie.genres || movie.genre || 'N/A'}</td>
                            <td className="align-middle">{movie.year}</td>
                            <td className="align-middle">
                              <span className="badge bg-warning text-dark">
                                <i className="fas fa-star me-1"></i>
                                {movie.rating}
                              </span>
                            </td>
                            <td className="align-middle">
                              <button
                                className="btn btn-sm btn-outline-warning me-2"
                                onClick={() => handleEdit(movie)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  setMovieToDelete(movie);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content bg-dark text-white border-danger">
                <div className="modal-header border-danger">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                    Confirm Delete
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  Are you sure you want to delete <strong>{movieToDelete?.title}</strong>?
                  <br />
                  This action cannot be undone.
                </div>
                <div className="modal-footer border-danger">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Movie'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  
  // Updated state for subscribers collection
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [expiringSubscribers, setExpiringSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Pagination state for subscribers
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscribersPerPage] = useState(10);
  const [subscriberSearchTerm, setSubscriberSearchTerm] = useState('');
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState('all');
  const [subscriberPlanFilter, setSubscriberPlanFilter] = useState('all');
  
  // Pagination state for movies
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(20);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genres: '',
    rating: '',
    year: '',
    imageUrl: '',
    videoUrl: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formError, setFormError] = useState({});

  // API base URL
  const API_BASE_URL = 'https://flixxit-h9fa.onrender.com';

  // Genre options
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation'];

  // Check admin authentication
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminLoggedIn) {
      navigate('/admin/login');
      return;
    }
    
    if (!adminToken) {
      localStorage.setItem('adminToken', 'admin-placeholder-token');
    }
  }, [navigate]);

  // Fetch initial data
  useEffect(() => {
    fetchMovies();
    fetchUserStats();
    fetchSubscriptionStats();
    fetchRevenueStats();
    fetchSubscribers();
    fetchExpiringSubscribers();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, sortBy]);

  useEffect(() => {
    setSubscriberPage(1);
  }, [subscriberSearchTerm, subscriberStatusFilter, subscriberPlanFilter]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/movies`);
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMessage({ type: 'error', text: 'Failed to fetch movies' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const subscriptionResponse = await axios.get(`${API_BASE_URL}/api/subscription-stats`);
      const data = subscriptionResponse.data;
      
      const totalUsers = data.totalUsers || 0;
      const subscriptionBreakdown = data.subscriptionBreakdown || [];
      const premiumStat = subscriptionBreakdown.find(stat => stat._id === 'Premium');
      const premiumUsers = premiumStat?.count || 0;
      
      setUserStats({
        totalUsers: totalUsers,
        activeUsers: premiumUsers,
        newUsersThisMonth: 0,
        premiumUsers: premiumUsers
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        premiumUsers: 0
      });
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      
      const response = await axios.get(`${API_BASE_URL}/api/subscription-stats`);
      const data = response.data;
      
      
      const planBreakdown = data.planBreakdown || { free: 0, premium: 0 };
      const subscriptionPlanBreakdown = data.subscriptionPlanBreakdown || {
        monthly: 0,
        quarterly: 0,
        semiAnnually: 0,
        yearly: 0
      };
      
      const statsData = {
        totalSubscriptions: planBreakdown.premium || 0,
        activeSubscriptions: planBreakdown.premium || 0,
        expiringSoon: data.expiringSoon || 0,
        expiredSubscriptions: data.needsCleanup || 0,
        subscriptionBreakdown: subscriptionPlanBreakdown,
        planBreakdown: planBreakdown,
        estimatedMonthlyRevenue: parseFloat(data.estimatedMonthlyRevenue) || 0
      };
      
      
      setSubscriptionStats(statsData);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      setSubscriptionStats({
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        expiringSoon: 0,
        expiredSubscriptions: 0,
        subscriptionBreakdown: {
          monthly: 0,
          quarterly: 0,
          semiAnnually: 0,
          yearly: 0
        },
        planBreakdown: {
          free: 0,
          premium: 0
        },
        estimatedMonthlyRevenue: 0
      });
    }
  };

  const fetchRevenueStats = async () => {
    try {
      // Get actual subscribers data to calculate real revenue
      const subscribersResponse = await axios.get(`${API_BASE_URL}/api/subscribers`, {
        params: { limit: 1000 } // Get more subscribers for accurate calculation
      });
      
      const allSubscribers = subscribersResponse.data.success ? subscribersResponse.data.subscribers : [];
      
      // Calculate current month revenue (subscriptions that started this month)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const thisMonthSubscribers = allSubscribers.filter(subscriber => {
        if (!subscriber.startDate) return false;
        const startDate = new Date(subscriber.startDate);
        return startDate.getMonth() === currentMonth && 
               startDate.getFullYear() === currentYear &&
               subscriber.status === 'active';
      });
      
      const monthlyRevenue = thisMonthSubscribers.reduce((total, subscriber) => {
        return total + (subscriber.cost || 0);
      }, 0);
      
      // Calculate total revenue from all active subscriptions
      const totalRevenue = allSubscribers
        .filter(subscriber => subscriber.status === 'active')
        .reduce((total, subscriber) => {
          return total + (subscriber.cost || 0);
        }, 0);
      
      // Calculate average revenue per subscriber
      const activeSubscribers = allSubscribers.filter(subscriber => subscriber.status === 'active');
      const averageRevenuePerUser = activeSubscribers.length > 0 ? 
        totalRevenue / activeSubscribers.length : 0;
      
      // Calculate monthly recurring revenue (MRR) - convert all subscriptions to monthly equivalent
      const monthlyRecurringRevenue = allSubscribers
        .filter(subscriber => subscriber.status === 'active')
        .reduce((total, subscriber) => {
          const cost = subscriber.cost || 0;
          const plan = subscriber.subscriptionType;
          
          // Convert to monthly equivalent
          switch (plan) {
            case 'monthly': return total + cost;
            case 'quarterly': return total + (cost / 3);
            case 'semiAnnually': return total + (cost / 6);
            case 'yearly': return total + (cost / 12);
            default: return total + cost;
          }
        }, 0);
      
      
      
      setRevenueStats({
        monthlyRevenue: monthlyRevenue, // Actual revenue from new subscriptions this month
        totalRevenue: totalRevenue, // Total revenue from all active subscriptions
        monthlyRecurringRevenue: monthlyRecurringRevenue, // MRR
        averageRevenuePerUser: averageRevenuePerUser,
        revenueGrowth: 0, // Would need historical data to calculate
        newSubscribersThisMonth: thisMonthSubscribers.length
      });
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      setRevenueStats({
        monthlyRevenue: 0,
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageRevenuePerUser: 0,
        revenueGrowth: 0,
        newSubscribersThisMonth: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // NEW: Fetch all subscribers from subscribers collection
  const fetchSubscribers = async (page = 1, limit = 50) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscribers`, {
        params: { 
          page: page, 
          limit: limit,
          status: subscriberStatusFilter !== 'all' ? subscriberStatusFilter : undefined
        }
      })
      
      if (response.data.success) {
        setSubscribers(response.data.subscribers || []);
      } else {
        console.error('Failed to fetch subscribers:', response.data.message);
        setSubscribers([]);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers([]);
    }
  };

  // NEW: Fetch expiring subscribers
  const fetchExpiringSubscribers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users-expiring-soon?days=7`);
      setExpiringSubscribers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching expiring subscribers:', error);
      setExpiringSubscribers([]);
    }
  };

  // NEW: Cancel subscription function
  const handleCancelSubscription = async (userId, reason = 'Admin cancelled') => {
    try {
      await axios.post(`${API_BASE_URL}/api/cancel-subscription`, {
        userId: userId,
        reason: reason
      });
      setMessage({ type: 'success', text: 'Subscription cancelled successfully!' });
      fetchSubscribers();
      fetchSubscriptionStats();
      fetchUserStats();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    }
  };

  // NEW: Reactivate subscription function
  const handleReactivateSubscription = async (userId, subscriptionType = 'monthly') => {
    try {
      await axios.post(`${API_BASE_URL}/api/reactivate-subscription`, {
        userId: userId,
        subscriptionType: subscriptionType
      });
      setMessage({ type: 'success', text: 'Subscription reactivated successfully!' });
      fetchSubscribers();
      fetchSubscriptionStats();
      fetchUserStats();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setMessage({ type: 'error', text: 'Failed to reactivate subscription' });
    }
  };

  // NEW: Bulk cancel subscriptions
  const handleBulkCancelSubscriptions = async () => {
    if (selectedSubscribers.length === 0) return;
    
    try {
      await Promise.all(selectedSubscribers.map(subscriberId => {
        const subscriber = subscribers.find(s => s._id === subscriberId);
        return axios.post(`${API_BASE_URL}/api/cancel-subscription`, {
          userId: subscriber.userId,
          reason: 'Bulk admin cancellation'
        });
      }));
      
      setMessage({ type: 'success', text: `${selectedSubscribers.length} subscriptions cancelled successfully!` });
      setSelectedSubscribers([]);
      fetchSubscribers();
      fetchSubscriptionStats();
      fetchUserStats();
    } catch (error) {
      console.error('Error bulk cancelling subscriptions:', error);
      setMessage({ type: 'error', text: 'Failed to cancel selected subscriptions' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
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
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      };

      if (editingMovie) {
        await axios.put(`${API_BASE_URL}/api/movies/${editingMovie._id}`, formattedData, config);
        setMessage({ type: 'success', text: 'Movie updated successfully!' });
      } else {
        await axios.post(`${API_BASE_URL}/api/movies`, formattedData, config);
        setMessage({ type: 'success', text: 'Movie added successfully!' });
      }
      
      resetForm();
      fetchMovies();
      setActiveTab('manage');
    } catch (error) {
      console.error('Error saving movie:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Failed to ${editingMovie ? 'update' : 'add'} movie. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genres: '',
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
      genres: movie.genres || movie.genre || '',
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
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      };
      await axios.delete(`${API_BASE_URL}/api/movies/${movieToDelete._id}`, config);
      setMessage({ type: 'success', text: 'Movie deleted successfully!' });
      fetchMovies();
      setShowDeleteModal(false);
      setMovieToDelete(null);
    } catch (error) {
      console.error('Error deleting movie:', error);
      setMessage({ type: 'error', text: 'Failed to delete movie' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMovies.length === 0) return;
    
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      };
      await Promise.all(selectedMovies.map(id => 
        axios.delete(`${API_BASE_URL}/api/movies/${id}`, config)
      ));
      setMessage({ type: 'success', text: `${selectedMovies.length} movies deleted successfully!` });
      setSelectedMovies([]);
      fetchMovies();
    } catch (error) {
      console.error('Error deleting movies:', error);
      setMessage({ type: 'error', text: 'Failed to delete selected movies' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = (movieId) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleSelectSubscriber = (subscriberId) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId) 
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMovies(
      selectedMovies.length === currentMovies.length 
        ? [] 
        : currentMovies.map(movie => movie._id)
    );
  };

  const handleSelectAllSubscribers = () => {
    setSelectedSubscribers(
      selectedSubscribers.length === currentSubscribers.length 
        ? [] 
        : currentSubscribers.map(subscriber => subscriber._id)
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const sendExpirationReminders = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/send-expiration-reminders`, { days: 7 });
      setMessage({ type: 'success', text: 'Expiration reminders sent successfully!' });
    } catch (error) {
      console.error('Error sending reminders:', error);
      setMessage({ type: 'error', text: 'Failed to send reminders' });
    }
  };

  const cleanupExpiredSubscriptions = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/check-expired-subscriptions`);
      setMessage({ type: 'success', text: 'Expired subscriptions cleaned up successfully!' });
      fetchSubscriptionStats();
      fetchUserStats();
      fetchSubscribers();
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
      setMessage({ type: 'error', text: 'Failed to cleanup expired subscriptions' });
    }
  };

  // Filter and sort movies
  const filteredMovies = movies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movie.description.toLowerCase().includes(searchTerm.toLowerCase());
      const movieGenre = movie.genres || movie.genre || '';
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

  // Filter subscribers
  const filteredSubscribers = subscribers
    .filter(subscriber => {
      const matchesSearch = !subscriberSearchTerm || 
        subscriber.userEmail.toLowerCase().includes(subscriberSearchTerm.toLowerCase()) ||
        subscriber.username.toLowerCase().includes(subscriberSearchTerm.toLowerCase());
      
      const matchesStatus = subscriberStatusFilter === 'all' || subscriber.status === subscriberStatusFilter;
      const matchesPlan = subscriberPlanFilter === 'all' || subscriber.subscriptionType === subscriberPlanFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination calculations for movies
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  // Pagination calculations for subscribers
  const indexOfLastSubscriber = subscriberPage * subscribersPerPage;
  const indexOfFirstSubscriber = indexOfLastSubscriber - subscribersPerPage;
  const currentSubscribers = filteredSubscribers.slice(indexOfFirstSubscriber, indexOfLastSubscriber);
  const totalSubscriberPages = Math.ceil(filteredSubscribers.length / subscribersPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const showPages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="Pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link bg-secondary text-white border-secondary"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link bg-secondary text-white border-secondary"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-angle-left"></i>
            </button>
          </li>
          
          {pageNumbers.map(number => (
            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
              <button 
                className={`page-link ${currentPage === number ? 'bg-danger border-danger' : 'bg-secondary border-secondary'} text-white`}
                onClick={() => onPageChange(number)}
              >
                {number}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link bg-secondary text-white border-secondary"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-angle-right"></i>
            </button>
          </li>
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link bg-secondary text-white border-secondary"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const handleImageError = (movieId) => {
    setImageErrors(prev => ({ ...prev, [movieId]: true }));
  };

  const movieGenres = [...new Set(movies.map(movie => movie.genres || movie.genre).filter(Boolean))];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getDaysRemaining = (expirationDate) => {
    if (!expirationDate) return 0;
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'expired': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-warning';
    }
  };

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'monthly': return 'bg-primary';
      case 'quarterly': return 'bg-info';
      case 'semiAnnually': return 'bg-warning text-dark';
      case 'yearly': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="min-vh-100 bg-black text-white">
      {/* Header */}
      <nav className="navbar navbar-dark" style={{ backgroundColor: '#1a1a1a', borderBottom: '3px solid #dc3545' }}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-film text-danger me-2"></i>
            Flixxit Admin Dashboard
          </span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <i className="fas fa-user-shield me-2"></i>
              admin@flixxit.com
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
        {statsLoading ? (
          <div className="text-center py-3">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading stats...</span>
            </div>
          </div>
        ) : (
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-dark text-white border-danger">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-film me-2"></i>Total Movies
                  </h5>
                  <h2 className="mb-0 text-danger">{movies.length}</h2>
                  <small className="text-muted">Active in catalog</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-dark text-white border-danger">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-users me-2"></i>Total Users
                  </h5>
                  <h2 className="mb-0 text-danger">{userStats?.totalUsers || 0}</h2>
                  <small className="text-muted">Registered users</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-dark text-white border-danger">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-crown me-2"></i>Active Subscribers
                  </h5>
                  <h2 className="mb-0 text-danger">
                    {subscribers.filter(s => s.status === 'active').length}
                  </h2>
                  <small className="text-muted">Premium subscriptions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-dark text-white border-danger">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-dollar-sign me-2"></i>This Month Revenue
                  </h5>
                  <h2 className="mb-0 text-danger">
                    {formatCurrency(revenueStats?.monthlyRevenue)}
                  </h2>
                  <small className="text-muted">{revenueStats?.newSubscribersThisMonth || 0} new subs</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-dark border-danger">
              <div className="card-body">
                <h5 className="card-title text-danger">
                  <i className="fas fa-bolt me-2"></i>Quick Actions
                </h5>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-secondary rounded">
                      <div>
                        <strong>Expiring Soon</strong>
                        <br />
                        <small className="text-muted">{expiringSubscribers.length} subscriptions expire within 7 days</small>
                      </div>
                      <button 
                        className="btn btn-warning btn-sm" 
                        onClick={sendExpirationReminders}
                        disabled={loading}
                      >
                        <i className="fas fa-envelope me-1"></i>Send Reminders
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-secondary rounded">
                      <div>
                        <strong>Cleanup Needed</strong>
                        <br />
                        <small className="text-muted">{subscriptionStats?.expiredSubscriptions || 0} expired subscriptions</small>
                      </div>
                      <button 
                        className="btn btn-info btn-sm" 
                        onClick={cleanupExpiredSubscriptions}
                        disabled={loading}
                      >
                        <i className="fas fa-broom me-1"></i>Clean Up
                      </button>
                    </div>
                  </div>
                </div>
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
              style={{ border: 'none', backgroundColor: activeTab === 'add' ? '#dc3545' : 'transparent' }}
            >
              <i className="fas fa-plus-circle me-2"></i>
              {editingMovie ? 'Edit Movie' : 'Add Movie'}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'manage' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('manage')}
              style={{ border: 'none', backgroundColor: activeTab === 'manage' ? '#dc3545' : 'transparent' }}
            >
              <i className="fas fa-cog me-2"></i>
              Manage Movies ({filteredMovies.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'subscribers' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('subscribers')}
              style={{ border: 'none', backgroundColor: activeTab === 'subscribers' ? '#dc3545' : 'transparent' }}
            >
              <i className="fas fa-crown me-2"></i>
              Subscribers ({filteredSubscribers.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('users')}
              style={{ border: 'none', backgroundColor: activeTab === 'users' ? '#dc3545' : 'transparent' }}
            >
              <i className="fas fa-users me-2"></i>
              User Management
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'analytics' ? 'active bg-danger text-white' : 'text-white'}`}
              onClick={() => setActiveTab('analytics')}
              style={{ border: 'none', backgroundColor: activeTab === 'analytics' ? '#dc3545' : 'transparent' }}
            >
              <i className="fas fa-chart-bar me-2"></i>
              Analytics
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
                  <div className="col-md-3 mb-2">
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
                  <div className="col-md-3 mb-2">
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
                  <div className="col-md-3 mb-2">
                    <select
                      className="form-select bg-secondary text-white border-secondary"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="rating">Highest Rated</option>
                      <option value="title">A to Z</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-2">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setShowBulkActions(!showBulkActions)}
                      >
                        <i className="fas fa-tasks me-1"></i>
                        Bulk Actions
                      </button>
                      {selectedMovies.length > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                          <i className="fas fa-trash me-1"></i>
                          Delete ({selectedMovies.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination Info */}
                <div className="row mb-3">
                  <div className="col-md-8">
                    <p className="text-muted mb-0">
                      Showing {indexOfFirstMovie + 1}-{Math.min(indexOfLastMovie, filteredMovies.length)} of {filteredMovies.length} movies
                      {searchTerm && ` (filtered from ${movies.length} total)`}
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    <small className="text-muted">
                      Page {currentPage} of {totalPages}
                    </small>
                  </div>
                </div>

                {/* Bulk Actions */}
                {showBulkActions && (
                  <div className="alert alert-info">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="selectAll"
                        checked={selectedMovies.length === currentMovies.length && currentMovies.length > 0}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label" htmlFor="selectAll">
                        Select All on this page ({currentMovies.length} movies)
                      </label>
                    </div>
                  </div>
                )}

                {/* Movies Grid */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading movies...</span>
                    </div>
                  </div>
                ) : filteredMovies.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-film fa-3x text-muted mb-3"></i>
                    <h4 className="text-muted">No movies found</h4>
                    <p className="text-muted">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <>
                    <div className="row">
                      {currentMovies.map(movie => (
                        <div key={movie._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                          <div className="card bg-secondary text-white h-100 position-relative">
                            {showBulkActions && (
                              <div className="position-absolute top-0 start-0 p-2" style={{ zIndex: 10 }}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedMovies.includes(movie._id)}
                                  onChange={() => handleSelectMovie(movie._id)}
                                />
                              </div>
                            )}
                            
                            <div className="position-relative">
                              {imageErrors[movie._id] ? (
                                <div className="d-flex align-items-center justify-content-center bg-dark" style={{ height: '300px' }}>
                                  <i className="fas fa-image fa-3x text-muted"></i>
                                </div>
                              ) : (
                                <img
                                  src={movie.imageUrl}
                                  className="card-img-top"
                                  alt={movie.title}
                                  style={{ height: '300px', objectFit: 'cover' }}
                                  onError={() => handleImageError(movie._id)}
                                />
                              )}
                              <div className="position-absolute top-0 end-0 p-2">
                                <span className="badge bg-warning text-dark">
                                  <i className="fas fa-star me-1"></i>
                                  {movie.rating}
                                </span>
                              </div>
                            </div>
                            
                            <div className="card-body d-flex flex-column">
                              <h6 className="card-title fw-bold">{movie.title}</h6>
                              <p className="card-text small text-muted mb-2">
                                {movie.genres || movie.genre} • {movie.year}
                              </p>
                              <p className="card-text flex-grow-1" style={{ fontSize: '0.85rem' }}>
                                {movie.description.length > 100 
                                  ? `${movie.description.substring(0, 100)}...` 
                                  : movie.description}
                              </p>
                              
                              <div className="d-flex gap-2 mt-auto">
                                <button
                                  className="btn btn-outline-warning btn-sm flex-fill"
                                  onClick={() => handleEdit(movie)}
                                >
                                  <i className="fas fa-edit me-1"></i>Edit
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm flex-fill"
                                  onClick={() => {
                                    setMovieToDelete(movie);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="fas fa-trash me-1"></i>Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination 
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* NEW: Subscribers Management Tab */}
          {activeTab === 'subscribers' && (
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h3 className="mb-4">
                  <i className="fas fa-crown text-danger me-2"></i>
                  Subscribers Management
                </h3>

                {/* Subscriber Filters */}
                <div className="row mb-4">
                  <div className="col-md-3 mb-2">
                    <div className="input-group">
                      <span className="input-group-text bg-secondary border-secondary">
                        <i className="fas fa-search text-white"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-secondary text-white border-secondary"
                        placeholder="Search by email or username..."
                        value={subscriberSearchTerm}
                        onChange={(e) => setSubscriberSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 mb-2">
                    <select
                      className="form-select bg-secondary text-white border-secondary"
                      value={subscriberStatusFilter}
                      onChange={(e) => setSubscriberStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-2">
                    <select
                      className="form-select bg-secondary text-white border-secondary"
                      value={subscriberPlanFilter}
                      onChange={(e) => setSubscriberPlanFilter(e.target.value)}
                    >
                      <option value="all">All Plans</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semiAnnually">Semi-Annually</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-2">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setShowBulkActions(!showBulkActions)}
                      >
                        <i className="fas fa-tasks me-1"></i>
                        Bulk Actions
                      </button>
                      {selectedSubscribers.length > 0 && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={handleBulkCancelSubscriptions}
                        >
                          <i className="fas fa-times me-1"></i>
                          Cancel ({selectedSubscribers.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination Info */}
                <div className="row mb-3">
                  <div className="col-md-8">
                    <p className="text-muted mb-0">
                      Showing {indexOfFirstSubscriber + 1}-{Math.min(indexOfLastSubscriber, filteredSubscribers.length)} of {filteredSubscribers.length} subscribers
                      {subscriberSearchTerm && ` (filtered from ${subscribers.length} total)`}
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    <small className="text-muted">
                      Page {subscriberPage} of {totalSubscriberPages}
                    </small>
                  </div>
                </div>

                {/* Bulk Actions for Subscribers */}
                {showBulkActions && (
                  <div className="alert alert-info">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="selectAllSubscribers"
                        checked={selectedSubscribers.length === currentSubscribers.length && currentSubscribers.length > 0}
                        onChange={handleSelectAllSubscribers}
                      />
                      <label className="form-check-label" htmlFor="selectAllSubscribers">
                        Select All on this page ({currentSubscribers.length} subscribers)
                      </label>
                    </div>
                  </div>
                )}

                {/* Subscribers Table */}
                {filteredSubscribers.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-crown fa-3x text-muted mb-3"></i>
                    <h4 className="text-muted">No subscribers found</h4>
                    <p className="text-muted">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-dark table-striped">
                        <thead>
                          <tr>
                            {showBulkActions && (
                              <th style={{ width: '50px' }}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedSubscribers.length === currentSubscribers.length && currentSubscribers.length > 0}
                                  onChange={handleSelectAllSubscribers}
                                />
                              </th>
                            )}
                            <th>User</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Cost</th>
                            <th>Start Date</th>
                            <th>Expires</th>
                            <th>Days Left</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSubscribers.map(subscriber => {
                            const daysLeft = getDaysRemaining(subscriber.expirationDate);
                            return (
                              <tr key={subscriber._id}>
                                {showBulkActions && (
                                  <td>
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={selectedSubscribers.includes(subscriber._id)}
                                      onChange={() => handleSelectSubscriber(subscriber._id)}
                                    />
                                  </td>
                                )}
                                <td>
                                  <div>
                                    <strong>{subscriber.username}</strong>
                                    <br />
                                    <small className="text-muted">{subscriber.userEmail}</small>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getPlanBadgeClass(subscriber.subscriptionType)}`}>
                                    {subscriber.subscriptionType}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(subscriber.status)}`}>
                                    {subscriber.status}
                                  </span>
                                </td>
                                <td>{formatCurrency(subscriber.cost)}</td>
                                <td>{formatDate(subscriber.startDate)}</td>
                                <td>{formatDate(subscriber.expirationDate)}</td>
                                <td>
                                  <span className={`badge ${daysLeft <= 7 ? 'bg-warning text-dark' : daysLeft <= 0 ? 'bg-danger' : 'bg-success'}`}>
                                    {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                                  </span>
                                </td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    {subscriber.status === 'active' ? (
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleCancelSubscription(subscriber.userId)}
                                        title="Cancel Subscription"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() => handleReactivateSubscription(subscriber.userId, 'monthly')}
                                        title="Reactivate Subscription"
                                      >
                                        <i className="fas fa-check"></i>
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-outline-info btn-sm"
                                      onClick={() => {
                                        
                                      }}
                                      title="View Details"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Subscribers Pagination */}
                    {totalSubscriberPages > 1 && (
                      <div className="mt-4">
                        <Pagination 
                          currentPage={subscriberPage}
                          totalPages={totalSubscriberPages}
                          onPageChange={setSubscriberPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h3 className="mb-4">
                  <i className="fas fa-users text-danger me-2"></i>
                  User Management
                </h3>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">User Statistics</h5>
                        <div className="row">
                          <div className="col-6">
                            <div className="text-center">
                              <h3 className="text-danger">{userStats?.totalUsers || 0}</h3>
                              <small>Total Users</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center">
                              <h3 className="text-success">{userStats?.activeUsers || 0}</h3>
                              <small>Active Users</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">Subscription Breakdown</h5>
                        <div className="row">
                          <div className="col-6">
                            <div className="text-center">
                              <h3 className="text-info">{subscriptionStats?.planBreakdown?.free || 0}</h3>
                              <small>Free Users</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center">
                              <h3 className="text-warning">{subscriptionStats?.planBreakdown?.premium || 0}</h3>
                              <small>Premium Users</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-secondary">
                  <div className="card-body">
                    <h5 className="card-title">Users Expiring Soon</h5>
                    {expiringSubscribers.length === 0 ? (
                      <p className="text-muted">No users expiring within the next 7 days.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-dark table-striped">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Username</th>
                              <th>Plan</th>
                              <th>Expires</th>
                              <th>Days Left</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expiringSubscribers.map(user => (
                              <tr key={user.id}>
                                <td>{user.email}</td>
                                <td>{user.username}</td>
                                <td>
                                  <span className="badge bg-warning text-dark">
                                    {user.subscriptionType || 'Premium'}
                                  </span>
                                </td>
                                <td>{formatDate(user.expirationDate)}</td>
                                <td>
                                  <span className="badge bg-danger">
                                    {user.daysRemaining} days
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-outline-warning btn-sm me-1"
                                    onClick={sendExpirationReminders}
                                    title="Send Reminder"
                                  >
                                    <i className="fas fa-envelope"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() => handleReactivateSubscription(user.id, user.subscriptionType)}
                                    title="Extend Subscription"
                                  >
                                    <i className="fas fa-plus"></i>
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
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="card bg-dark text-white border-danger">
              <div className="card-body">
                <h3 className="mb-4">
                  <i className="fas fa-chart-bar text-danger me-2"></i>
                  Analytics Dashboard
                </h3>
                
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card bg-secondary">
                      <div className="card-body text-center">
                        <i className="fas fa-dollar-sign fa-2x text-success mb-2"></i>
                        <h4>{formatCurrency(revenueStats?.monthlyRevenue)}</h4>
                        <p className="mb-0">This Month Revenue</p>
                        <small className="text-muted">
                          {revenueStats?.newSubscribersThisMonth || 0} new subscriptions
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-secondary">
                      <div className="card-body text-center">
                        <i className="fas fa-chart-line fa-2x text-info mb-2"></i>
                        <h4>{formatCurrency(revenueStats?.monthlyRecurringRevenue)}</h4>
                        <p className="mb-0">Monthly Recurring Revenue</p>
                        <small className="text-muted">MRR from all active subs</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-secondary">
                      <div className="card-body text-center">
                        <i className="fas fa-coins fa-2x text-warning mb-2"></i>
                        <h4>{formatCurrency(revenueStats?.totalRevenue)}</h4>
                        <p className="mb-0">Total Active Revenue</p>
                        <small className="text-muted">All active subscriptions</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-secondary">
                      <div className="card-body text-center">
                        <i className="fas fa-user-dollar fa-2x text-danger mb-2"></i>
                        <h4>{formatCurrency(revenueStats?.averageRevenuePerUser)}</h4>
                        <p className="mb-0">Avg Revenue/User</p>
                        <small className="text-muted">Per subscription</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">Subscription Plans Distribution</h5>
                        <div className="row text-center">
                          <div className="col-6 col-md-3 mb-3">
                            <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                                 style={{ width: '60px', height: '60px' }}>
                              <span className="fw-bold text-white">
                                {subscriptionStats?.subscriptionBreakdown?.monthly || 0}
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small">Monthly</p>
                          </div>
                          <div className="col-6 col-md-3 mb-3">
                            <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center" 
                                 style={{ width: '60px', height: '60px' }}>
                              <span className="fw-bold text-white">
                                {subscriptionStats?.subscriptionBreakdown?.quarterly || 0}
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small">Quarterly</p>
                          </div>
                          <div className="col-6 col-md-3 mb-3">
                            <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center" 
                                 style={{ width: '60px', height: '60px' }}>
                              <span className="fw-bold text-dark">
                                {subscriptionStats?.subscriptionBreakdown?.semiAnnually || 0}
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small">Semi-Annual</p>
                          </div>
                          <div className="col-6 col-md-3 mb-3">
                            <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center" 
                                 style={{ width: '60px', height: '60px' }}>
                              <span className="fw-bold text-white">
                                {subscriptionStats?.subscriptionBreakdown?.yearly || 0}
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small">Yearly</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">Top Movie Genres</h5>
                        {movieGenres.slice(0, 5).map((genre, index) => {
                          const count = movies.filter(m => (m.genres || m.genre) === genre).length;
                          const percentage = movies.length > 0 ? (count / movies.length) * 100 : 0;
                          return (
                            <div key={genre} className="mb-3">
                              <div className="d-flex justify-content-between">
                                <span>{genre}</span>
                                <span>{count} movies</span>
                              </div>
                              <div className="progress" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-danger" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Status Overview */}
                <div className="row">
                  <div className="col-md-12">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">Subscription Health Overview</h5>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="text-center p-3 border-end border-secondary">
                              <h3 className="text-success">{subscribers.filter(s => s.status === 'active').length}</h3>
                              <small>Active Subscriptions</small>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center p-3 border-end border-secondary">
                              <h3 className="text-warning">{expiringSubscribers.length}</h3>
                              <small>Expiring Soon</small>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center p-3 border-end border-secondary">
                              <h3 className="text-danger">{subscribers.filter(s => s.status === 'expired').length}</h3>
                              <small>Expired</small>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-center p-3">
                              <h3 className="text-secondary">{subscribers.filter(s => s.status === 'cancelled').length}</h3>
                              <small>Cancelled</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card bg-secondary">
                      <div className="card-body">
                        <h5 className="card-title">Recent Subscribers</h5>
                        {subscribers.length === 0 ? (
                          <p className="text-muted">No recent subscribers found.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-dark table-sm">
                              <thead>
                                <tr>
                                  <th>User</th>
                                  <th>Plan</th>
                                  <th>Status</th>
                                  <th>Joined</th>
                                  <th>Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subscribers
                                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                  .slice(0, 10)
                                  .map(subscriber => (
                                    <tr key={subscriber._id}>
                                      <td>
                                        <div>
                                          <strong>{subscriber.username}</strong>
                                          <br />
                                          <small className="text-muted">{subscriber.userEmail}</small>
                                        </div>
                                      </td>
                                      <td>
                                        <span className={`badge ${getPlanBadgeClass(subscriber.subscriptionType)}`}>
                                          {subscriber.subscriptionType}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${getStatusBadgeClass(subscriber.status)}`}>
                                          {subscriber.status}
                                        </span>
                                      </td>
                                      <td>{formatDate(subscriber.createdAt)}</td>
                                      <td>{formatCurrency(subscriber.cost)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  Confirm Delete
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "{movieToDelete?.title}"?</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
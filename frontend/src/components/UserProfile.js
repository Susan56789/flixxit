import React, { useEffect, useMemo, useState, useContext, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getUser, getUserToken } from "../utils/helpers";
import { AuthContext } from '../AuthContext';
import { useTheme } from '../themeContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faCrown, 
  faFilm, 
  faSpinner,
  faCheck,
  faTimes,
  faHeart,
  faCoffee,
  faExternalLinkAlt,
  faGift,
  faCalendarAlt,
  faExclamationTriangle,
  faClock,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";

const UserProfile = () => {
  const { user: contextUser, updateUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [user, setUser] = useState(contextUser || {});
  const [subscribed, setSubscribed] = useState(false);
  const [genre, setGenre] = useState("");
  const [mustWatchMovies, setMustWatchMovies] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState({});
  const [subscriptionOptions, setSubscriptionOptions] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSavingGenre, setIsSavingGenre] = useState(false);

  const token = getUserToken();
  const API_BASE_URL = "https://flixxit-h9fa.onrender.com";

  // Updated localStorage key names to avoid conflicts
  const SUBSCRIPTION_STORAGE_KEY = "flixxItSubscriptionData";
  const USER_STORAGE_KEY = "flixxItUser";

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Update user from context when it changes
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      if (contextUser.preferredGenre) {
        setGenre(contextUser.preferredGenre);
      }
    } else {
      // Fallback to localStorage
      const userData = getUser();
      if (userData) {
        setUser(userData);
        if (userData.preferredGenre) {
          setGenre(userData.preferredGenre);
        }
      }
    }
  }, [contextUser]);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/movies`, {
        timeout: 15000
      });
      setMovies(response.data);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Updated fetchSubscriptionStatus function to work with subscribers collection
  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      if (!user._id) return;

      console.log('Fetching subscription status for user:', user._id);
      
      const response = await axios.get(`${API_BASE_URL}/api/subscription-status`, {
        params: { userId: user._id },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 15000
      });

      console.log('Subscription status response:', response.data);

      const statusData = response?.data?.subscriptionStatus || {
        status: "Free",
        subscribed: false,
        plan: "",
        expirationDate: null,
        daysRemaining: 0
      };

      // Set all subscription states based on the response
      setSubscriptionStatus(statusData.status);
      setSubscriptionOptions(response.data.subscriptionOptions || {});
      setSubscribed(statusData.subscribed);
      setSelectedPlan(statusData.plan || "");
      setSubscriptionData(statusData);

      // Update localStorage with complete subscription data
      const subscriptionDataToStore = {
        subscribed: statusData.subscribed,
        plan: statusData.plan || "",
        status: statusData.status,
        expirationDate: statusData.expirationDate,
        daysRemaining: statusData.daysRemaining || 0,
        startDate: statusData.startDate,
        subscriptionId: statusData.subscriptionId // Store subscription ID from subscribers collection
      };
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptionDataToStore));
      
      console.log('Updated subscription state:', {
        status: statusData.status,
        subscribed: statusData.subscribed,
        plan: statusData.plan,
        daysRemaining: statusData.daysRemaining
      });
      
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      // Set default free status on error
      setSubscriptionStatus("Free");
      setSubscribed(false);
      setSelectedPlan("");
      setSubscriptionData({});
      
      if (error.response?.status !== 404) {
        setError("Failed to load subscription status. Please refresh the page.");
      }
    }
  }, [user._id, token]);

  // Initialize subscription status with updated localStorage key
  useEffect(() => {
    const storedSubscriptionData = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (storedSubscriptionData) {
      try {
        const subscriptionData = JSON.parse(storedSubscriptionData);
        
        // Check if stored data has expiration info and is still valid
        if (subscriptionData.expirationDate) {
          const isExpired = new Date() > new Date(subscriptionData.expirationDate);
          if (isExpired) {
            // Clear expired subscription from localStorage
            localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
            setSubscribed(false);
            setSubscriptionStatus("Free");
            setSelectedPlan("");
            setSubscriptionData({});
            fetchSubscriptionStatus(); // Fetch fresh data
          } else {
            setSubscribed(subscriptionData.subscribed || false);
            setSelectedPlan(subscriptionData.plan || "");
            setSubscriptionStatus(subscriptionData.status || "Free");
            setSubscriptionData(subscriptionData);
            // Still fetch fresh data but don't block UI
            fetchSubscriptionStatus();
          }
        } else {
          // Old format or missing expiration, fetch fresh data
          fetchSubscriptionStatus();
        }
      } catch (error) {
        console.error("Error parsing stored subscription data:", error);
        localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
        fetchSubscriptionStatus();
      }
    } else {
      fetchSubscriptionStatus();
    }
  }, [fetchSubscriptionStatus]);

  const fetchMustWatchMovies = useCallback(async () => {
    if (subscriptionStatus !== "Premium") return;
    
    try {
      const endpoint = genre
        ? `${API_BASE_URL}/api/movies/genre/${encodeURIComponent(genre)}`
        : `${API_BASE_URL}/api/movies`;
      
      const response = await axios.get(endpoint, { timeout: 15000 });
      setMustWatchMovies(response.data.slice(0, 8));
    } catch (error) {
      console.error("Failed to fetch must-watch movies:", error);
      setMustWatchMovies([]);
    }
  }, [genre, subscriptionStatus]);

  useEffect(() => {
    fetchMustWatchMovies();
  }, [fetchMustWatchMovies]);

  // Updated handleSubscribe function to work with subscribers collection
  const handleSubscribe = async (subscriptionType) => {
    if (!user._id) {
      setError("User not found. Please log in again.");
      return;
    }

    setIsSubscribing(true);
    setError(null);
    
    try {
      console.log('Subscribing user:', user._id, 'to plan:', subscriptionType);
      
      const response = await axios.post(`${API_BASE_URL}/api/subscribe`, {
        userId: user._id,
        subscriptionType,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 15000
      });

      console.log('Subscription response:', response.data);

      // Calculate days remaining from the expiration date
      const expirationDate = new Date(response.data.expirationDate);
      const now = new Date();
      const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

      // Update all subscription states
      setSubscribed(true);
      setSelectedPlan(subscriptionType);
      setSubscriptionStatus("Premium");

      const newSubscriptionData = {
        subscribed: true,
        plan: subscriptionType,
        status: "Premium",
        expirationDate: response.data.expirationDate,
        daysRemaining: daysRemaining,
        startDate: new Date().toISOString(),
        subscriptionId: response.data.subscriptionId // Store subscription ID from response
      };

      setSubscriptionData(newSubscriptionData);

      // Update user with minimal subscription data (new structure)
      const updatedUser = { 
        ...user, 
        subscriptionStatus: "Premium",
        hasActiveSubscription: true, // Boolean flag instead of detailed data
        activeSubscriptionId: response.data.subscriptionId // Reference to subscription in subscribers collection
      };
      
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubscriptionData));
      
      // Update context if available
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setSuccess(`Successfully subscribed to ${subscriptionType} plan! Welcome to Premium!`);
      
      // Refresh subscription status to get latest data from server
      setTimeout(() => fetchSubscriptionStatus(), 2000);
    } catch (error) {
      console.error("Subscription failed:", error);
      const errorMessage = error.response?.data?.message || "Subscription failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Optional: Add a function to cancel subscription
  const handleCancelSubscription = async (reason = "User requested") => {
    if (!user._id) {
      setError("User not found. Please log in again.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/cancel-subscription`, {
        userId: user._id,
        reason
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 15000
      });

      // Update states
      setSubscribed(false);
      setSubscriptionStatus("Free");
      setSelectedPlan("");
      setSubscriptionData({});

      // Update user with new structure
      const updatedUser = { 
        ...user, 
        subscriptionStatus: "Free",
        hasActiveSubscription: false
      };
      delete updatedUser.activeSubscriptionId;
      
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setSuccess("Subscription cancelled successfully.");
      
    } catch (error) {
      console.error("Cancellation failed:", error);
      const errorMessage = error.response?.data?.message || "Cancellation failed. Please try again.";
      setError(errorMessage);
    }
  };

  const genres = useMemo(() => {
    const uniqueGenres = new Set();
    movies.forEach((movie) => {
      if (movie.genre) {
        uniqueGenres.add(movie.genre);
      }
    });
    return Array.from(uniqueGenres).sort();
  }, [movies]);

  const handleGenreChange = (e) => {
    setGenre(e.target.value);
  };

  const handleSaveGenre = async () => {
    if (!user._id) {
      setError("User not found. Please log in again.");
      return;
    }

    setIsSavingGenre(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/api/set-preferred-genre`, {
        userId: user._id,
        genre,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 15000
      });

      const updatedUser = { ...user, preferredGenre: genre };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      // Update context if available
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setSuccess("Preferred genre saved successfully!");
    } catch (error) {
      console.error("Failed to set preferred genre:", error);
      const errorMessage = error.response?.data?.message || "Failed to save preferred genre. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSavingGenre(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case "Premium":
        return "text-success";
      case "Expired":
        return "text-danger";
      default:
        return "text-warning";
    }
  };

  const getSubscriptionIcon = (status) => {
    switch (status) {
      case "Premium":
        return faCheckCircle;
      case "Expired":
        return faExclamationTriangle;
      default:
        return faTimes;
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: 'var(--accent-color)' }} />
            <p className="mt-3" style={{ color: 'var(--primary-text)' }}>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user._id) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          No user data found. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Success Message */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          {success}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Support the Creator Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card shadow-sm border-0"
            style={{ 
              backgroundColor: 'var(--secondary-bg)',
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(238, 90, 36, 0.1))',
              border: '2px solid var(--accent-color)'
            }}
          >
            <div className="card-body text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <FontAwesomeIcon 
                  icon={faCoffee} 
                  size="2x" 
                  className="me-3"
                  style={{ color: '#FF813F' }}
                />
                <div>
                  <h4 className="mb-1" style={{ color: 'var(--primary-text)' }}>
                    Enjoying Flixxit?
                  </h4>
                  <p className="mb-0 text-muted">Support the creator and help keep this platform running!</p>
                </div>
              </div>
              
              <div className="row justify-content-center">
                <div className="col-md-8">
                  <p className="small mb-3" style={{ color: 'var(--secondary-text)' }}>
                    Your support helps me maintain the servers, add new features, and keep Flixxit free for everyone. 
                    Every coffee counts! ☕
                  </p>
                  
                  <a 
                    href="https://coff.ee/nimoh" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-lg px-4 py-2 me-3"
                    style={{ 
                      background: 'linear-gradient(45deg, #FF813F, #FF6B35)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '50px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 15px rgba(255, 129, 63, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(255, 129, 63, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(255, 129, 63, 0.3)';
                    }}
                  >
                    <FontAwesomeIcon icon={faCoffee} className="me-2" />
                    Buy Me a Coffee
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ms-2" size="sm" />
                  </a>
                  
                  <button 
                    className="btn btn-outline-secondary px-3 py-2"
                    style={{ 
                      borderRadius: '50px',
                      borderColor: 'var(--border-color)',
                      color: 'var(--secondary-text)'
                    }}
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({
                            title: 'Support Flixxit Creator',
                            text: 'Help support the creator of Flixxit by buying them a coffee!',
                            url: 'https://coff.ee/nimoh'
                          });
                        } else {
                          await navigator.clipboard.writeText('https://coff.ee/nimoh');
                          setSuccess('Support link copied to clipboard!');
                        }
                      } catch (error) {
                        console.error('Share failed:', error);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faGift} className="me-2" />
                    Share
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <small className="text-muted">
                  <FontAwesomeIcon icon={faHeart} className="me-1" style={{ color: '#e74c3c' }} />
                  Made with love by the Flixxit team
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card shadow-sm border-0"
            style={{ 
              backgroundColor: 'var(--secondary-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="card-header bg-transparent border-0 py-3">
              <h2 className="mb-0 d-flex align-items-center" style={{ color: 'var(--primary-text)' }}>
                <FontAwesomeIcon icon={faUser} className="me-3" style={{ color: 'var(--accent-color)' }} />
                User Profile
              </h2>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold" style={{ color: 'var(--primary-text)' }}>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={user.username || 'N/A'}
                    readOnly
                    style={{
                      backgroundColor: 'var(--primary-bg)',
                      color: 'var(--primary-text)',
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold" style={{ color: 'var(--primary-text)' }}>
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={user.email || 'N/A'}
                    readOnly
                    style={{
                      backgroundColor: 'var(--primary-bg)',
                      color: 'var(--primary-text)',
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Subscription Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card shadow-sm border-0"
            style={{ 
              backgroundColor: 'var(--secondary-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="card-header bg-transparent border-0 py-3">
              <h3 className="mb-0 d-flex align-items-center" style={{ color: 'var(--primary-text)' }}>
                <FontAwesomeIcon icon={faCrown} className="me-3" style={{ color: 'var(--accent-color)' }} />
                Subscription Status
              </h3>
            </div>
            <div className="card-body">
              {subscriptionStatus === "Premium" ? (
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <FontAwesomeIcon 
                      icon={getSubscriptionIcon(subscriptionStatus)} 
                      className={getSubscriptionStatusColor(subscriptionStatus) + " me-3"} 
                      size="lg" 
                    />
                    <div>
                      <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Premium Member</h5>
                      <p className="mb-0 text-muted">Plan: {selectedPlan || 'Premium'}</p>
                    </div>
                  </div>
                  
                  {/* Subscription Details */}
                  {subscriptionData.expirationDate && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-muted" />
                          <span style={{ color: 'var(--primary-text)' }}>
                            <strong>Expires:</strong> {formatDate(subscriptionData.expirationDate)}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <FontAwesomeIcon icon={faClock} className="me-2 text-muted" />
                          <span style={{ color: 'var(--primary-text)' }}>
                            <strong>Days Remaining:</strong> 
                            <span className={subscriptionData.daysRemaining <= 7 ? 'text-warning ms-1' : 'text-success ms-1'}>
                              {subscriptionData.daysRemaining || 0} days
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expiration Warning */}
                  {subscriptionData.daysRemaining <= 7 && subscriptionData.daysRemaining > 0 && (
                    <div className="alert alert-warning mt-3" role="alert">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      <strong>Subscription Expiring Soon!</strong> Your subscription will expire in {subscriptionData.daysRemaining} day(s). 
                      Consider renewing to continue enjoying premium features.
                    </div>
                  )}

                  {/* Cancel Subscription Button */}
                  <div className="mt-3">
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel your subscription?')) {
                          handleCancelSubscription();
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              ) : subscriptionStatus === "Expired" ? (
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <FontAwesomeIcon 
                      icon={getSubscriptionIcon(subscriptionStatus)} 
                      className={getSubscriptionStatusColor(subscriptionStatus) + " me-3"} 
                      size="lg" 
                    />
                    <div>
                      <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Subscription Expired</h5>
                      <p className="mb-0 text-muted">Previous Plan: {subscriptionData.plan || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="alert alert-danger" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    <strong>Subscription Expired!</strong> Your subscription expired on {formatDate(subscriptionData.expirationDate)}. 
                    Renew now to regain access to premium features.
                  </div>
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <FontAwesomeIcon icon={faTimes} className="text-warning me-3" size="lg" />
                    <div>
                      <h5 className="mb-1" style={{ color: 'var(--primary-text)' }}>Free Member</h5>
                      <p className="mb-0 text-muted">Choose a plan below to unlock Premium features</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Plans - Always show for Free members */}
              {((subscriptionStatus === "Free" || subscriptionStatus === "Expired" || subscriptionStatus === null) || 
                (subscriptionStatus === "Premium" && subscriptionData.daysRemaining && subscriptionData.daysRemaining <= 7)) && 
                Object.keys(subscriptionOptions).length > 0 && (
                <div className="mt-4 subscription-plans">
                  <h6 className="mb-3" style={{ color: 'var(--primary-text)' }}>
                    {subscriptionStatus === "Premium" ? "Extend Subscription:" : "Choose Your Plan:"}
                  </h6>
                  
                  {/* Premium Benefits Section for Free Users */}
                  {(subscriptionStatus === "Free" || subscriptionStatus === "Expired" || subscriptionStatus === null) && (
                    <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--primary-bg)', border: '1px solid var(--border-color)' }}>
                      <h6 className="mb-2" style={{ color: 'var(--accent-color)' }}>
                        <FontAwesomeIcon icon={faCrown} className="me-2" />
                        Premium Benefits:
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <ul className="list-unstyled mb-0" style={{ color: 'var(--primary-text)' }}>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Personalized movie recommendations
                            </li>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Save preferred genres
                            </li>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Priority customer support
                            </li>
                          </ul>
                        </div>
                        <div className="col-md-6">
                          <ul className="list-unstyled mb-0" style={{ color: 'var(--primary-text)' }}>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Ad-free experience
                            </li>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Early access to new features
                            </li>
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                              Advanced filtering options
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="row">
                    {Object.entries(subscriptionOptions).map(([option, details]) => (
                      <div key={option} className="col-lg-3 col-md-6 mb-3">
                        <div 
                          className="card h-100 border position-relative subscription-plan-card"
                          style={{ 
                            backgroundColor: 'var(--primary-bg)',
                            borderColor: option === 'yearly' ? 'var(--accent-color)' : 'var(--border-color)',
                            borderWidth: option === 'yearly' ? '2px' : '1px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {option === 'yearly' && (
                            <div 
                              className="position-absolute top-0 start-50 translate-middle"
                              style={{
                                backgroundColor: 'var(--accent-color)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              BEST VALUE
                            </div>
                          )}
                          
                          {/* Popular badge for monthly plan for free users */}
                          {option === 'monthly' && (subscriptionStatus === "Free" || subscriptionStatus === "Expired" || subscriptionStatus === null) && (
                            <div 
                              className="position-absolute top-0 end-0 m-2"
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}
                            >
                              POPULAR
                            </div>
                          )}
                          
                          <div className="card-body text-center">
                            <h6 className="card-title text-capitalize fw-bold" style={{ color: 'var(--primary-text)' }}>
                              {option} Plan
                            </h6>
                            <p className="card-text">
                              <span className="h4 fw-bold" style={{ color: 'var(--accent-color)' }}>
                                ${details.cost}
                              </span>
                              <br />
                              <small className="text-muted">{details.duration}</small>
                              
                              {/* Price per month calculation */}
                              {option !== 'monthly' && (
                                <div>
                                  <small className="text-muted d-block">
                                    ${(details.cost / (details.days / 30)).toFixed(2)}/month
                                  </small>
                                </div>
                              )}
                              
                              {option === 'yearly' && subscriptionOptions.monthly && (
                                <div>
                                  <small className="text-success d-block fw-bold">
                                    Save ${(subscriptionOptions.monthly.cost * 12) - details.cost}!
                                  </small>
                                </div>
                              )}
                            </p>
                            
                            <button 
                              className="btn w-100 fw-bold"
                              onClick={() => handleSubscribe(option)}
                              disabled={isSubscribing}
                              style={{ 
                                backgroundColor: option === 'yearly' ? 'var(--accent-color)' : 
                                               option === 'monthly' ? '#28a745' : '#dc3545',
                                border: 'none',
                                color: 'white',
                                fontWeight: '600',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                              }}
                            >
                              {isSubscribing ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  {subscriptionStatus === "Premium" ? (
                                    <>
                                      <FontAwesomeIcon icon={faClock} className="me-2" />
                                      Extend Plan
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faCrown} className="me-2" />
                                      Get {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      {subscriptionStatus === "Premium" && (
        <>
          {/* Preferred Genre Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div 
                className="card shadow-sm border-0"
                style={{ 
                  backgroundColor: 'var(--secondary-bg)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="card-header bg-transparent border-0 py-3">
                  <h4 className="mb-0 d-flex align-items-center" style={{ color: 'var(--primary-text)' }}>
                    <FontAwesomeIcon icon={faHeart} className="me-3" style={{ color: 'var(--accent-color)' }} />
                    Preferred Genre
                  </h4>
                </div>
                <div className="card-body">
                  <div className="row align-items-end">
                    <div className="col-md-8 mb-3">
                      <label className="form-label" style={{ color: 'var(--primary-text)' }}>
                        Select your favorite genre:
                      </label>
                      <select 
                        className="form-select" 
                        value={genre} 
                        onChange={handleGenreChange}
                        style={{
                          backgroundColor: 'var(--primary-bg)',
                          color: 'var(--primary-text)',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        <option value="">All Genres</option>
                        {genres.map((genreOption) => (
                          <option key={genreOption} value={genreOption}>
                            {genreOption}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-danger w-100" 
                        onClick={handleSaveGenre}
                        disabled={isSavingGenre}
                        style={{ backgroundColor: 'var(--accent-color)', border: 'none' }}
                      >
                        {isSavingGenre ? (
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        ) : null}
                        {isSavingGenre ? 'Saving...' : 'Save Genre'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Must Watch Movies Section */}
          <div className="row">
            <div className="col-12">
              <div 
                className="card shadow-sm border-0"
                style={{ 
                  backgroundColor: 'var(--secondary-bg)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="card-header bg-transparent border-0 py-3">
                  <h4 className="mb-0 d-flex align-items-center" style={{ color: 'var(--primary-text)' }}>
                    <FontAwesomeIcon icon={faFilm} className="me-3" style={{ color: 'var(--accent-color)' }} />
                    Must Watch {genre && `(${genre})`}
                  </h4>
                </div>
                <div className="card-body">
                  {mustWatchMovies.length > 0 ? (
                    <div className="row">
                      {mustWatchMovies.map((movie) => (
                        <div key={movie._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                          <Link to={`/movies/${movie._id}`} className="text-decoration-none">
                            <div 
                              className="card h-100 movie-card"
                              style={{ 
                                backgroundColor: 'var(--primary-bg)',
                                borderColor: 'var(--border-color)',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <img 
                                src={movie.imageUrl || '/placeholder-movie.jpg'} 
                                alt={movie.title}
                                className="card-img-top"
                                style={{ 
                                  height: '300px', 
                                  objectFit: 'cover',
                                  backgroundColor: 'var(--secondary-bg)'
                                }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-movie.jpg';
                                }}
                              />
                              <div className="card-body p-3">
                                <h6 
                                  className="card-title mb-2"
                                  style={{ 
                                    color: 'var(--primary-text)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.2'
                                  }}
                                >
                                  {movie.title}
                                </h6>
                                {movie.year && (
                                  <small className="text-muted">{movie.year}</small>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FontAwesomeIcon icon={faFilm} size="3x" className="text-muted mb-3" />
                      <p className="text-muted">No movies available for the selected genre.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
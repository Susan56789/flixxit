import React, { useEffect, useMemo, useState, useContext } from "react";
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
  faClock
} from "@fortawesome/free-solid-svg-icons";

const UserProfile = () => {
  const { user: contextUser } = useContext(AuthContext);
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
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSavingGenre, setIsSavingGenre] = useState(false);

  const token = getUserToken();

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

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("https://flixxit-h9fa.onrender.com/api/movies", {
          timeout: 10000
        });
        setMovies(response.data);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    const storedSubscriptionData = localStorage.getItem("flixxItSubscription");
    if (storedSubscriptionData) {
      const subscriptionData = JSON.parse(storedSubscriptionData);
      
      // Check if stored data has expiration info
      if (subscriptionData.expirationDate) {
        const isExpired = new Date() > new Date(subscriptionData.expirationDate);
        if (isExpired) {
          // Clear expired subscription from localStorage
          localStorage.removeItem("flixxItSubscription");
          setSubscribed(false);
          setSubscriptionStatus("Free");
        } else {
          setSubscribed(subscriptionData.subscribed);
          setSelectedPlan(subscriptionData.plan);
          setSubscriptionStatus(subscriptionData.status);
          setSubscriptionData(subscriptionData);
        }
      } else {
        // Old format, fetch fresh data
        fetchSubscriptionStatus();
      }
    } else {
      fetchSubscriptionStatus();
    }
  }, [user._id, token]);

  const fetchSubscriptionStatus = async () => {
    try {
      if (!user._id) return;

      const response = await axios.get("https://flixxit-h9fa.onrender.com/api/subscription-status", {
        params: { userId: user._id },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      });

      const statusData = response?.data?.subscriptionStatus || {
        status: "Free",
        subscribed: false,
        plan: "",
        expirationDate: null,
        daysRemaining: 0
      };

      setSubscriptionStatus(statusData.status);
      setSubscriptionOptions(response.data.subscriptionOptions || {});
      setSubscribed(statusData.subscribed);
      setSelectedPlan(statusData.plan);
      setSubscriptionData(statusData);

      // Update localStorage with complete subscription data
      const subscriptionData = {
        subscribed: statusData.subscribed,
        plan: statusData.plan,
        status: statusData.status,
        expirationDate: statusData.expirationDate,
        daysRemaining: statusData.daysRemaining,
        startDate: statusData.startDate
      };
      localStorage.setItem("flixxItSubscription", JSON.stringify(subscriptionData));
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      // Set default free status on error
      setSubscriptionStatus("Free");
      setSubscribed(false);
    }
  };

  useEffect(() => {
    const fetchMustWatchMovies = async () => {
      try {
        const endpoint = genre
          ? `https://flixxit-h9fa.onrender.com/api/movies/genre/${genre}`
          : "https://flixxit-h9fa.onrender.com/api/movies";
        
        const response = await axios.get(endpoint, { timeout: 10000 });
        setMustWatchMovies(response.data.slice(0, 8)); // Show more movies
      } catch (error) {
        console.error("Failed to fetch must-watch movies:", error);
        setMustWatchMovies([]);
      }
    };
    
    if (subscriptionStatus === "Premium") {
      fetchMustWatchMovies();
    }
  }, [genre, subscriptionStatus]);

  const handleSubscribe = async (subscriptionType) => {
    if (!user._id) {
      setError("User not found. Please log in again.");
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/subscribe", {
        userId: user._id,
        subscriptionType,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      });

      setSubscribed(true);
      setSelectedPlan(subscriptionType);
      setSubscriptionStatus("Premium");

      const newSubscriptionData = {
        subscribed: true,
        plan: subscriptionType,
        status: "Premium",
        expirationDate: response.data.expirationDate,
        daysRemaining: Math.ceil((new Date(response.data.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
      };

      setSubscriptionData(newSubscriptionData);

      const updatedUser = { 
        ...user, 
        subscribed: true, 
        plan: subscriptionType, 
        status: "Premium" 
      };
      setUser(updatedUser);
      localStorage.setItem("flixxItUser", JSON.stringify(updatedUser));
      localStorage.setItem("flixxItSubscription", JSON.stringify(newSubscriptionData));
      
      setError(null);
      
      // Refresh subscription status to get latest data
      setTimeout(() => fetchSubscriptionStatus(), 1000);
    } catch (error) {
      console.error("Subscription failed:", error);
      setError("Subscription failed. Please try again.");
    } finally {
      setIsSubscribing(false);
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
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/set-preferred-genre", {
        userId: user._id,
        genre,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      });

      const updatedUser = { ...user, preferredGenre: genre };
      setUser(updatedUser);
      localStorage.setItem("flixxItUser", JSON.stringify(updatedUser));
      setError(null);
    } catch (error) {
      console.error("Failed to set preferred genre:", error);
      setError("Failed to save preferred genre. Please try again.");
    } finally {
      setIsSavingGenre(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
        return faCheck;
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
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Support Flixxit Creator',
                          text: 'Help support the creator of Flixxit by buying them a coffee!',
                          url: 'https://coff.ee/nimoh'
                        });
                      } else {
                        navigator.clipboard.writeText('https://coff.ee/nimoh');
                        // You could add a toast notification here
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
                      <p className="mb-0 text-muted">Plan: {selectedPlan}</p>
                    </div>
                  </div>
                  
                  {/* Subscription Details */}
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
                            {subscriptionData.daysRemaining} days
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expiration Warning */}
                  {subscriptionData.daysRemaining <= 7 && subscriptionData.daysRemaining > 0 && (
                    <div className="alert alert-warning mt-3" role="alert">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      <strong>Subscription Expiring Soon!</strong> Your subscription will expire in {subscriptionData.daysRemaining} day(s). 
                      Consider renewing to continue enjoying premium features.
                    </div>
                  )}
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
                      <p className="mb-0 text-muted">Previous Plan: {subscriptionData.plan}</p>
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
                      <p className="mb-0 text-muted">Upgrade to Premium for exclusive features</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Plans */}
              {(subscriptionStatus !== "Premium" || subscriptionData.daysRemaining <= 7) && Object.keys(subscriptionOptions).length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3" style={{ color: 'var(--primary-text)' }}>
                    {subscriptionStatus === "Premium" ? "Extend Subscription:" : "Available Plans:"}
                  </h6>
                  <div className="row">
                    {Object.entries(subscriptionOptions).map(([option, details]) => (
                      <div key={option} className="col-lg-3 col-md-6 mb-3">
                        <div 
                          className="card h-100 border position-relative"
                          style={{ 
                            backgroundColor: 'var(--primary-bg)',
                            borderColor: option === 'yearly' ? 'var(--accent-color)' : 'var(--border-color)',
                            borderWidth: option === 'yearly' ? '2px' : '1px'
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
                          <div className="card-body text-center">
                            <h6 className="card-title text-capitalize" style={{ color: 'var(--primary-text)' }}>
                              {option}
                            </h6>
                            <p className="card-text">
                              <span className="h5" style={{ color: 'var(--accent-color)' }}>
                                ${details.cost}
                              </span>
                              <br />
                              <small className="text-muted">{details.duration}</small>
                              {option === 'yearly' && (
                                <div>
                                  <small className="text-success d-block">
                                    Save ${(subscriptionOptions.monthly?.cost * 12) - details.cost}!
                                  </small>
                                </div>
                              )}
                            </p>
                            <button 
                              className="btn btn-danger w-100"
                              onClick={() => handleSubscribe(option)}
                              disabled={isSubscribing}
                              style={{ 
                                backgroundColor: option === 'yearly' ? 'var(--accent-color)' : undefined,
                                border: 'none',
                                fontWeight: '600'
                              }}
                            >
                              {isSubscribing ? (
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                              ) : null}
                              {isSubscribing ? 'Processing...' : 
                                subscriptionStatus === "Premium" ? 'Extend' : 'Subscribe'}
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
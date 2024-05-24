import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UserProfile = () => {
  const [user, setUser] = useState({});
  const [subscribed, setSubscribed] = useState(false);
  const [genre, setGenre] = useState('');
  const [mustWatchMovies, setMustWatchMovies] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState({});
  const [subscriptionOptions, setSubscriptionOptions] = useState({});
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = localStorage.getItem("flixxItUser")
          ? JSON.parse(localStorage.getItem("flixxItUser"))
          : null;
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await axios.get('https://flixxit-h9fa.onrender.com/api/subscription-status');
        setSubscriptionStatus(response.data.subscriptionStatus);
        setSubscriptionOptions(response.data.subscriptionOptions);
        setSubscribed(response.data.subscriptionStatus.subscribed);
        setSelectedPlan(response.data.subscriptionStatus.plan);

        console.log(subscriptionStatus)
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    const fetchMustWatchMovies = async () => {
      try {
        if (user && user.preferredGenre) {
          const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/genre/${user.preferredGenre}`);
          setMustWatchMovies(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch must-watch movies:', error);
      }
    };

    fetchMustWatchMovies();
  }, [user, user.preferredGenre]);

  const handleSubscribe = async (subscriptionType) => {
    try {
      const response = await axios.post('https://flixxit-h9fa.onrender.com/api/subscribe', { userId: user._id, subscriptionType });
      console.log(response.data.message);
      setSubscribed(true);
      setSelectedPlan(subscriptionType);
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleGenreChange = (e) => {
    setGenre(e.target.value);
  };

  const handleSaveGenre = async () => {
    try {
      const response = await axios.post('https://flixxit-h9fa.onrender.com/api/set-preferred-genre', { userId: user._id, genre });
      console.log(response.data.message);
    } catch (error) {
      console.error('Failed to set preferred genre:', error);
    }
  };

  return (
    <div className="container">
      {user && (
        <>
          <div className="mt-5">
            <div className="row container border my-3 p-5 rounded">
              <h2>User Profile</h2>
              <div className="mb-3 col">
                <label htmlFor="username" className="form-label">
                  Username:
                </label>
                <input
                  type="text"
                  className="form-control border-0 border-bottom"
                  id="username"
                  value={user.username}
                  readOnly
                />
              </div>
              <div className="mb-3 col">
                <label htmlFor="email" className="form-label">
                  Email:
                </label>
                <input
                  type="email"
                  className="form-control border-0 border-bottom"
                  id="email"
                  value={user.email}
                  readOnly
                />
              </div>
            </div>
            {subscribed ? (
              <div className="mb-3 col">
                <p>Subscription Status: {subscriptionStatus.status}</p>
                <p>Selected Plan: {selectedPlan}</p>
              </div>
            ) : (
              <div className="mb-3 col">
                <h4>Subscription Options</h4>
                {Object.keys(subscriptionOptions).map((option) => (
                  <div key={option}>
                    <p>
                      {option} - ${subscriptionOptions[option].cost} ({subscriptionOptions[option].duration})
                    </p>
                    <button onClick={() => handleSubscribe(option)}>Subscribe</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {subscribed && (
            <div className="mb-3">
              <h4>Preferred Genre</h4>
              <select value={genre} onChange={handleGenreChange}>
                <option value="">Select Genre</option>
                <option value="Action">Action</option>
                <option value="Comedy">Comedy</option>
                {/* Add more genre options as needed */}
              </select>
              <button className="btn btn-primary" onClick={handleSaveGenre}>Save Genre</button>
            </div>
          )}

          {subscribed && (
            <div className="mb-3">
              <h4>Must Watch</h4>
              {mustWatchMovies.length > 0 ? (
                <div className="row">
                  {mustWatchMovies.map((movie) => (
                    <div key={movie._id} className="col-md-3 mb-4">
                      <Link to={`/movies/${movie._id}`}>
                        <div className="card">
                          <img src={movie.imageUrl} alt={movie.title} className="img-fluid" />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No movies to show</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;

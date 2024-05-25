import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getUser } from "../utils/helpers";

const UserProfile = () => {
  const [user, setUser] = useState({});
  const [subscribed, setSubscribed] = useState(false);
  const [genre, setGenre] = useState("");
  const [mustWatchMovies, setMustWatchMovies] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionOptions, setSubscriptionOptions] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = getUser();
        setUser(userData);
        if (userData && userData.preferredGenre) {
          setGenre(userData.preferredGenre);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("https://flixxit-h9fa.onrender.com/api/movies");
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
      setSubscribed(subscriptionData.subscribed);
      setSelectedPlan(subscriptionData.plan);
      setSubscriptionStatus(subscriptionData.status);
    } else {
      const fetchSubscriptionStatus = async () => {
        try {
          const user = getUser();
          if (!user) return;

          const response = await axios.get("https://flixxit-h9fa.onrender.com/api/subscription-status", {
            params: { userId: user._id },
          });

          const statusData = response?.data?.subscriptionStatus || {
            status: "Free",
            subscribed: false,
            plan: "",
          };

          console.log("statusData", statusData);
          setSubscriptionStatus(statusData.status);
          setSubscriptionOptions(response.data.subscriptionOptions);
          setSubscribed(statusData.subscribed);
          setSelectedPlan(statusData.plan);

          const subscriptionData = {
            subscribed: statusData.subscribed,
            plan: statusData.plan,
            status: statusData.status,
          };
          localStorage.setItem("flixxItSubscription", JSON.stringify(subscriptionData));
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        }
      };

      const user = getUser();
      if (user && user._id) {
        fetchSubscriptionStatus();
      }
    }
  }, []);

  useEffect(() => {
    const fetchMustWatchMovies = async () => {
      try {
        const response = genre
          ? await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/genre/${genre}`)
          : await axios.get("https://flixxit-h9fa.onrender.com/api/movies");
        setMustWatchMovies(response.data.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch must-watch movies:", error);
      }
    };
    fetchMustWatchMovies();
  }, [genre]);

  const handleSubscribe = async (subscriptionType) => {
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/subscribe", {
        userId: user._id,
        subscriptionType,
      });
      console.log(response.data.message);
      setSubscribed(true);
      setSelectedPlan(subscriptionType);
      setSubscriptionStatus("Premium");

      const updatedUser = { ...user, subscribed: true, plan: subscriptionType, status: "Premium" };
      setUser(updatedUser);
      localStorage.setItem("flixxItUser", JSON.stringify(updatedUser));
      localStorage.setItem(
        "flixxItSubscription",
        JSON.stringify({ subscribed: true, plan: subscriptionType, status: "Premium" })
      );
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  };

  const genres = useMemo(() => {
    const uniqueGenres = new Set();
    movies.forEach((movie) => {
      if (movie.genre) {
        uniqueGenres.add(movie.genre);
      }
    });
    return Array.from(uniqueGenres);
  }, [movies]);

  const handleGenreChange = (e) => {
    setGenre(e.target.value);
  };

  const handleSaveGenre = async () => {
    try {
      const response = await axios.post("https://flixxit-h9fa.onrender.com/api/set-preferred-genre", {
        userId: user._id,
        genre,
      });
      console.log(response.data.message);

      const updatedUser = { ...user, preferredGenre: genre };
      setUser(updatedUser);
      localStorage.setItem("flixxItUser", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to set preferred genre:", error);
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
            {subscriptionStatus === "Premium" ? (
              <div className="mb-3 col">
                <p>Subscription Status: {subscriptionStatus}</p>
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

          {subscriptionStatus === "Premium" && (
            <>
              <div className="mb-3">
                <h4>Preferred Genre</h4>
                <select id="genre-select" className="form-select d-inline-block" value={genre} onChange={handleGenreChange}>
                  <option value="">All</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleSaveGenre}>
                  Save Genre
                </button>
              </div>

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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UserProfile = () => {
  const [user, setUser] = useState({});
  const [latestMovies, setLatestMovies] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let userData = localStorage.getItem("flixxItUser")
          ? JSON.parse(localStorage.getItem("flixxItUser"))
          : null;
        setUser(userData);

        // Fetch the latest 4 movies as recommended videos
        const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies?sort=newest&limit=4`);
        setLatestMovies(response.data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleSubscribe = () => {
    // Handle subscription logic here, e.g., redirect to subscription page
    console.log("Redirecting to subscription page...");
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
          </div>
          <div className="mb-3">
            <h4>Recommended Movies</h4>
            {latestMovies.length > 0 ? (
              <div className="row">
                {latestMovies.map((movie) => (
                  <div key={movie._id} className="col-md-3 mb-4">
                    <Link to={`/movies/${movie._id}`}>
                      <div className="card">
                        <img
                          src={movie.imageUrl}
                          alt={movie.title}
                          className="img-fluid"
                        />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>No movies to show</p>
            )}
          </div>
          <div className="mb-3">
            {user.subscriptionStatus ? (
              <h4>Subscription Status</h4>
            ) : (
              <>
                <h4>No subscription information available</h4>
                <button className="btn btn-primary" onClick={handleSubscribe}>
                  Subscribe to Premium
                </button>
              </>
            )}
            {user.subscriptionStatus && (
              <p>{user.subscriptionStatus}</p>
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default UserProfile;

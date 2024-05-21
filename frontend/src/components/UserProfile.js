import React, { useEffect, useState } from "react";
import axios from "axios";

const UserProfile = () => {
  const [user, setUser] = useState({});
  const [interactedMovies, setInteractedMovies] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let userData = localStorage.getItem("flixxItUser")
          ? JSON.parse(localStorage.getItem("flixxItUser"))
          : null;
        setUser(userData);
        if (userData && userData.interactedMovies) {
          // If user has interacted with movies, fetch details of those movies
          const response = await axios.get(`https://flixxit-h9fa.onrender.com/api/movies/interacted?userId=${userData._id}`);
          setInteractedMovies(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

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
            <h4> Recommended Movies</h4>
            {interactedMovies.length > 0 ? (
              <ul>
                {interactedMovies.map((movie) => (
                  <li key={movie._id}>{movie.title}</li>
                ))}
              </ul>
            ) : (
              <p>No movies to show</p>
            )}
          </div>
          <div className="mb-3">
            <h4>Subscription Status</h4>
            {user.subscriptionStatus ? (
              <p>{user.subscriptionStatus}</p>
            ) : (
              <p>No subscription information available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;

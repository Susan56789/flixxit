import React, { useEffect, useState } from "react";

const UserProfile = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let userData = localStorage.getItem("flixxItUser")
          ? JSON.parse(localStorage.getItem("flixxItUser"))
          : null;
        setUser(userData);
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
            <h4>Recently Viewed Videos</h4>
            {user.recentlyViewedVideos && user.recentlyViewedVideos.length > 0 ? (
              <ul>
                {user.recentlyViewedVideos.map((video, index) => (
                  <li key={index}>{video.title}</li>
                ))}
              </ul>
            ) : (
              <p>No recently viewed videos</p>
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

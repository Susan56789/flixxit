import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (id && token) {
          const response = await axios.get(`/api/user/${id}`, {
            headers: {
              'auth-token': token
            }
          });
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setError(error.message); // Update error state with error message
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>; // Display the error message
  }

  if (!user) {
    return <div>No user data found</div>;
  }

  return (
    <div className="container">
      <h2>User Profile</h2>
      <div>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username:
          </label>
          <input type="text" className="form-control" id="username" value={user.username} readOnly />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email:
          </label>
          <input type="email" className="form-control" id="email" value={user.email} readOnly />
        </div>
        <div className="mb-3">
          <h4>Recently Viewed Videos</h4>
          {/* Here goes your list of recently viewed videos */}
        </div>
        <div className="mb-3">
          <h4>Subscription Status</h4>
          {/* Here goes your subscription status or options */}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

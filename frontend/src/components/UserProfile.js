import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <div className="container">
      <h2>User Profile</h2>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfile;

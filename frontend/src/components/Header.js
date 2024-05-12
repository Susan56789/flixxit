import React from 'react';

const Header = ({ loggedIn, handleLogout }) => {
  return (
    <div className="header bg-dark text-light p-3">
      <h1>Flixxit</h1>
      {loggedIn && <button className="btn btn-danger" onClick={handleLogout}>Logout</button>}
    </div>
  );
}

export default Header;
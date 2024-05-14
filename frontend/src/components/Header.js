import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ loggedIn, handleLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#navbarExample" aria-controls="navbarExample" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <Link className="navbar-brand" to="/">
          <img src='/logo.png' alt='Flixxit' width="36" />
        </Link>
        <div className="collapse navbar-collapse" id="navbarExample">
          <ul className="navbar-nav me-auto mb-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">Home</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/about-us">About Us</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/categories">Category</Link>
            </li>
          </ul>
          <form className="d-flex" role="search">
            <input className="form-control me-2"
              type="search"
              placeholder="Search..."
              aria-label="Search" />
            <button className="btn btn-subtle" type="submit">
              <i className="fa-solid fa-magnifying-glass fa-lg"></i>
            </button>
          </form>
          <div className="d-flex align-items-center flex-column flex-lg-row">

            {!loggedIn ? (
              <div>
                <Link className="btn btn-primary me-2" to="/login">Login</Link>

              </div>
            ) : (
              <div>
                <ul className="navbar-nav me-auto mb-0">
                  <li className="nav-item">
                    <Link className="nav-link active" aria-current="page" to="/watchlist">WatchList</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link active" aria-current="page" to="/profile">My Profile</Link>
                  </li>
                </ul>
                <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;

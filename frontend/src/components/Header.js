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
          Flixxit
        </Link>
        <div className="collapse navbar-collapse" id="navbarExample">
          <ul className="navbar-nav me-auto mb-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">Home</Link>
            </li>

            <li className="nav-item dropdown">
              <Link className="nav-link dropdown-toggle" to="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">About Us</Link>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/history">History</Link></li>
                <li><Link className="dropdown-item" to="/terms">Terms & Conditions</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item" to="/help">Help</Link></li>
              </ul>
            </li>
          </ul>
          <div className="d-flex align-items-center flex-column flex-lg-row">
            <form className="me-2 mb-2 mb-lg-0">
              <input type="text" className="form-control form-control-sm" placeholder="Search" />
            </form>
            {!loggedIn ? (
              <div>
                <Link className="btn btn-primary me-2" to="/login">Login</Link>
                <Link className="btn btn-success" to="/register">Sign up</Link>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;

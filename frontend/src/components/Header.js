import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserToken } from "../utils/helpers";
import { useTheme } from "../themeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun, faBars, faSearch } from "@fortawesome/free-solid-svg-icons";

const Header = ({ handleLogout, isLoggedIn, user }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const token = getUserToken();
  const { theme, toggleTheme, isDark } = useTheme();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsNavCollapsed(true);
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search/${encodeURIComponent(trimmedQuery)}`);
      setSearchQuery("");
      setIsNavCollapsed(true);
    }
  };

  const handleNavToggle = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="container-fluid p-0" style={{ boxShadow: '0 4px 2px -2px rgba(0,0,0,0.1)' }}>
      <nav className={`navbar navbar-expand-lg ${isDark ? 'navbar-dark' : 'navbar-light'}`}
        style={{ backgroundColor: 'var(--primary-bg)', transition: 'var(--theme-transition)' }}>
        <div className="container-fluid">
          {/* Brand */}
          <Link
            className="navbar-brand fw-bold fs-3"
            to="/"
            style={{ color: 'var(--accent-color)' }}
          >
            Flixxit
          </Link>

          {/* Mobile Toggle Button */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={handleNavToggle}
            aria-controls="navbarExample"
            aria-expanded={!isNavCollapsed}
            aria-label="Toggle navigation"
            style={{ color: 'var(--primary-text)' }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* Collapsible Navigation */}
          <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarExample">
            {/* Main Navigation Links */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link
                  className={`nav-link hover-underline-animation ${isActive("/") ? "active" : ""}`}
                  to="/"
                  onClick={() => setIsNavCollapsed(true)}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link hover-underline-animation ${isActive("/about-us") ? "active" : ""}`}
                  to="/about-us"
                  onClick={() => setIsNavCollapsed(true)}
                >
                  About Us
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link hover-underline-animation ${isActive("/categories") ? "active" : ""}`}
                  to="/categories"
                  onClick={() => setIsNavCollapsed(true)}
                >
                  Category
                </Link>
              </li>
            </ul>

            {/* User Navigation */}
            <div className="d-flex align-items-center gap-2 flex-column flex-lg-row">
              {/* Show protected routes only when logged in */}
              {isLoggedIn && user ? (
                <>
                  <Link
                    className={`nav-link hover-underline-animation ${isActive("/watchlist") ? "active" : ""}`}
                    to="/watchlist"
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    WatchList
                  </Link>
                  <Link
                    className={`nav-link hover-underline-animation ${isActive("/profile") ? "active" : ""}`}
                    to="/profile"
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    My Profile
                  </Link>
                  <button
                    className="btn btn-danger hover-scale-animation px-3 py-1"
                    onClick={() => {
                      handleLogout();
                      setIsNavCollapsed(true);
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  className="btn btn-danger hover-scale-animation px-4 py-1"
                  to="/login"
                  onClick={() => setIsNavCollapsed(true)}
                >
                  Login
                </Link>
              )}

              {/* Theme Toggle Button */}
              <button
                className="btn btn-outline-secondary ms-2 d-flex align-items-center justify-content-center"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                style={{
                  width: '40px',
                  height: '40px',
                  padding: '0',
                  borderRadius: '50%',
                  borderColor: 'var(--border-color)',
                  color: 'var(--primary-text)',
                  backgroundColor: 'var(--secondary-bg)'
                }}
              >
                <FontAwesomeIcon
                  icon={isDark ? faSun : faMoon}
                  className="fa-lg"
                  style={{ color: isDark ? '#ffc107' : '#6c757d' }}
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="container-fluid py-3" style={{ backgroundColor: 'var(--secondary-bg)' }}>
        <form className="d-flex justify-content-center" onSubmit={handleSubmit}>
          <div className="input-group" style={{ maxWidth: '600px' }}>
            <input
              className="form-control rounded-start-pill border-end-0"
              type="search"
              placeholder="Search movies, TV shows..."
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                borderColor: 'var(--border-color)'
              }}
            />
            <button
              className="btn btn-outline-secondary rounded-end-pill border-start-0"
              type="submit"
              aria-label="Search"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--icon-color)'
              }}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Header;
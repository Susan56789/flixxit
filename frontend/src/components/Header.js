import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserToken } from "../utils/helpers";
import { ThemeContext } from "../themeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const Header = ({ handleLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const token = getUserToken();
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const userData = localStorage.getItem("flixxItUser")
      ? JSON.parse(localStorage.getItem("flixxItUser"))
      : null;
    setUser(userData);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search/${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <div className={`container-fluid p-0 ${theme}`} style={{ boxShadow: '0 4px 2px -2px gray' }}>
      <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}`}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Flixxit</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarExample"
            aria-controls="navbarExample"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon custom-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarExample">
            <ul className="navbar-nav me-auto mb-0">
              <li className={`nav-item ${location.pathname === "/" ? "active" : ""}`}>
                <Link className="nav-link hover-underline-animation" to="/">Home</Link>
              </li>
              <li className={`nav-item ${location.pathname === "/about-us" ? "active" : ""}`}>
                <Link className="nav-link hover-underline-animation" to="/about-us">About Us</Link>
              </li>
              <li className={`nav-item ${location.pathname === "/categories" ? "active" : ""}`}>
                <Link className="nav-link hover-underline-animation" to="/categories">Category</Link>
              </li>
            </ul>

            <div className="d-flex align-items-center flex-column flex-lg-row">
              {token && user ? (
                <ul className="navbar-nav me-auto mb-0">
                  <li className={`nav-item ${location.pathname === "/watchlist" ? "active" : ""}`}>
                    <Link className="nav-link hover-underline-animation" to="/watchlist">WatchList</Link>
                  </li>
                  <li className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}>
                    <Link className="nav-link hover-underline-animation" to="/profile">My Profile</Link>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-danger hover-scale-animation" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              ) : (
                <Link className="btn btn-danger me-2 hover-scale-animation" to="/login">Login</Link>
              )}
            </div>
            <button className="btn btn-secondary ms-3" onClick={toggleTheme}>
              {theme === 'light' ? <FontAwesomeIcon icon={faMoon} /> : <FontAwesomeIcon icon={faSun} />}
            </button>
          </div>
        </div>
      </nav>
      <form className="d-flex justify-content-center my-3" onSubmit={handleSubmit}>
        <div className="row w-100">
          <div className="col-9 col-md-10">
            <input
              className="form-control form-control-sm me-2 rounded-pill w-100"
              type="search"
              placeholder="Search..."
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-3 col-md-2 d-flex justify-content-center">
            <button className="btn btn-subtle" type="submit" aria-label="Search">
              <i className="fa-solid fa-magnifying-glass fa-lg"></i>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Header;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserToken } from "../utils/helpers";

const Header = ({ loggedIn, handleLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [logIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  const token = getUserToken()

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate("/search-page", { state: { query: searchQuery } });
    }
  };

  useEffect(() => {
    const getUser = () => {
      let userData = localStorage.getItem("flixxItUser")
        ? JSON.parse(localStorage.getItem("flixxItUser"))
        : null;
      setUser(userData);
    };

    getUser();
  }, []); // Run effect only once

  useEffect(() => {
    if (token) {
      setLoggedIn(true)
    } else {
      setLoggedIn(false)
    }

  }, [token]); // Run effect only once



  return (
    <div className="container">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarExample"
            aria-controls="navbarExample"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <a className="navbar-brand" href="/">
            <img src="/logo.png" alt="Flixxit" width="36" />
          </a>
          <div className="collapse navbar-collapse" id="navbarExample">
            <ul className="navbar-nav me-auto mb-0">
              <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="/">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link active"
                  aria-current="page"
                  href="/about-us"
                >
                  About Us
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link active"
                  aria-current="page"
                  href="/categories"
                >
                  Category
                </a>
              </li>
            </ul>

            <div className="d-flex align-items-center flex-column flex-lg-row">
              {!logIn ? (
                <div>
                  <a className="btn btn-primary me-2" href="/login">
                    Login
                  </a>
                </div>
              ) : (
                <div>
                  <ul className="navbar-nav me-auto mb-0">
                    <li className="nav-item">
                      <a
                        className="nav-link active"
                        aria-current="page"
                        href="/watchlist"
                      >
                        WatchList
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className="nav-link active"
                        aria-current="page"
                        href="/profile"
                      >
                        My Profile
                      </a>
                    </li>
                    <li className="nav-item">
                      <button className="btn btn-danger" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <form
        className="d-flex justify-content-center my-3"
        onSubmit={handleSubmit}
      >
        <input
          className="form-control form-control-sm me-2 rounded-pill"
          type="search"
          placeholder="Search..."
          aria-label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn btn-subtle" type="submit">
          <i className="fa-solid fa-magnifying-glass fa-lg"></i>
        </button>
      </form>
    </div>
  );
};

export default Header;

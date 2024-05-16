import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MovieDetailPage from './components/MovieDetailPage';
import AboutUs from './components/AboutUs';
import MovieCategories from './components/MovieCategories';
import WatchList from './components/WatchList';
import UserProfile from './components/UserProfile';

const Routers = ({ loggedIn, handleLogout, handleLogin, handleRegister, handleSearch, userId }) => {
    return (
        <div className="App">
            <Header loggedIn={loggedIn} handleLogout={handleLogout} handleSearch={handleSearch} />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterForm handleRegister={handleRegister} />} />
                <Route path="/movies/:id" element={<MovieDetailPage />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/categories" element={<MovieCategories handleSearch={handleSearch} />} />
                <Route path="/watchlist" element={<WatchList />} />
                {/* Pass userId as a prop to UserProfile */}
                <Route path="/profile/:id" element={<UserProfile userId={userId} />} />
            </Routes>
        </div>
    );
};

export default Routers;

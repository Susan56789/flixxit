import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MovieDetailPage from './components/MovieDetailPage';

const Routers = ({ loggedIn, handleLogout, handleLogin, handleRegister }) => {
    return (
        <Router>
            <div className="App">
                <Header loggedIn={loggedIn} handleLogout={handleLogout} />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
                    <Route path="/register" element={<RegisterForm handleRegister={handleRegister} />} />
                    <Route path="/movies/:id" element={<MovieDetailPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default Routers;

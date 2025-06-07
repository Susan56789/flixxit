import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import MovieDetailPage from "./components/MovieDetailPage";
import AboutUs from "./components/AboutUs";
import MovieCategories from "./components/MovieCategories";
import WatchList from "./components/WatchList";
import UserProfile from "./components/UserProfile";
import SearchResults from "./components/SearchResults";
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminLogin from "./components/Admin/AdminLogin";
import PasswordReset from "./components/PasswordReset";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from './AuthContext';
import Footer from "./components/Footer";
import NotFound from "./components/NotFound"; 
import { Helmet } from 'react-helmet-async';

// SEO Route Wrapper Component
const SEORoute = ({ title, description, children, canonicalPath = "" }) => {
  const baseUrl = "https://flixxit-five.vercel.app";
  const fullUrl = `${baseUrl}${canonicalPath}`;
  
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={fullUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullUrl} />
      </Helmet>
      {children}
    </>
  );
};

const AllRouters = ({
  handleRegister,
  handleSearch,
  handleLike,
  handleDislike,
  isAdmin,
  handleLogin,
  handleLogout
}) => {
  const { isLoggedIn, user } = useContext(AuthContext);

  return (
    <div className="App">
      {/* Pass isLoggedIn to Header */}
      <Header 
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        user={user}
      />
      <div className="main">
        <Routes>
          {/* Home Page - SEO Optimized */}
          <Route 
            path="/" 
            element={
              <SEORoute 
                title="Flixxit - Stream Movies Online | Best Movie Platform"
                description="Discover and stream your favorite movies on Flixxit. Unlimited access to thousands of movies, create watchlists, and enjoy HD streaming."
                canonicalPath="/"
              >
                <HomePage />
              </SEORoute>
            } 
          />

          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={
              <SEORoute 
                title="Login to Flixxit | Access Your Movie Account"
                description="Sign in to your Flixxit account to access your watchlist, continue watching, and discover new movies."
                canonicalPath="/login"
              >
                <LoginForm handleLogin={handleLogin} />
              </SEORoute>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <SEORoute 
                title="Sign Up for Flixxit | Create Your Movie Account"
                description="Join Flixxit today! Create your free account to build movie watchlists, rate films, and discover your next favorite movie."
                canonicalPath="/register"
              >
                <RegisterForm handleRegister={handleRegister} />
              </SEORoute>
            } 
          />

          <Route 
            path="/reset-password" 
            element={
              <SEORoute 
                title="Reset Password - Flixxit | Recover Your Account"
                description="Reset your Flixxit account password. Enter your email to receive password reset instructions."
                canonicalPath="/reset-password"
              >
                <PasswordReset />
              </SEORoute>
            } 
          />

          {/* Movie Routes - SEO Friendly URLs */}
          <Route 
            path="/movie/:id" 
            element={
              <MovieDetailPage handleLike={handleLike} handleDislike={handleDislike} />
            } 
          />
          <Route 
            path="/movies/:id" 
            element={
              <MovieDetailPage handleLike={handleLike} handleDislike={handleDislike} />
            } 
          />
          <Route 
            path="/watch/:id" 
            element={
              <MovieDetailPage handleLike={handleLike} handleDislike={handleDislike} />
            } 
          />

          {/* Browse & Discovery Routes */}
          <Route 
            path="/movies" 
            element={
              <SEORoute 
                title="Browse Movies - Flixxit | Discover Your Next Favorite Film"
                description="Browse our extensive collection of movies. Filter by genre, year, rating and discover your next favorite film to watch on Flixxit."
                canonicalPath="/movies"
              >
                <MovieCategories />
              </SEORoute>
            } 
          />
          
          <Route 
            path="/browse" 
            element={
              <SEORoute 
                title="Browse Movies - Flixxit | Discover Your Next Favorite Film"
                description="Browse our extensive collection of movies. Filter by genre, year, rating and discover your next favorite film to watch on Flixxit."
                canonicalPath="/browse"
              >
                <MovieCategories />
              </SEORoute>
            } 
          />

          <Route 
            path="/categories" 
            element={
              <SEORoute 
                title="Movie Categories - Flixxit | Browse by Genre"
                description="Explore movies by categories and genres on Flixxit. Find action, comedy, drama, horror, and more movie genres."
                canonicalPath="/categories"
              >
                <MovieCategories />
              </SEORoute>
            } 
          />

          <Route 
            path="/genres" 
            element={
              <SEORoute 
                title="Movie Genres - Flixxit | Find Movies by Genre"
                description="Discover movies by genre on Flixxit. Browse action, comedy, drama, thriller, horror, and all your favorite movie genres."
                canonicalPath="/genres"
              >
                <MovieCategories />
              </SEORoute>
            } 
          />

          {/* Search Routes */}
          <Route 
            path="/search/:query" 
            element={
              <SEORoute 
                title="Search Results - Flixxit | Find Your Movies"
                description="Search results for movies on Flixxit. Find your favorite films and discover new movies to watch."
                canonicalPath="/search"
              >
                <SearchResults />
              </SEORoute>
            } 
          />
          
          <Route 
            path="/search" 
            element={
              <SEORoute 
                title="Search Movies - Flixxit | Find Any Movie"
                description="Search for any movie on Flixxit. Use our powerful search to find movies by title, actor, director, or genre."
                canonicalPath="/search"
              >
                <SearchResults />
              </SEORoute>
            } 
          />

          {/* User Account Routes */}
          <Route 
            path="/watchlist" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SEORoute 
                  title="My Watchlist - Flixxit | Movies to Watch Later"
                  description="Manage your personal movie watchlist on Flixxit. Keep track of movies you want to watch later and never miss a great film."
                  canonicalPath="/watchlist"
                >
                  <WatchList user={user} />
                </SEORoute>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/my-list" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SEORoute 
                  title="My List - Flixxit | Your Saved Movies"
                  description="View your saved movies and watchlist on Flixxit. Manage your personal collection of movies to watch."
                  canonicalPath="/my-list"
                >
                  <WatchList user={user} />
                </SEORoute>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SEORoute 
                  title="My Profile - Flixxit | Account Settings"
                  description="Manage your Flixxit profile and account settings. Update your preferences and view your movie activity."
                  canonicalPath="/profile"
                >
                  <UserProfile user={user} />
                </SEORoute>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/account" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SEORoute 
                  title="Account Settings - Flixxit | Manage Your Profile"
                  description="Manage your Flixxit account settings, preferences, and personal information."
                  canonicalPath="/account"
                >
                  <UserProfile user={user} />
                </SEORoute>
              </ProtectedRoute>
            } 
          />

          {/* Information Pages */}
          <Route 
            path="/about" 
            element={<AboutUs />} 
          />
          <Route 
            path="/about-us" 
            element={<AboutUs />} 
          />

          <Route 
            path="/help" 
            element={
              <SEORoute 
                title="Help Center - Flixxit | Support & FAQ"
                description="Get help with Flixxit. Find answers to frequently asked questions and contact our support team."
                canonicalPath="/help"
              >
                <AboutUs />
              </SEORoute>
            } 
          />

          <Route 
            path="/support" 
            element={
              <SEORoute 
                title="Customer Support - Flixxit | Get Help"
                description="Contact Flixxit customer support for assistance with your account, streaming issues, or any questions."
                canonicalPath="/support"
              >
                <AboutUs />
              </SEORoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={
              <SEORoute 
                title="Admin Login - Flixxit | Administrative Access"
                description="Administrative login for Flixxit platform management."
                canonicalPath="/admin/login"
              >
                <AdminLogin />
              </SEORoute>
            } 
          />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <SEORoute 
                title="Admin Dashboard - Flixxit | Platform Management"
                description="Flixxit administrative dashboard for platform management and analytics."
                canonicalPath="/admin/dashboard"
              >
                <AdminDashboard />
              </SEORoute>
            } 
          />

          {/* 404 Not Found - Must be last */}
          <Route 
            path="*" 
            element={<NotFound />} 
          />
        </Routes>
      </div>
      <div className="footer">
        <Footer />
      </div>
    </div>
  );
};

export default AllRouters;
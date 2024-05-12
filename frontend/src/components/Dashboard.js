import React from 'react';
import MovieForm from './MovieForm';
import MovieList from './MovieList';

const Dashboard = ({ user, movies, addMovie }) => {
  return (
    <div className="container">
      <h2>Welcome, {user.username}!</h2>
      <MovieForm handleSubmit={addMovie} />
      <MovieList movies={movies} />
    </div>
  );
}

export default Dashboard;

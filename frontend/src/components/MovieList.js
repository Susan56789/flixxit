import React from 'react';
import MovieItem from './MovieItem';

const MovieList = ({ movies }) => {
  return (
    <div className="container">
      <h2>Movies</h2>
      <div className="row">
        {movies.map(movie => (
          <MovieItem key={movie._id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

export default MovieList;

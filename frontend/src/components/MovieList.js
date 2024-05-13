// frontend/src/components/MovieList.js
import React from 'react';
import { Link } from 'react-router-dom';
import MovieItem from './MovieItem';

const MovieList = ({ movies }) => {
  return (
    <div className="row row-cols-1 row-cols-md-3 g-4">
      {movies.map(movie => (
        <div key={movie._id} className="col">
          <Link to={`/movies/${movie._id}`}>
            <MovieItem movie={movie} />
          </Link>
        </div>
      ))}
    </div>
  );
}

export default MovieList;

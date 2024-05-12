import React from 'react';

const MovieItem = ({ movie }) => {
  return (
    <div className="col-md-4 mb-3">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{movie.title}</h5>
          <p className="card-text">{movie.description}</p>
          <p className="card-text">{movie.genre}</p>
          <p className="card-text">{movie.rating}</p>
          <p className="card-text">{movie.year}</p>
        </div>
      </div>
    </div>
  );
}

export default MovieItem;

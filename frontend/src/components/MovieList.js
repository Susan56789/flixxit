import React from 'react';

const MovieList = ({ movies }) => {
  // Check if movies is not an array
  if (!Array.isArray(movies)) {
    return <p>No movies available</p>;
  }

  return (
    <div className="row">
      {movies.map(movie => (
        <div className="col-md-4 mb-3" key={movie._id}>
          <div className="card">
            <img src={movie.image} className="card-img-top" alt={movie.title} />
            <div className="card-body">
              <h5 className="card-title">{movie.title}</h5>
              <p className="card-text">{movie.description}</p>
              <p className="card-text">Rating: {movie.rating}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default MovieList;

import React from 'react';
import { Link } from 'react-router-dom';

const MovieList = ({ movies, type }) => {
  const backgroundColor = () => {
    switch (type) {
      case 'newArrivals':
        return '#f0f0f0';
      case 'mostPopular':
        return '#f5f5f5';
      case 'recommended':
        return '#fafafa';
      default:
        return '#fff';
    }
  };

  return (
    <div className="row" style={{ backgroundColor: backgroundColor(), padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
      {movies.map((movie, index) => (
        <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
          <Link to={`/movie/${movie._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card h-100">
              <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
              <div className="card-body d-flex flex-column justify-content-between">
                <h5 className="card-title mb-0">{movie.title}</h5>
                <p className="card-text mb-3" style={{ minHeight: '50px' }}>{movie.description.substring(0, 50)}...</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-star text-warning"></i> {movie.rating}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default MovieList;

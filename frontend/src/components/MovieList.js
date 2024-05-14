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
      {Array.isArray(movies) && movies.length > 0 ? (
        movies.map((movie, index) => (
          <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
            <Link to={`/movies/${movie._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card h-100">
                <div className="card-header d-flex align-items-center">

                  <div className="ms-3">
                    <h6 className="mb-0 fs-sm">{movie.title}</h6>
                    <span className="text-muted fs-sm">{movie.year}</span>
                  </div>
                  <div className="dropstart ms-auto">


                  </div>
                </div>
                <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
                <div className="card-body">
                  {/* <p className="card-text">
                    {movie.description.substring(0, 50)}...
                  </p> */}
                </div>
                <div className="card-footer d-flex">
                  <button className="btn btn-subtle" type="button"><i className="fas fa-heart fa-lg"></i></button>
                  <button className="btn btn-subtle" type="button"><i className="fas fa-share fa-lg"></i></button>
                </div>
              </div>
            </Link>
          </div>
        ))
      ) : (
        <p>No movies found</p>
      )}
    </div>
  );
}

export default MovieList;

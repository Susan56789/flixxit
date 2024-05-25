import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const SearchResults = () => {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchQuery = location.state?.query || "";

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://flixxit-h9fa.onrender.com/api/movies/search', {
          params: { query: searchQuery }
        });
        setMovies(response.data);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError('An error occurred while fetching the movies.');
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchMovies();
    }
  }, [searchQuery]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Search Results</h1>
      {movies.length > 0 ? (
        <ul>
          {movies.map((movie) => (
            <li key={movie._id}>
              <h2>{movie.title}</h2>
              <p>{movie.description}</p>
              <p>Likes: {movie.likeCount}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No movies found for your search.</p>
      )}
    </div>
  );
};

export default SearchResults;

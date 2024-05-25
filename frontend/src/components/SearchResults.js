import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import MovieList from "./MovieList";

const SearchResults = () => {
  const { query } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://flixxit-h9fa.onrender.com/api/search', {
          params: { query }
        });
        setMovies(response.data);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError('An error occurred while fetching the movies.');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchMovies();
    }
  }, [query]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Search Results</h1>
      {movies.length > 0 ? (
        <MovieList movies={movies} />
      ) : (
        <p>No movies found for your search.</p>
      )}
    </div>
  );
};

export default SearchResults;

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MovieList from "./MovieList";

const SearchResults = ({ handleSearch }) => {
  const location = useLocation();
  const state = location.state || {};
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState(state.query || "");
  const [error, setError] = useState("");

  useEffect(() => {
    const searcher = async (query) => {
      try {
        const data = await handleSearch(query);
        setResults(data);
        setError(""); // Clear any previous errors
      } catch (error) {
        setResults([]); // Clear results if there was an error
        setError("An error occurred while fetching search results. Please try again.");
      }
    };

    if (query) {
      searcher(query);
    }
  }, [query, handleSearch]);

  if (!query) {
    return (
      <div className="container mt-3">
        <section>
          <h2>No search query provided</h2>
          <p>Please enter a search query to see results.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <section>
        <h2>Search Results for "{query}"</h2>
        {error ? (
          <p>{error}</p>
        ) : results.length > 0 ? (
          <MovieList movies={results} />
        ) : (
          <p>No results found for your search query.</p>
        )}
      </section>
    </div>
  );
};

export default SearchResults;

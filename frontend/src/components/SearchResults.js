import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MovieList from './MovieList';

const SearchResults = ({ handleSearch }) => {
  const location = useLocation();
  const state = location.state || {};
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState(state.query || '');
  const [error, setError] = useState('');

  useEffect(() => {
    const searcher = async (searchQuery) => {
      try {
        const data = await handleSearch(searchQuery);
        setResults(data);
        setError('');
      } catch (err) {
        console.error('Error during search:', err);
        setResults([]);
        setError('An error occurred while fetching search results. Please try again.');
      }
    };

    if (query) {
      searcher(query);
    }
  }, [query, handleSearch]);

  return (
    <div className="container mt-4">
      {query ? (
        <div className="mt-4">
          <h2 className="mb-4">Search Results for "{query}"</h2>
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : results.length > 0 ? (
            <MovieList movies={results} />
          ) : (
            <p className="lead">No results found for your search query.</p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <h2 className="mb-4">No search query provided</h2>
          <p className="lead">Please enter a search query to see results.</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

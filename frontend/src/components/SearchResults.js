import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MovieList from "./MovieList";

const SearchResults = ({ handleSearch }) => {
  const location = useLocation();
  const state = location.state;
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const searcher = async (state) => {
      const searchQuery = state.query;
      setQuery(searchQuery);

      const data = await handleSearch(searchQuery);
      setResults(data);
    };

    searcher(state);
  }, [state, handleSearch]);

  if (query !== "" && state != null) {
    return (
      <div>
        <div className="container mt-3">
          <section>
            <h2>Search Results for "{query}"</h2>
            <MovieList movies={results} />
          </section>
        </div>
      </div>
    );
  }
};

export default SearchResults;

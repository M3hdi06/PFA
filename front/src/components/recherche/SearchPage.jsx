import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Recherche from '../recherche/recherche';
import Map from '../map/Map';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [filteredSpots, setFilteredSpots] = useState([]);

  const handleResultsChange = (results) => {
    setFilteredSpots(results);
  };

  return (
    <div className="search-page">
      <div className="search-page-container">
        <aside className="search-sidebar">
          <Recherche query={query} onResultsChange={handleResultsChange} />
        </aside>
        <div className="search-map">
          <Map filteredSpots={filteredSpots} />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

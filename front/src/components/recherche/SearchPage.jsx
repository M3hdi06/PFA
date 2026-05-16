import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Recherche from '../recherche/recherche';
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
        <div className="search-column search-column--left">
          <Recherche query={query} onResultsChange={handleResultsChange} />
        </div>
        <div className="search-column search-column--center">
          <h2>Contenu principal</h2>
          <p>Utilisez la zone de recherche à gauche pour chercher vos spots.</p>
          {filteredSpots.length > 0 ? (
            <div className="search-results">
              <h3>Résultats trouvés</h3>
              <ul>
                {filteredSpots.map((spot, idx) => (
                  <li key={idx}>{spot.name || spot.title || 'Spot'}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Aucun spot sélectionné pour le moment.</p>
          )}
        </div>
        <div className="search-column search-column--right">
          <h2>Informations</h2>
          <p>Cette zone peut être utilisée pour afficher des détails, des conseils ou des filtres.</p>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

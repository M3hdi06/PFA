import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API_URL from '../../config/api';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }

    const controller = new AbortController();

    const loadResults = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_URL}/api/auth/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Erreur de recherche');
        }

        setResults(data.results || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Impossible de charger les résultats.');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadResults();

    return () => controller.abort();
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-page-container">
        <div className="search-column search-column--left">
          <h2>Recherche</h2>
          <p>Recherchez par nom, email ou genre préféré.</p>
          <p className="search-page__hint">Exemple : punkrock, jazz, rap, ou #punkrock</p>
        </div>

        <div className="search-column search-column--center">
          <h2>Résultats</h2>
          <p>{query ? `Résultats pour “${query}”` : 'Entrez un terme pour commencer la recherche.'}</p>

          {loading && <p className="search-page__status">Chargement…</p>}
          {error && <p className="search-page__status search-page__status--error">{error}</p>}

          {!loading && !error && results.length > 0 && (
            <div className="search-results">
              {results.map((user) => {
                const genres = Array.isArray(user.genres) ? user.genres : [];
                const initials = (user.nom || user.email || '?').charAt(0).toUpperCase();

                return (
                  <article key={user.id || user._id} className="search-result-card">
                    <div className="search-result-card__header">
                      <div className="search-result-card__avatar">{initials}</div>
                      <div>
                        <h3>{user.nom || 'Compte'}</h3>
                        <p>{user.email}</p>
                      </div>
                    </div>

                    <div className="search-result-card__meta">
                      <span className="search-result-card__pill">{user.role || 'Browser'}</span>
                      {user.groupStatus && <span className="search-result-card__pill">{user.groupStatus}</span>}
                    </div>

                    {genres.length > 0 && (
                      <div className="search-result-card__tags">
                        {genres.map((genre) => (
                          <span key={genre} className="search-result-card__tag">#{genre}</span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && query && results.length === 0 && (
            <p className="search-page__empty">Aucun compte ne correspond à cette recherche.</p>
          )}
        </div>

        <div className="search-column search-column--right">
          <h2>Astuce</h2>
          <p>La recherche trouve aussi les profils dont le genre préféré correspond au mot-clé tapé.</p>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

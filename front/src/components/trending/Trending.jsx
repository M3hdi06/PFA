import React, { useState, useEffect } from "react";
import "./Trending.css";
import API_URL from "../../config/api";

const Trending = () => {
  const [trendingSpots, setTrendingSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingSpots();
  }, []);

  const fetchTrendingSpots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/spots/trending/top`);
      const data = await response.json();

      if (response.ok) {
        setTrendingSpots(data.data || []);
      } else {
        setError("Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (spotId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Vous devez être connecté pour liker');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/spots/${spotId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTrendingSpots();
      } else {
        const data = await response.json();
        alert(data.message || 'Erreur');
      }
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="trending-page">
        <h1>🔥 Tendances</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-page">
        <h1>🔥 Tendances</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <h1>🔥 Top 5 des Spots les Plus Likés</h1>
      
      {trendingSpots.length === 0 ? (
        <p className="no-trending">Aucun spot liké pour le moment</p>
      ) : (
        <div className="trending-list">
          {trendingSpots.map((spot, index) => (
            <div key={spot._id} className="trending-card">
              <div className="trending-rank">#{index + 1}</div>
              <div className="trending-content">
                <h2>{spot.nom}</h2>
                <p className="trending-category">📍 {spot.category} - {spot.location}</p>
                {spot.description && <p className="trending-description">{spot.description}</p>}
                <div className="trending-stats">
                  <button 
                    className="like-btn"
                    onClick={() => handleLike(spot._id)}
                  >
                    ❤️ {spot.likesCount} {spot.likesCount > 1 ? 'likes' : 'like'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;

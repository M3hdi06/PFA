import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import { CATEGORIES } from "../../constants/categories";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Map click handler component
const MapClickHandler = ({ onMapClick, isMarkingMode }) => {
  useMapEvents({
    click: (e) => {
      if (isMarkingMode) onMapClick(e.latlng);
    },
  });
  return null;
};

const Map = React.forwardRef(({ searchQuery = "", filters = {} }, ref) => {
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [geoStatus, setGeoStatus] = useState("pending"); // pending | ok | error
  const [spots, setSpots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Restaurants' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [isMarkingMode, setIsMarkingMode] = useState(false);

  useImperativeHandle(ref, () => ({
    enableMarkingMode: () => setIsMarkingMode(true),
    disableMarkingMode: () => setIsMarkingMode(false),
  }));

  // Récupère la position de l'utilisateur si autorisée
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par ce navigateur.");
      setGeoStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoStatus("ok");
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMsg = "Impossible de récupérer la position.";
        
        if (err.code === 1) {
          errorMsg = "Veuillez autoriser la géolocalisation pour centrer la carte sur vous.";
        } else if (err.code === 2) {
          errorMsg = "Position non disponible. Vérifiez votre connexion réseau.";
        } else if (err.code === 3) {
          errorMsg = "Délai d'attente dépassé. Veuillez réessayer.";
        }
        
        setGeoError(errorMsg);
        setGeoStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Load spots from backend on mount (public data, no auth needed)
  useEffect(() => {
    fetchSpots();
  }, []);

  // Refetch spots when user changes (detected by different auth token)
  useEffect(() => {
    const checkUserAndRefetch = () => {
      const currentToken = localStorage.getItem('authToken');
      const currentUser = localStorage.getItem('user');
      
      // Store current user to detect changes
      const storedLastUser = sessionStorage.getItem('lastAuthUser');
      
      if (currentUser && currentUser !== storedLastUser) {
        sessionStorage.setItem('lastAuthUser', currentUser);
        if (currentToken) {
          fetchSpots(); // Refetch when user changes
        }
      }
    };

    // Check on component mount
    checkUserAndRefetch();

    // Also refetch periodically (every 2 seconds) to catch account switches
    const interval = setInterval(checkUserAndRefetch, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle search query - auto navigate to spot
  useEffect(() => {
    if (searchQuery && spots.length > 0) {
      const query = searchQuery.toLowerCase();
      
      // Filter spots that match the search query (in name or description)
      const matchedSpots = spots.filter(spot => {
        const name = typeof spot.name === "string"
          ? spot.name.toLowerCase()
          : "";
      
        const description = typeof spot.description === "string"
          ? spot.description.toLowerCase()
          : "";
      
        return (
          name.includes(query) ||
          description.includes(query)
        );
      });
      
      
      if (matchedSpots.length > 0) {
        let selectedSpotToShow = matchedSpots[0];
        
        // If user position available, find the closest spot to user
        if (userPosition && matchedSpots.length > 1) {
          selectedSpotToShow = matchedSpots.reduce((closest, spot) => {
            const distToClosest = Math.pow(closest.lat - userPosition.lat, 2) + 
                                 Math.pow(closest.lng - userPosition.lng, 2);
            const distToSpot = Math.pow(spot.lat - userPosition.lat, 2) + 
                              Math.pow(spot.lng - userPosition.lng, 2);
            return distToSpot < distToClosest ? spot : closest;
          });
        }
        
        setSelectedSpot(selectedSpotToShow);
        // Zoom to the spot and center map
        if (mapRef.current) {
          mapRef.current.setView([selectedSpotToShow.lat, selectedSpotToShow.lng], 14);
          // Open the popup after a short delay
          setTimeout(() => {
            if (markersRef.current[selectedSpotToShow.id]) {
              markersRef.current[selectedSpotToShow.id].openPopup();
            }
          }, 500);
        }
      }
    }
  }, [searchQuery, spots, userPosition]);

  const fetchSpots = async () => {
    try {
      // Récupérer tous les spots
      const response = await fetch('http://localhost:4000/api/spots');
      if (response.ok) {
        const data = await response.json();
        // Map _id to id and nom to name for frontend compatibility
        const spotsWithId = (data.data || []).map(spot => ({
          ...spot,
          id: spot._id,
          name: spot.nom || spot.name
        }));
        setSpots(spotsWithId);
      } else {
        console.error('Failed to fetch spots:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  };

  const handleMapClick = (latlng) => {
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
    setShowForm(true);
    setError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSpot = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Le nom du spot est requis');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Vous devez être connecté pour ajouter un spot');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: formData.name,
          description: formData.description,
          category: formData.category,
          location: 'À définir',
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add new spot to local state with normalized data
        const newSpot = { ...data.data, id: data.data._id, name: data.data.nom || data.data.name };
        setSpots(prev => [...prev, newSpot]);
        setFormData({ name: '', description: '', category: 'Restaurants' });
        setSelectedLocation(null);
        setShowForm(false);
        setError(null);
        setIsMarkingMode(false);
      } else {
        setError(data.error || 'Erreur lors de l\'ajout du spot');
      }
    } catch (error) {
      console.error('Error adding spot:', error);
      setError(`Erreur: ${error.message || 'Impossible de connecter au serveur'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedLocation(null);
    setFormData({ name: '', description: '' });
    setError(null);
    setIsMarkingMode(false);
  };

  const handleDeleteSpot = async (spotId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce spot ?')) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/spots/${spotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSpots(prev => prev.filter(s => s.id !== spotId && s._id !== spotId));
        alert('Spot supprimé avec succès!');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting spot:', error);
      alert('Erreur de connexion');
    }
  };

  const handleLikeSpot = (spotId) => {
    setSpots(prev =>
      prev.map(s =>
        s.id === spotId
          ? { 
              ...s, 
              likes: s.liked ? (s.likes > 0 ? s.likes - 1 : 0) : (s.likes == 0 ? s.likes + 1 : 1),
              liked: true
            }
          : s
      )
    );
  };

  // Centre par défaut global si pas de position utilisateur
  const center = userPosition ? [userPosition.lat, userPosition.lng] : [20, 0];

  return (
    <div className="map-screen">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={3}
        minZoom={2}
        worldCopyJump
        scrollWheelZoom
        className="map-canvas"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} isMarkingMode={isMarkingMode} />

        {userPosition && (
          <>
            <Marker position={[userPosition.lat, userPosition.lng]}>
              <Popup>Votre position actuelle</Popup>
            </Marker>
            {filters && filters.radiusEnabled !== false && typeof filters.radius === 'number' && (
              <Circle
                center={[userPosition.lat, userPosition.lng]}
                radius={filters.radius * 1000}
                pathOptions={{ color: "#2b7cff", fillOpacity: 0.08 }}
              />
            )}
          </>
        )}

        {spots.map((spot) => (
          <Marker 
            key={spot.id} 
            position={[spot.lat, spot.lng]}
            ref={(el) => {
              if (el) markersRef.current[spot.id] = el;
            }}
          >
            <Popup>
              <div className="spot-popup">
                <h3>{spot.name}</h3>
                {spot.category && <p className="spot-category">📍 {spot.category}</p>}
                {spot.createdByName && <p className="spot-creator">👤 {spot.createdByName}</p>}
                {spot.description && <p>{spot.description}</p>}

                {/* Like button */}
                <div className="spot-like">
                  <button 
                    onClick={() => handleLikeSpot(spot.id)} 
                    className={`like-btn ${spot.liked ? 'liked' : ''}`}
                  >
                    ❤️ {spot.likes || 0}
                  </button>
                </div>

                <button 
                  onClick={() => handleDeleteSpot(spot.id)}
                  className="delete-spot-btn"
                >
                  Supprimer
                </button>
              </div>
            </Popup>

          </Marker>
        ))}
      </MapContainer>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button 
          className="zoom-btn zoom-in" 
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom in"
        >
          +
        </button>
        <button 
          className="zoom-btn zoom-out" 
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom out"
        >
          −
        </button>
      </div>

      {geoError && (
        <div className="map-geo-error">
          {geoError}
        </div>
      )}

      {!geoError && geoStatus === "pending" && (
        <div className="map-geo-info">
          Autorisez la géolocalisation pour centrer la carte sur vous.
        </div>
      )}

      {/* Search Result Feedback */}
      {searchQuery && selectedSpot && (
        <div className="search-result-found">
          ✓ Spot trouvé: {selectedSpot.name}
        </div>
      )}
      
      {searchQuery && !selectedSpot && spots.length > 0 && (
        <div className="search-result-not-found">
          ✗ Aucun spot trouvé pour "{searchQuery}"
        </div>
      )}

      {/* Add Spot Form Modal */}
      {showForm && (
        <div className="spot-form-modal">
          <div className="spot-form-container">
            <div className="spot-form-header">
              <h2>Ajouter un spot</h2>
              <button className="close-btn" onClick={handleCloseForm}>✕</button>
            </div>

            {error && <div className="spot-form-error">{error}</div>}

            <form onSubmit={handleAddSpot} className="spot-form">
              <div className="form-group">
                <label htmlFor="category">Catégorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="category-select"
                  disabled={isLoading}
                >
                  {CATEGORIES.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="name">Nom du spot *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Nom du spot"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Description optionnelle"
                  disabled={isLoading}
                  rows="3"
                />
              </div>

              <div className="form-location">
                <p>📍 Latitude: {selectedLocation?.lat.toFixed(4)}</p>
                <p>📍 Longitude: {selectedLocation?.lng.toFixed(4)}</p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="btn-cancel"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Ajout en cours...' : 'Ajouter le spot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions --- visible only when marking mode is active */}
      {!showForm && isMarkingMode && (
        <div className="map-instructions">
          💡 Cliquez sur la carte pour ajouter un spot
          <button className="cancel-marking" onClick={() => setIsMarkingMode(false)} aria-label="Annuler">Annuler</button>
        </div>
      )}
    </div>
  );
});

Map.displayName = "Map";

export default Map;

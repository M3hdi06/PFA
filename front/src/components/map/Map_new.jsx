import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
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

// Créer des icônes colorées avec le nom du spot
const createCategoryIcon = (category = "", name = "") => {
  const colors = {
    café: '#8B4513',
    pâtisserie: '#FFB6C1',
    restaurant: '#FF6347',
    bar: '#9370DB',
    pizzeria: '#FFD700',
    glacier: '#87CEEB',
  };

  const iconEmojis = {
    café: '☕',
    pâtisserie: '🧁',
    restaurant: '🍽️',
    bar: '🍸',
    pizzeria: '🍕',
    glacier: '🍦',
  };

  const color = colors[category] || '#666';
  const emoji = iconEmojis[category] || '📍';
  const shortName = name.length > 15 ? name.substring(0, 12) + '...' : name;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 8px;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        white-space: nowrap;
        font-weight: bold;
        font-family: Arial, sans-serif;
      ">
        <span style="font-size: 16px;">${emoji}</span>
        <span style="font-size: 11px; max-width: 60px; overflow: hidden; text-overflow: ellipsis;">${shortName}</span>
      </div>
    `,
    iconSize: [120, 28],
    iconAnchor: [60, 28],
    popupAnchor: [0, -28],
  });
};

// Map click handler component
const MapClickHandler = ({ onMapClick, isMarkingMode }) => {
  useMapEvents({
    click: (e) => {
      if (isMarkingMode) onMapClick(e.latlng);
    },
  });
  return null;
};

const Map = React.forwardRef(({ filteredSpots = [], searchQuery = "", filters = {} }, ref) => {
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [geoStatus, setGeoStatus] = useState("pending");
  const [center, setCenter] = useState([31.7917, -7.0926]);
  const [zoom, setZoom] = useState(6);
  const [spots, setSpots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Restaurants' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const mapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    enableMarkingMode: () => setIsMarkingMode(true),
    disableMarkingMode: () => setIsMarkingMode(false),
  }));

  // Load spots from backend on mount
  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/spots/public');
      if (response.ok) {
        const data = await response.json();
        setSpots(data.spots || []);
      } else {
        console.error('Failed to fetch spots:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  };

  // Spots statiques de fallback (si l'API ne fonctionne pas)
  const fallbackSpots = [
    // CAFÉS FES
    { id: 1, name: 'Café Medina', category: 'café', location: 'Fès', lat: 34.0626, lng: -5.0063 },
    { id: 2, name: 'Café Riad Fes', category: 'café', location: 'Fès', lat: 34.0639, lng: -5.0052 },
    { id: 3, name: 'Yakoob Café', category: 'café', location: 'Fès', lat: 34.0632, lng: -5.0065 },
    { id: 4, name: 'Clock Café', category: 'café', location: 'Fès', lat: 34.0645, lng: -5.0058 },
    { id: 5, name: 'Café Nouzha', category: 'café', location: 'Fès', lat: 34.0656, lng: -5.0072 },
    { id: 6, name: 'Café Mirage', category: 'café', location: 'Fès', lat: 34.0620, lng: -5.0075 },
    { id: 7, name: 'Al Kasr Café', category: 'café', location: 'Fès', lat: 34.0648, lng: -5.0048 },
    { id: 8, name: 'Café Fantasia', category: 'café', location: 'Fès', lat: 34.0633, lng: -5.0082 },
    { id: 9, name: 'Riad Rcif Café', category: 'café', location: 'Fès', lat: 34.0619, lng: -5.0059 },
    { id: 10, name: 'Café Timia', category: 'café', location: 'Fès', lat: 34.0644, lng: -5.0070 },
    // CAFÉS MARRAKECH
    { id: 11, name: 'Café de la Paix', category: 'café', location: 'Marrakech', lat: 31.6295, lng: -7.9811 },
    { id: 12, name: 'Café Arab', category: 'café', location: 'Marrakech', lat: 31.6263, lng: -7.9826 },
    { id: 13, name: 'Kosybar Café', category: 'café', location: 'Marrakech', lat: 31.6233, lng: -7.9809 },
    { id: 14, name: 'Terrasses Épices', category: 'café', location: 'Marrakech', lat: 31.6282, lng: -7.9825 },
    { id: 15, name: 'Mamounia Café', category: 'café', location: 'Marrakech', lat: 31.6197, lng: -7.9724 },
    // CAFÉS CASABLANCA
    { id: 16, name: 'Café Bennis', category: 'café', location: 'Casablanca', lat: 33.5731, lng: -7.5898 },
    { id: 17, name: 'Café Zaïa', category: 'café', location: 'Casablanca', lat: 33.5743, lng: -7.5921 },
    { id: 18, name: 'Rick\'s Café', category: 'café', location: 'Casablanca', lat: 33.5783, lng: -7.6155 },
    { id: 19, name: 'Café Jawhara', category: 'café', location: 'Casablanca', lat: 33.5720, lng: -7.5875 },
    { id: 20, name: 'Café Dar Beida', category: 'café', location: 'Casablanca', lat: 33.5750, lng: -7.5905 },
    // RESTAURANTS FES
    { id: 21, name: 'Dar Seffarin', category: 'restaurant', location: 'Fès', lat: 34.0605, lng: -5.0045 },
    { id: 22, name: 'Fes Palace', category: 'restaurant', location: 'Fès', lat: 34.0618, lng: -5.0095 },
    { id: 23, name: 'Palais Skhira', category: 'restaurant', location: 'Fès', lat: 34.0640, lng: -5.0060 },
    { id: 24, name: 'Dar Roumana', category: 'restaurant', location: 'Fès', lat: 34.0611, lng: -5.0078 },
    // RESTAURANTS MARRAKECH
    { id: 25, name: 'Riad Karmela', category: 'restaurant', location: 'Marrakech', lat: 31.6255, lng: -7.9810 },
    { id: 26, name: 'La Tanguia', category: 'restaurant', location: 'Marrakech', lat: 31.6275, lng: -7.9845 },
    { id: 27, name: 'Comptoir Darna', category: 'restaurant', location: 'Marrakech', lat: 31.6350, lng: -7.9750 },
    // RESTAURANTS CASABLANCA
    { id: 28, name: 'La Sqala', category: 'restaurant', location: 'Casablanca', lat: 33.5814, lng: -7.6201 },
    { id: 29, name: 'Dar Beida', category: 'restaurant', location: 'Casablanca', lat: 33.5760, lng: -7.5920 },
    // PÂTISSERIES FES
    { id: 30, name: 'Pâtisserie Al Atheer', category: 'pâtisserie', location: 'Fès', lat: 34.0652, lng: -5.0070 },
    { id: 31, name: 'Boulangerie Idrissia', category: 'pâtisserie', location: 'Fès', lat: 34.0628, lng: -5.0040 },
    { id: 32, name: 'Pâtisserie Sabah', category: 'pâtisserie', location: 'Fès', lat: 34.0615, lng: -5.0088 },
    // PÂTISSERIES MARRAKECH
    { id: 33, name: 'Pâtisserie Al Ghalia', category: 'pâtisserie', location: 'Marrakech', lat: 31.6300, lng: -7.9810 },
    { id: 34, name: 'Boulangerie Guelliz', category: 'pâtisserie', location: 'Marrakech', lat: 31.6360, lng: -7.9870 },
    // PÂTISSERIES CASABLANCA
    { id: 35, name: 'Pâtisserie Bennis', category: 'pâtisserie', location: 'Casablanca', lat: 33.5745, lng: -7.5898 },
    { id: 36, name: 'Boulangerie Anfa', category: 'pâtisserie', location: 'Casablanca', lat: 33.5790, lng: -7.6050 },
    // BARS FES
    { id: 37, name: 'Bar Andalous', category: 'bar', location: 'Fès', lat: 34.0660, lng: -5.0065 },
    { id: 38, name: 'Bar Salon', category: 'bar', location: 'Fès', lat: 34.0635, lng: -5.0050 },
    // BARS MARRAKECH
    { id: 39, name: 'Rooftop Bar', category: 'bar', location: 'Marrakech', lat: 31.6330, lng: -7.9870 },
    { id: 40, name: 'Bar & Lounge', category: 'bar', location: 'Marrakech', lat: 31.6250, lng: -7.9800 },
    // BARS CASABLANCA
    { id: 41, name: 'Glitz Lounge', category: 'bar', location: 'Casablanca', lat: 33.5800, lng: -7.6100 },
    { id: 42, name: 'Sky Bar', category: 'bar', location: 'Casablanca', lat: 33.5850, lng: -7.5950 },
    // PIZZERIAS
    { id: 43, name: 'Pizza Fes', category: 'pizzeria', location: 'Fès', lat: 34.0640, lng: -5.0075 },
    { id: 44, name: 'Pizzeria Dar', category: 'pizzeria', location: 'Marrakech', lat: 31.6320, lng: -7.9850 },
    { id: 45, name: 'Pizza Casa', category: 'pizzeria', location: 'Casablanca', lat: 33.5770, lng: -7.5900 },
    // GLACIERS
    { id: 46, name: 'Glacier Fès', category: 'glacier', location: 'Fès', lat: 34.0625, lng: -5.0055 },
    { id: 47, name: 'Glacier Medina', category: 'glacier', location: 'Marrakech', lat: 31.6270, lng: -7.9820 },
    { id: 48, name: 'Glacier Corniche', category: 'glacier', location: 'Casablanca', lat: 33.5820, lng: -7.6180 },
  ];

  // Utiliser les spots de l'API, ou les spots filtrés, ou les spots statiques en fallback
  const allSpots = spots.length > 0 ? spots : fallbackSpots;
  const spotsToDisplay = filteredSpots.length > 0 ? filteredSpots : allSpots;

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
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(12);
        setGeoStatus("ok");
      },
      (err) => {
        setGeoError(err.message || "Impossible de récupérer la position.");
        setGeoStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    const handleCenterMap = (event) => {
      const { lat, lng } = event.detail;
      setCenter([lat, lng]);
      setZoom(15);
    };

    window.addEventListener("centerMap", handleCenterMap);
    return () => window.removeEventListener("centerMap", handleCenterMap);
  }, []);

  // Gestion du clic sur la carte pour ajouter un spot
  const handleMapClick = (latlng) => {
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
    setShowForm(true);
    setError(null);
  };

  // Gestion du formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumission du formulaire d'ajout de spot
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
          name: formData.name,
          description: formData.description,
          category: formData.category,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Ajouter le nouveau spot à la liste locale
        setSpots(prev => [...prev, data.spot]);
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

  // Fermer le formulaire
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedLocation(null);
    setFormData({ name: '', description: '', category: 'Restaurants' });
    setError(null);
    setIsMarkingMode(false);
  };

  return (
    <div className="map-screen">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        minZoom={2}
        maxZoom={18}
        worldCopyJump
        scrollWheelZoom
        className="map-canvas"
        key={`${center[0]}-${center[1]}-${zoom}`}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} isMarkingMode={isMarkingMode} />

        {/* TOUS les marqueurs avec leurs noms affichés */}
        {spotsToDisplay.map((spot) => (
          <Marker 
            key={spot.id} 
            position={[spot.lat, spot.lng]}
            icon={createCategoryIcon(spot.category, spot.name)}
          >
            <Popup>
              <div className="popup-content">
                <h4>{spot.name}</h4>
                <p><strong>Catégorie:</strong> {spot.category}</p>
                <p><strong>Localisation:</strong> {spot.location}</p>
              </div>
            </Popup>
            <Tooltip permanent={false} direction="top">
              {spot.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {geoError && (
        <div className="map-geo-error">
          {geoError}
        </div>
      )}

      {/* Légende toujours visible */}
      <div className="map-legend">
        <div className="legend-title">Catégories</div>
        <div className="legend-item"><span>☕</span> Café</div>
        <div className="legend-item"><span>🧁</span> Pâtisserie</div>
        <div className="legend-item"><span>🍽️</span> Restaurant</div>
        <div className="legend-item"><span>🍸</span> Bar</div>
        <div className="legend-item"><span>🍕</span> Pizzeria</div>
        <div className="legend-item"><span>🍦</span> Glacier</div>
      </div>

      {/* Formulaire d'ajout de spot */}
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

      {/* Instructions - visible seulement quand le mode marquage est actif */}
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

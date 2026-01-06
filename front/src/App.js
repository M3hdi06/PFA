import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import Home from "./components/home/Home";
import Login from "./components/login/Login";
import Inscription from "./components/inscription/Inscription";
import Map from "./components/map/Map";
import SearchPage from "./components/recherche/SearchPage";
import AddSpotModal from "./components/AddSpotModal/AddSpotModal";
import Favorites from "./components/favorites/Favorites";
import Trending from "./components/trending/Trending";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ category: "Tous", radius: 5, radiusEnabled: true });
  const mapRef = useRef(null);
  const navigate = useNavigate();

  const handleToggle = (open) => setSidebarOpen(Boolean(open));

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Prefer showing results on the map
    navigate("/map");
  };

  const handleAddSpot = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      // D'abord naviguer vers /search pour voir la map
      navigate("/search");
      // Puis activer le mode marquage
      setTimeout(() => {
        setIsMarkingMode(true);
      }, 100);
    }
  };

  const handleSpotCreated = (spot) => {
    // Récupérer tous les spots de la map après en avoir créé un
    setIsMarkingMode(false);
    // On peut ici émettre un événement pour recharger les spots
    window.dispatchEvent(
      new CustomEvent("spotCreated", {
        detail: { spot },
      })
    );
  };

  // Écouter quand l'utilisateur clique sur la map en mode marquage
  useEffect(() => {
    const handleMapClick = (e) => {
      if (!isMarkingMode) return;

      const { lat, lng } = e.detail;
      setSelectedCoords({ lat, lng });
      setShowAddSpotModal(true);
      setIsMarkingMode(false); // Éteindre le mode marquage
    };

    window.addEventListener("mapPointSelected", handleMapClick);
    return () => window.removeEventListener("mapPointSelected", handleMapClick);
  }, [isMarkingMode]);

  const handleAddSpotClick = () => {
    navigate("/map");
    setTimeout(() => {
      if (mapRef.current && typeof mapRef.current.enableMarkingMode === "function") {
        mapRef.current.enableMarkingMode();
      }
    }, 250);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    navigate("/map");
  };

  return (
    <div className={`app layout-with-sidebar ${!sidebarOpen ? "sidebar-hidden" : ""}`}>
      <Sidebar
        open={sidebarOpen}
        onToggle={handleToggle}
        onSearch={handleSearch}
        onAddSpot={handleAddSpotClick}
        onFilterChange={handleFilterChange}
      />
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />

          {/* ✅ garder UNE seule route /search */}
          <Route path="/search" element={<SearchPage isMarkingMode={isMarkingMode} />} />

          <Route path="/map" element={<Map ref={mapRef} searchQuery={searchQuery} filters={filters} />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/trending" element={<Trending />} />
        </Routes>
      </main>

      <AddSpotModal
        isOpen={showAddSpotModal}
        onClose={() => {
          setShowAddSpotModal(false);
          setSelectedCoords(null);
          setIsMarkingMode(false);
        }}
        initialLat={selectedCoords?.lat}
        initialLng={selectedCoords?.lng}
        onSpotCreated={handleSpotCreated}
      />
    </div>
  );
}

export default App;

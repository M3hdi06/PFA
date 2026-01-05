import "./App.css";
import React, { useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import Home from "./components/home/Home";
import Login from "./components/login/Login";
import Inscription from "./components/inscription/Inscription";
import Map from "./components/map/Map";
import SearchPage from "./components/recherche/SearchPage";
import AddSpotModal from "./components/AddSpotModal/AddSpotModal";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ category: 'Tous', radius: 5, radiusEnabled: true });
  const mapRef = useRef(null);
  const navigate = useNavigate();

  const handleToggle = (open) => setSidebarOpen(Boolean(open));

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Prefer showing results on the map
    navigate('/map');
  };

  const handleAddSpot = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setShowAddSpotModal(true);
    }
  };

  const handleAddSpotClick = () => {
    navigate('/map');
    setTimeout(() => {
      if (mapRef.current && typeof mapRef.current.enableMarkingMode === 'function') {
        mapRef.current.enableMarkingMode();
      }
    }, 250);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    navigate('/map');
  };

  return (
    <div className={`app layout-with-sidebar ${!sidebarOpen ? "sidebar-hidden" : ""}`}>
  <Sidebar open={sidebarOpen} onToggle={handleToggle} onSearch={handleSearch} onAddSpot={handleAddSpotClick} onFilterChange={handleFilterChange} />
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/map" element={<Map ref={mapRef} searchQuery={searchQuery} filters={filters} />} />
        </Routes>
      </main>
      
      <AddSpotModal isOpen={showAddSpotModal} onClose={() => setShowAddSpotModal(false)} />
    </div>
  );
}

export default App;

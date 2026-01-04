import "./App.css";
import React, { useState } from "react";
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
  const navigate = useNavigate();

  const handleToggle = (open) => setSidebarOpen(Boolean(open));
  const handleSearch = (query) => {
    // Navigue vers la page de recherche avec la requête
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleAddSpot = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setShowAddSpotModal(true);
    }
  };

  return (
    <div className={`app layout-with-sidebar ${!sidebarOpen ? "sidebar-hidden" : ""}`}>
      <Sidebar open={sidebarOpen} onToggle={handleToggle} onSearch={handleSearch} onAddSpot={handleAddSpot} />
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
      
      <AddSpotModal isOpen={showAddSpotModal} onClose={() => setShowAddSpotModal(false)} />
    </div>
  );
}

export default App;

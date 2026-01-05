import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import { CATEGORIES } from "../../constants/categories";

const Sidebar = ({ open = true, onToggle = () => {}, onSearch = () => {}, onAddSpot = () => {}, onFilterChange = () => {} }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [radius, setRadius] = useState(5);
  const [radiusEnabled, setRadiusEnabled] = useState(true);
  if (!open) {
    return (
      <button
        className="sidebar-open-handle"
        aria-label="Ouvrir la barre latérale"
        onClick={() => onToggle(true)}
      >
        ☰
      </button>
    );
  }

  return (
    <aside className={"sidebar"}>
      <button
        className="sidebar-toggle"
        aria-label="Fermer la barre latérale"
        onClick={() => onToggle(false)}
      >
        ⬅
      </button>

      <nav className="sidebar-nav">
        <form
          className="sidebar-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) onSearch(query.trim());
          }}
        >
          <input
            type="search"
            placeholder="Rechercher un spot..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            aria-label="Recherche de spots"
          />
          <button type="submit" className="search-button" aria-label="Lancer la recherche">
            🔍
          </button>
        </form>

        <div className="sidebar-filters">
          <label className="filter-row">
            <span className="filter-label">Catégorie</span>
            <select
              value={category}
              onChange={(e) => {
                const val = e.target.value;
                setCategory(val);
                onFilterChange({ category: val, radius: radiusEnabled ? radius : null, radiusEnabled });
              }}
              className="filter-select"
              aria-label="Filtrer par catégorie"
            >
              <option value="Tous">Tous</option>
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
          </label>

          <label className="filter-row">
            <span className="filter-label">Rayon</span>
            <div className="radius-controls">
              <label className="radius-toggle">
                <input
                  type="checkbox"
                  checked={radiusEnabled}
                  onChange={(e) => {
                    const en = e.target.checked;
                    setRadiusEnabled(en);
                      onFilterChange({ category, radius: en ? radius : null, radiusEnabled: en });
                  }}
                  aria-label="Activer le filtrage par rayon"
                />
                <span className="radius-toggle-label">{radiusEnabled ? "Activé" : "Désactivé"}</span>
              </label>

              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setRadius(r);
                  if (radiusEnabled) onFilterChange({ category, radius: r, radiusEnabled });
                }}
                className={`range-input ${radiusEnabled ? "" : "disabled"}`}
                aria-label="Rayon de recherche en kilomètres"
                disabled={!radiusEnabled}
              />
              <span className="radius-value">{radius} km</span>
            </div>
          </label>
        </div>

        <div className="sidebar-add-spot">
          <button
            type="button"
            className="add-spot-button"
            onClick={() => onAddSpot()}
            aria-label="Ajouter un spot"
          >
            ➕ Ajouter un spot
          </button>
        </div>

        <NavLink to="/home" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          <span className="icon">🏠</span>
          <span className="label">Accueil</span>
        </NavLink>

        <NavLink to="/inscription" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          <span className="icon">✍️</span>
          <span className="label">Inscription</span>
        </NavLink>

        <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          <span className="icon">🔒</span>
          <span className="label">Connexion</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <small>© PrepFA</small>
      </div>
    </aside>
  );
};

export default Sidebar;

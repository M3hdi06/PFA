import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          console.error('Erreur parsing user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    const handleAuthChange = () => loadUser();
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link
          to="/home"
          className="navbar__brand"
          onClick={() => setIsOpen(false)}
        >
          <span className="navbar__brand--muz">Muz</span><span className="navbar__brand--ly">ly</span>
        </Link>

        <form className="navbar__search" onSubmit={handleSearch}>
          <input
            type="text"
            className="navbar__search-input"
            placeholder="Rechercher un musicien ou un investisseur"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher"
          />
          <button type="submit" className="navbar__search-btn" aria-label="Valider la recherche">
            🔍
          </button>
        </form>

        <button
          className="navbar__toggle"
          aria-label="Basculer la navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar__links ${isOpen ? "is-open" : ""}`}>
          {user ? (
            <div className="navbar__user">
              <span className="navbar__username">👤 {user.nom || user.email}</span>
              <button className="navbar__cta navbar__cta--logout" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              className="navbar__cta"
              onClick={() => {
                setIsOpen(false);
                navigate("/login");
              }}
            >
              Se connecter
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

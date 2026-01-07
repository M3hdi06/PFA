import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
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

    // Charger au montage
    loadUser();

    // Écouter les événements de connexion/déconnexion
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

  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Brand / Logo */}
        <Link
          to="/map"
          className="navbar__brand"
          onClick={() => setIsOpen(false)}
        >
          <span className="navbar__logo-dot" />
          prepfa
        </Link>

        {/* Toggle mobile */}
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

        {/* Navigation */}
        <nav className={`navbar__links ${isOpen ? "is-open" : ""}`}>
          <Link to="/map" onClick={() => setIsOpen(false)}>
            Carte
          </Link>

          <Link to="/favorites" onClick={() => setIsOpen(false)}>
            Favoris
          </Link>

          <Link to="/trending" onClick={() => setIsOpen(false)}>
            Tendances
          </Link>

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

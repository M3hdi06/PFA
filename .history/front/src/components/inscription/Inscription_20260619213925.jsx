import React, { useState } from "react";
import "../login/Login.css";
import "./Inscription.css";
import { useNavigate, Link } from "react-router-dom";
import API_URL from "../../config/api";

const availableGenres = [
  "rock",
  "metal",
  "shoegaze",
  "jazz",
  "rap",
  "hip-hop",
  "electro",
  "punk",
  "blues",
];

const Inscription = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [genreError, setGenreError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showGenrePopup, setShowGenrePopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Nom requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Mot de passe requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGenreError("");
    setShowGenrePopup(true);
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres((prev) => prev.filter((item) => item !== genre));
      return;
    }

    if (selectedGenres.length >= 5) {
      setGenreError("Vous pouvez sélectionner jusqu'à 5 genres.");
      return;
    }

    setSelectedGenres((prev) => [...prev, genre]);
    setGenreError("");
  };

  const closeGenrePopup = () => {
    setShowGenrePopup(false);
    setGenreError("");
  };

  const handleGenreSubmit = async () => {
    if (selectedGenres.length === 0) {
      setGenreError("Choisissez au moins un genre musical.");
      return;
    }

    setIsLoading(true);
    setErrors({});
    setGenreError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email,
          password: formData.password,
          genres: selectedGenres,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowGenrePopup(false);
        navigate("/login");
      } else {
        setErrors({ submit: data.message || data.error || "Erreur d'inscription" });
      }
    } catch (err) {
      setErrors({
        submit: "Erreur de connexion. Vérifiez que le serveur est actif.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login__wrapper">
        <div className="login__card">
          <div className="login__card-header">
            <h2>Créer un compte</h2>
            <p className="muted">Rejoignez-nous en quelques clics.</p>
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <form className="login__form" onSubmit={handleSubmit}>
            <label>
              Nom complet
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Jean Dupont"
              />
              {errors.nom && (
                <span className="error-text">{errors.nom}</span>
              )}
            </label>

            <label>
              Adresse email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@example.com"
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </label>

            <label>
              Mot de passe
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </label>

            <label>
              Confirmer le mot de passe
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre mot de passe"
              />
              {errors.confirmPassword && (
                <span className="error-text">
                  {errors.confirmPassword}
                </span>
              )}
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Inscription..." : "S'inscrire"}
            </button>
          </form>

          {showGenrePopup && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>Choisissez vos genres musicaux</h3>
                  <p>Sélectionnez jusqu'à 5 styles différents.</p>
                </div>

                {genreError && <div className="error-message">{genreError}</div>}

                <div className="genres-grid">
                  {availableGenres.map((genre) => {
                    const selected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        className={`genre-pill ${selected ? "selected" : ""}`}
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>

                <p className="genre-note">
                  Genres choisis : {selectedGenres.length} / 5
                </p>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeGenrePopup}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGenreSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Enregistrement..." : "Valider et créer le compte"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="login__footer">
            Déjà un compte ?{" "}
            <Link className="link" to="/login">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Inscription;

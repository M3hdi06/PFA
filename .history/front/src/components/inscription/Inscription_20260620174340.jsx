import React, { useState } from "react";
import "../login/Login.css";
import "./Inscription.css";
import { useNavigate, Link } from "react-router-dom";
import API_URL from "../../config/api";

const genreGroups = [
  {
    title: "Rock & dérivés",
    genres: [
      "Rock",
      "Rock alternatif",
      "Rock indépendant (Indie rock)",
      "Rock progressif",
      "Hard rock",
      "Soft rock",
      "Punk rock",
      "Post-punk",
      "Garage rock",
      "Grunge",
      "Britpop",
      "Shoegaze",
      "Noise rock",
      "Math rock",
      "Glam rock",
      "Classic rock",
    ],
  },
  {
    title: "Metal",
    genres: [
      "Heavy metal",
      "Thrash metal",
      "Death metal",
      "Black metal",
      "Power metal",
      "Doom metal",
      "Progressive metal",
      "Metal alternatif",
      "Nu metal",
      "Metalcore",
      "Deathcore",
      "Symphonic metal",
      "Industrial metal",
      "Folk metal",
    ],
  },
  {
    title: "Pop",
    genres: [
      "Pop",
      "Electropop",
      "Synthpop",
      "Indie pop",
      "K-pop",
      "J-pop",
      "Latin pop",
      "Dance pop",
      "Teen pop",
      "Pop rock",
    ],
  },
  {
    title: "Hip-Hop & Rap",
    genres: [
      "Hip-hop",
      "Rap US",
      "Rap FR",
      "Trap",
      "Drill (UK / US)",
      "Boom bap",
      "Cloud rap",
      "Lo-fi hip-hop",
      "Gangsta rap",
      "Conscious rap",
      "Emo rap",
      "Old school hip-hop",
    ],
  },
  {
    title: "Électro / EDM",
    genres: [
      "EDM",
      "House",
      "Deep house",
      "Tech house",
      "Progressive house",
      "Techno",
      "Minimal techno",
      "Trance",
      "Psytrance",
      "Hardstyle",
      "Dubstep",
      "Drum and bass",
      "Jungle",
      "Future bass",
      "Electro swing",
      "Ambient techno",
    ],
  },
  {
    title: "Jazz & Blues",
    genres: [
      "Jazz",
      "Smooth jazz",
      "Bebop",
      "Swing",
      "Fusion jazz",
      "Blues",
      "Blues rock",
      "Soul blues",
      "Jazz funk",
      "Acid jazz",
    ],
  },
  {
    title: "Classique & orchestral",
    genres: [
      "Musique classique",
      "Baroque",
      "Romantique",
      "Moderne classique",
      "Musique de film (cinematic)",
      "Opéra",
      "Musique symphonique",
      "Minimalisme (Steve Reich style)",
    ],
  },
  {
    title: "Folk & acoustique",
    genres: [
      "Folk",
      "Indie folk",
      "Folk rock",
      "Americana",
      "Country",
      "Bluegrass",
      "Celtic music",
      "Singer-songwriter",
      "Acoustic",
    ],
  },
  {
    title: "Musiques du monde",
    genres: [
      "Afrobeat",
      "Amapiano",
      "Highlife",
      "Rai",
      "Reggae",
      "Dancehall",
      "Reggaeton",
      "Salsa",
      "Bachata",
      "Merengue",
      "Flamenco",
      "Bossa nova",
      "Samba",
      "Oriental / Arabesque",
      "Gnawa",
    ],
  },
  {
    title: "Expérimental / niche",
    genres: [
      "Ambient",
      "Dark ambient",
      "Drone",
      "Experimental",
      "Noise",
      "Glitch",
      "IDM (Intelligent Dance Music)",
      "Vaporwave",
      "Synthwave",
      "Chillwave",
      "Lo-fi",
      "Avant-garde",
    ],
  },
];

const roleOptions = [
  "Browser",
  "Musician",
  "Band",
  "Investor",
];

const roleProfileOptions = {
  Musician: [
    "Guitarist",
    "Singer",
    "Drummer",
    "Bassist",
    "Pianist",
    "Producer",
    "Songwriter",
    "DJ",
    "Multi-instrumentalist",
  ],
  Investor: [
    "Guitarist",
    "Band",
    "Musician",
    "Singer",
    "Drummer",
    "Bassist",
    "Pianist",
    "Producer",
    "DJ",
  ],
};

const searchGoalOptions = [
  {
    value: "complete",
    label: "I’m complete",
    description: "Je ne cherche pas d'autres musiciens.",
  },
  {
    value: "wantComplete",
    label: "I want to complete",
    description: "Je cherche d'autres musiciens ou groupes.",
  },
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedProfileOptions, setSelectedProfileOptions] = useState([]);
  const [selectedSearchGoal, setSelectedSearchGoal] = useState('');

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

  const isProfileStep = selectedRole === "Musician" || selectedRole === "Investor";
  const isSearchGoalStep = selectedRole === "Band" || selectedRole === "Musician";

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGenreError("");
    setShowOnboarding(true);
    setOnboardingStep("role");
    setSelectedRole("");
    setSelectedProfileOptions([]);
    setSelectedSearchGoal("");
    setSelectedGenres([]);
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setSelectedProfileOptions([]);
    setSelectedSearchGoal("");
    setGenreError("");

    if (role === "Browser" || role === "Band") {
      setOnboardingStep("genre");
    } else {
      setOnboardingStep("profileOptions");
    }
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

  const toggleProfileOption = (option) => {
    if (selectedProfileOptions.includes(option)) {
      setSelectedProfileOptions((prev) => prev.filter((item) => item !== option));
      return;
    }

    setSelectedProfileOptions((prev) => [...prev, option]);
    setGenreError("");
  };

  const selectSearchGoal = (goal) => {
    setSelectedSearchGoal(goal);
    setGenreError("");
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep("role");
    setSelectedRole("");
    setSelectedProfileOptions([]);
    setSelectedSearchGoal("");
    setSelectedGenres([]);
    setGenreError("");
  };

  const handleContinueFromProfile = () => {
    if (!selectedProfileOptions.length) {
      setGenreError("Sélectionnez au moins une option pour continuer.");
      return;
    }

    setOnboardingStep("genre");
  };

  const handleContinueFromGenre = () => {
    if (selectedGenres.length === 0) {
      setGenreError("Choisissez au moins un genre musical.");
      return;
    }

    if (isSearchGoalStep) {
      setOnboardingStep("searchGoal");
      return;
    }

    submitRegistration();
  };

  const submitRegistration = async () => {
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
          role: selectedRole,
          profileOptions: selectedProfileOptions,
          searchGoal: selectedSearchGoal,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOnboarding(false);
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

          {showOnboarding && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>
                    {onboardingStep === "role" && "Who am I?"}
                    {onboardingStep === "profileOptions" && (selectedRole === "Musician" ? "What do you do?" : "What are you searching for?")}
                    {onboardingStep === "genre" && (selectedRole === "Browser" ? "What’s your taste?" : "What kind?")}
                    {onboardingStep === "searchGoal" && "What are you searching for?"}
                  </h3>
                  <p>
                    {onboardingStep === "role" && "Choisissez votre rôle pour personnaliser le reste de l'onboarding."}
                    {onboardingStep === "profileOptions" && "Sélectionnez toutes les options qui correspondent à votre profil."}
                    {onboardingStep === "genre" && "Sélectionnez jusqu'à 5 styles musicaux."}
                    {onboardingStep === "searchGoal" && "Choisissez ce que vous recherchez après avoir choisi vos genres."}
                  </p>
                </div>

                {genreError && <div className="error-message">{genreError}</div>}

                {onboardingStep === "role" && (
                  <div className="options-grid">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`option-pill ${selectedRole === role ? "selected" : ""}`}
                        onClick={() => selectRole(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}

                {onboardingStep === "profileOptions" && (
                  <>
                    <div className="options-grid">
                      {(roleProfileOptions[selectedRole] || []).map((option) => {
                        const selected = selectedProfileOptions.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`option-pill ${selected ? "selected" : ""}`}
                            onClick={() => toggleProfileOption(option)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <p className="genre-note">Sélection libre — aucun maximum.</p>
                  </>
                )}

                {onboardingStep === "genre" && (
                  <>
                    <div className="genres-grid">
                      {genreGroups.map((group) => (
                        <div className="genre-group" key={group.title}>
                          <div className="genre-group-header">
                            <span className="genre-group-number">{genreGroups.indexOf(group) + 1}.</span>
                            <h4>{group.title}</h4>
                          </div>
                          <div className="genre-group-items">
                            {group.genres.map((genre) => {
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
                        </div>
                      ))}
                    </div>
                    <p className="genre-note">Genres choisis : {selectedGenres.length} / 5</p>
                  </>
                )}

                {onboardingStep === "searchGoal" && (
                  <div className="options-grid">
                    {searchGoalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`option-card ${selectedSearchGoal === option.value ? "selected" : ""}`}
                        onClick={() => selectSearchGoal(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeOnboarding}>
                    Annuler
                  </button>
                  {onboardingStep === "role" && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        if (!selectedRole) {
                          setGenreError("Veuillez choisir un rôle pour continuer.");
                          return;
                        }
                        if (selectedRole === "Browser" || selectedRole === "Band") {
                          setOnboardingStep("genre");
                        } else {
                          setOnboardingStep("profileOptions");
                        }
                      }}
                      disabled={isLoading}
                    >
                      Continuer
                    </button>
                  )}
                  {onboardingStep === "profileOptions" && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleContinueFromProfile}
                      disabled={isLoading}
                    >
                      Continuer
                    </button>
                  )}
                  {onboardingStep === "genre" && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleContinueFromGenre}
                      disabled={isLoading}
                    >
                      {isSearchGoalStep ? "Suivant" : isLoading ? "Enregistrement..." : "Valider et créer le compte"}
                    </button>
                  )}
                  {onboardingStep === "searchGoal" && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={submitRegistration}
                      disabled={!selectedSearchGoal || isLoading}
                    >
                      {isLoading ? "Enregistrement..." : "Valider et créer le compte"}
                    </button>
                  )}
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

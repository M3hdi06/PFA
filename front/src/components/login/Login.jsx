import React, { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Mot de passe requis";
    }

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (formData.rememberMe) {
          localStorage.setItem("rememberEmail", formData.email);
        }

        navigate("/home");
      } else {
        setErrors({ submit: data.error || "Erreur de connexion" });
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
            <h2>Connexion</h2>
            <p className="muted">Heureux de vous revoir.</p>
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <form className="login__form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@example.com"
                disabled={isLoading}
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
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </label>

            <div className="login__row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Se souvenir de moi</span>
              </label>

              <a className="link" href="#forgot">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <div className="login__divider">
              <span>ou</span>
            </div>

            <div className="login__social">
              <button type="button" disabled={isLoading}>
                Google
              </button>
              <button type="button" disabled={isLoading}>
                Microsoft
              </button>
            </div>
          </form>

          <p className="login__footer">
            Nouveau sur prepfa ?{" "}
            <Link className="link" to="/inscription">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;

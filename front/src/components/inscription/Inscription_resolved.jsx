import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Inscription.css'

const Inscription = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.password) newErrors.password = 'Le mot de passe est requis'
    else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email,
          password: formData.password
        })
      })
      
      const data = await response.json();

      if (response.ok) {
        setSuccess(true)
        setFormData({ nom: '', email: '', password: '', confirmPassword: '' })
        setErrors({})
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setErrors({ submit: data.error || 'Une erreur est survenue. Veuillez réessayer.' })
      }
    } catch (error) {
      setErrors({ submit: 'Erreur de connexion. Vérifiez que le serveur est actif.' })
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="inscription-container">
      <div className="inscription-card">
        <div className="inscription-header">
          <h1>Créer un compte</h1>
          <p>Rejoignez-nous en quelques clics</p>
        </div>

        {success && (
          <div className="success-message">
            ✓ Inscription réussie! Vérifiez votre email.
          </div>
        )}

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="inscription-form">
          <div className="form-group">
            <label htmlFor="nom">Nom complet</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Jean Dupont"
              className={errors.nom ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.nom && <span className="error-text">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className={errors.email ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 caractères"
              className={errors.password ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              className={errors.confirmPassword ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="inscription-footer">
          <p>Vous avez déjà un compte? <Link to="/login">Connectez-vous</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Inscription

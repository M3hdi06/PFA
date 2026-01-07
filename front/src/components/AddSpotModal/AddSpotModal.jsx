import React, { useState } from 'react';
import './AddSpotModal.css';

const AddSpotModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    category: 'café',
    location: '',
    lat: '',
    lng: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Tu dois être connecté pour ajouter un spot');
        setIsLoading(false);
        return;
      }

      // Valider les champs
      if (!formData.nom || !formData.location || !formData.lat || !formData.lng) {
        setError('Tous les champs sont requis');
        setIsLoading(false);
        return;
      }

      // Envoyer la requête avec le token
      const response = await fetch('http://localhost:4000/api/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Envoyer le token JWT
        },
        body: JSON.stringify({
          nom: formData.nom,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          nom: '',
          description: '',
          category: 'café',
          location: '',
          lat: '',
          lng: '',
        });
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.message || 'Erreur lors de la création du spot');
      }
    } catch (err) {
      setError('Impossible de créer le spot. Vérifiez que le serveur est actif.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2>Ajouter un spot</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">✓ Spot créé avec succès!</div>}

        <form onSubmit={handleSubmit} className="add-spot-form">
          <div className="form-group">
            <label>Nom du spot *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="ex: Café Medina"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre spot..."
              rows="3"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Catégorie *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="café">☕ Café</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="pâtisserie">🧁 Pâtisserie</option>
              <option value="bar">🍸 Bar</option>
              <option value="pizzeria">🍕 Pizzeria</option>
              <option value="glacier">🍦 Glacier</option>
            </select>
          </div>

          <div className="form-group">
            <label>Localisation (ville) *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="ex: Fès"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                placeholder="34.0626"
                step="0.0001"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                placeholder="-5.0063"
                step="0.0001"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Création en cours...' : 'Ajouter le spot'}
          </button>
        </form>

        <p className="note">
          💡 Vous pouvez trouver les coordonnées GPS sur Google Maps
        </p>
      </div>
    </div>
  );
};

export default AddSpotModal;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../config/api';
import './ProfilePanel.css';

/* ─── Icons ───────────────────────────────────────── */

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconPen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

/* ─── Helpers ─────────────────────────────────────── */

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getUserId = (user) => user?._id || user?.id;

const getInitials = (nom, email) => {
  const source = (nom || email || '?').trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

/* ─── Component ───────────────────────────────────── */

const ProfilePanel = ({ user: userProp, onUserUpdate, onPostCreated }) => {
  const [user, setUser] = useState(userProp || getStoredUser());
  const [form, setForm] = useState({ nom: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postMessage, setPostMessage] = useState(null);

  const syncForm = useCallback((u) => {
    if (!u) return;
    setForm({ nom: u.nom || '', email: u.email || '' });
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        syncForm(data.user);
        onUserUpdate?.(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  }, [onUserUpdate, syncForm]);

  useEffect(() => {
    const stored = userProp || getStoredUser();
    setUser(stored);
    syncForm(stored);
    if (stored) refreshProfile();

    const handler = () => {
      const next = getStoredUser();
      setUser(next);
      syncForm(next);
      if (next) refreshProfile();
    };

    window.addEventListener('authChange', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('authChange', handler);
      window.removeEventListener('storage', handler);
    };
  }, [userProp, refreshProfile, syncForm]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    if (!token) return;

    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: form.nom.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        syncForm(data.user);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profil mis à jour' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur serveur' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePost = async (event) => {
    event?.preventDefault();
    const userId = getUserId(user);

    if (!userId || !postTitle.trim()) {
      setPostMessage({ type: 'error', text: 'Veuillez saisir un titre pour le post.' });
      return;
    }

    setIsPosting(true);
    setPostMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text: postTitle }),
      });

      const data = await res.json();

      if (res.ok && data.data) {
        onPostCreated?.(data.data);
        setIsPostModalOpen(false);
        setPostTitle('');
      } else {
        setPostMessage({ type: 'error', text: 'Erreur post' });
      }
    } catch {
      setPostMessage({ type: 'error', text: 'Serveur indisponible' });
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return (
      <aside className="profile-panel profile-panel--guest">
        <div className="profile-panel__guest-card">
          <div className="profile-panel__guest-icon">
            <IconUser />
          </div>
          <h2 className="profile-panel__guest-title">Votre espace</h2>
          <p className="profile-panel__guest-text">
            Connectez-vous pour accéder à votre profil et publier du contenu.
          </p>
          <Link to="/login" className="profile-panel__cta">
            Se connecter
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="profile-panel">

      {/* SCROLL GLOBAL (hero + content ensemble) */}
      <div className="profile-panel__content">

        <div className="profile-panel__hero">
          <div className="profile-panel__cover" />

          <div className="profile-panel__hero-inner">
            <div className="profile-panel__avatar-wrap">
              <div className="profile-panel__avatar-ring">
                <div className="profile-panel__avatar">
                  {getInitials(user.nom, user.email)}
                </div>
              </div>

              <div className="profile-panel__hero-text">
                <span className="profile-panel__badge">Membre</span>
                <h2 className="profile-panel__display-name">{user.nom}</h2>
                <p className="profile-panel__display-email">{user.email}</p>
              </div>
            </div>

            <button
              className={`profile-panel__edit-btn ${isEditing ? 'profile-panel__edit-btn--active' : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <IconEdit />
              <span className="profile-panel__edit-btn-label">
                {isEditing ? 'Annuler' : 'Modifier'}
              </span>
            </button>
          </div>
        </div>

        <div className="profile-panel__scroll">

          {!isEditing ? (
            <section className="profile-panel__section">
              <h3 className="profile-panel__section-title">Informations</h3>
              <ul className="profile-panel__info-list">
                <li className="profile-panel__info-row">
                  <div className="profile-panel__info-icon">
                    <IconUser />
                  </div>
                  <div className="profile-panel__info-content">
                    <span className="profile-panel__info-label">Nom</span>
                    <span className="profile-panel__info-value">{user.nom}</span>
                  </div>
                </li>
                <li className="profile-panel__info-row">
                  <div className="profile-panel__info-icon">
                    <IconMail />
                  </div>
                  <div className="profile-panel__info-content">
                    <span className="profile-panel__info-label">Email</span>
                    <span className="profile-panel__info-value">{user.email}</span>
                  </div>
                </li>
              </ul>
            </section>
          ) : (
            <section className="profile-panel__section">
              <h3 className="profile-panel__section-title">Modifier le profil</h3>
              <form className="profile-panel__form" onSubmit={handleSubmit}>
                <div className="profile-panel__field">
                  <label className="profile-panel__field-label">Nom</label>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                  />
                </div>

                <div className="profile-panel__field">
                  <label className="profile-panel__field-label">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    className="profile-panel__field-input--readonly"
                    readOnly
                  />
                </div>

                <div className="profile-panel__form-actions">
                  <button
                    type="submit"
                    className="profile-panel__btn profile-panel__btn--primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    className="profile-panel__btn profile-panel__btn--secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </button>
                </div>
              </form>

              {message && (
                <div
                  className={`profile-panel__toast ${
                    message.type === 'success'
                      ? 'profile-panel__toast--success'
                      : 'profile-panel__toast--error'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {/* DOCK FIXE */}
      <div className="profile-panel__dock">
        <button
          className="profile-panel__compose"
          onClick={() => setIsPostModalOpen(true)}
        >
          <div className="profile-panel__compose-icon">
            <IconPen />
          </div>
          <div className="profile-panel__compose-text">
            <strong>Créer un post</strong>
            <small>Partagez quelque chose avec la communauté</small>
          </div>
        </button>
      </div>

      {isPostModalOpen && (
        <div className="profile-panel__modal-overlay" onClick={() => setIsPostModalOpen(false)}>
          <div className="profile-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-panel__modal-header">
              <div>
                <p className="profile-panel__modal-label">Nouveau post</p>
                <h3 className="profile-panel__modal-title">Ajouter un post</h3>
              </div>
              <button
                type="button"
                className="profile-panel__modal-close"
                onClick={() => setIsPostModalOpen(false)}
                aria-label="Fermer"
              >
                
              </button>
            </div>

            <div className="profile-panel__media-preview">
              <div className="profile-panel__media-card profile-panel__image-card">
                <span>Image</span>
              </div>
              <div className="profile-panel__media-card profile-panel__audio-card">
                <span>Audio</span>
                <small>Lecture audio factice</small>
              </div>
            </div>

            <form className="profile-panel__form" onSubmit={handlePost}>
              <div className="profile-panel__field">
                <label className="profile-panel__field-label">Titre du post</label>
                <input
                  name="postTitle"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Entrez un titre"
                />
              </div>

              <div className="profile-panel__form-actions">
                <button
                  type="submit"
                  className="profile-panel__btn profile-panel__btn--primary"
                  disabled={isPosting}
                >
                  {isPosting ? 'Publication...' : 'Publier'}
                </button>
                <button
                  type="button"
                  className="profile-panel__btn profile-panel__btn--secondary"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  Annuler
                </button>
              </div>

              {postMessage && (
                <div
                  className={`profile-panel__toast ${
                    postMessage.type === 'success'
                      ? 'profile-panel__toast--success'
                      : 'profile-panel__toast--error'
                  }`}
                >
                  {postMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </aside>
  );
};

export default ProfilePanel;
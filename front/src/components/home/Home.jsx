import React, { useState, useEffect, useCallback } from 'react';

import './Home.css';

import API_URL from '../../config/api';



const getStoredUser = () => {

  try {

    const raw = localStorage.getItem('user');

    return raw ? JSON.parse(raw) : null;

  } catch {

    return null;

  }

};



const getUserId = (user) => user?._id || user?.id;



const formatDate = (dateStr) => {

  if (!dateStr) return '';

  return new Date(dateStr).toLocaleString('fr-FR', {

    day: 'numeric',

    month: 'short',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

  });

};



const Home = () => {

  const [posts, setPosts] = useState([]);

  const [postText, setPostText] = useState('');

  const [commentsByPost, setCommentsByPost] = useState({});

  const [commentDrafts, setCommentDrafts] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(getStoredUser);



  const fetchPosts = useCallback(async () => {

    try {

      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/posts`);

      const data = await response.json();



      if (response.ok) {

        setPosts(data.data || []);

        setError(null);

      } else {

        setError(data.message || 'Erreur lors du chargement des publications');

      }

    } catch {

      setError('Impossible de joindre le serveur.');

    } finally {

      setIsLoading(false);

    }

  }, []);



  const fetchComments = useCallback(async (postId) => {

    try {

      const response = await fetch(`${API_URL}/api/comments?postId=${postId}`);

      const data = await response.json();



      if (response.ok) {

        setCommentsByPost((prev) => ({

          ...prev,

          [postId]: data.data || [],

        }));

      }

    } catch (err) {

      console.error('Erreur chargement commentaires:', err);

    }

  }, []);



  useEffect(() => {

    fetchPosts();

    setCurrentUser(getStoredUser());

  }, [fetchPosts]);



  useEffect(() => {

    posts.forEach((post) => {

      fetchComments(post._id);

    });

  }, [posts, fetchComments]);



  const handlePublish = async () => {

    const userId = getUserId(currentUser);

    if (!userId) {

      alert('Connectez-vous pour publier.');

      return;

    }

    if (!postText.trim()) return;



    try {

      const response = await fetch(`${API_URL}/api/posts`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ userId, text: postText.trim() }),

      });

      const data = await response.json();



      if (response.ok) {

        setPostText('');

        setPosts((prev) => [data.data, ...prev]);

      } else {

        alert(data.message || 'Erreur lors de la publication');

      }

    } catch {

      alert('Erreur de connexion au serveur.');

    }

  };



  const handleCommentSubmit = async (post) => {

    const userId = getUserId(currentUser);

    const commentText = (commentDrafts[post._id] || '').trim();



    if (!userId) {

      alert('Connectez-vous pour commenter.');

      return;

    }

    if (!commentText) return;



    try {

      const response = await fetch(`${API_URL}/api/comments`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          postId: post._id,

          userId,

          text: commentText,

        }),

      });

      const data = await response.json();



      if (response.ok) {

        setCommentDrafts((prev) => ({ ...prev, [post._id]: '' }));

        setCommentsByPost((prev) => ({

          ...prev,

          [post._id]: [data.data, ...(prev[post._id] || [])],

        }));

      } else {

        alert(data.message || "Erreur lors de l'envoi du commentaire");

      }

    } catch {

      alert('Erreur de connexion au serveur.');

    }

  };



  return (

    <div className="home-page">

      <div className="home-columns">

        <div className="home-column home-column--left">

          <h2>Espace de publication</h2>

          <div className="publier">

            <input

              type="text"

              placeholder="Quoi de neuf ?"

              value={postText}

              onChange={(e) => setPostText(e.target.value)}

              onKeyDown={(e) => e.key === 'Enter' && handlePublish()}

            />

            <button type="button" onClick={handlePublish}>

              Publier

            </button>

          </div>



          {isLoading && <p className="home-status">Chargement…</p>}

          {error && <p className="home-status home-status--error">{error}</p>}



          {!isLoading && posts.length === 0 && (

            <p className="home-status">Aucune publication pour le moment.</p>

          )}



          {posts.map((post) => {

            const comments = commentsByPost[post._id] || [];

            const authorName = post.userId?.nom || 'Utilisateur';



            return (

              <div key={post._id} className="publication-space">

                <p>{authorName}</p>

                <p>{formatDate(post.createdAt)}</p>

                <p>{post.text}</p>



                <div className="publication-comments">

                  <ul className="comment-list">

                    {comments.length === 0 ? (

                      <li className="comment-list__empty">Aucun commentaire</li>

                    ) : (

                      comments.map((comment) => (

                        <li key={comment._id} className="comment-item">

                          <span className="comment-item__author">

                            {comment.userId?.nom || 'Utilisateur'}

                          </span>

                          <span className="comment-item__text">{comment.text}</span>

                        </li>

                      ))

                    )}

                  </ul>

                  <div className="comment-form">

                    <input

                      type="text"

                      placeholder="Écrire un commentaire…"

                      value={commentDrafts[post._id] || ''}

                      onChange={(e) =>

                        setCommentDrafts((prev) => ({

                          ...prev,

                          [post._id]: e.target.value,

                        }))

                      }

                      onKeyDown={(e) =>

                        e.key === 'Enter' && handleCommentSubmit(post)

                      }

                    />

                    <button

                      type="button"

                      onClick={() => handleCommentSubmit(post)}

                    >

                      Envoyer

                    </button>

                  </div>

                </div>



                <p className="publication-likes">

                  {post.likes?.length || 0} j&apos;aime

                </p>

              </div>

            );

          })}

        </div>

        <div className="home-column home-column--center">

          <h2>Colonne 2</h2>

          <p>Contenu principal de la colonne centrale.</p>

        </div>

        <div className="home-column home-column--right">

          <h2>Colonne 3</h2>

          <p>Contenu de la colonne droite.</p>

        </div>

      </div>

    </div>

  );

};



export default Home;



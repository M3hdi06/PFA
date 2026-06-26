import React, { useState, useEffect, useCallback, useRef } from 'react';

import './Home.css';

import API_URL from '../../config/api';

import ProfilePanel from '../profile/ProfilePanel';

const getStoredUser = () => {

  try {

    const raw = localStorage.getItem('user');

    return raw ? JSON.parse(raw) : null;

  } catch {

    return null;

  }

};



const getUserId = (user) => user?._id || user?.id;

const hasUserLikedPost = (post, userId) => {
  if (!userId || !post?.likes?.length) return false;
  return post.likes.some((id) => id.toString() === userId.toString());
};



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

  const [activeIndex, setActiveIndex] = useState(0);

  const [touchStartY, setTouchStartY] = useState(null);

  const [cardHeight, setCardHeight] = useState(0);

  const cardRef = useRef(null);
  const audioRefs = useRef([]);

  const centerCards = [
    {
      title: 'Bloc 1',
      image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
      audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      title: 'Bloc 2',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
      audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      title: 'Bloc 3',
      image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
      audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
  const cardGap = 0;

  const handleSwipeStart = (event) => {
    setTouchStartY(event.touches[0].clientY);
  };

  const handleSwipeEnd = (event) => {
    if (touchStartY === null) return;

    const deltaY = event.changedTouches[0].clientY - touchStartY;
    const swipeThreshold = 20;

    if (deltaY < -swipeThreshold) {
      setActiveIndex((prev) => (prev + 1) % centerCards.length);
    } else if (deltaY > swipeThreshold) {
      setActiveIndex((prev) => (prev - 1 + centerCards.length) % centerCards.length);
    }

    setTouchStartY(null);
  };

  const handleWheel = (event) => {
    if (event.deltaY > 0) {
      setActiveIndex((prev) => (prev + 1) % centerCards.length);
    } else if (event.deltaY < 0) {
      setActiveIndex((prev) => (prev - 1 + centerCards.length) % centerCards.length);
    }
  };



  useEffect(() => {
    const updateCardHeight = () => {
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight);
      }
    };

    updateCardHeight();
    window.addEventListener('resize', updateCardHeight);

    return () => window.removeEventListener('resize', updateCardHeight);
  }, []);

  useEffect(() => {
    audioRefs.current.forEach((audio, index) => {
      if (!audio) return;

      if (index === activeIndex) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, [activeIndex]);

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



  const refreshCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Erreur chargement profil utilisateur:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    setCurrentUser(getStoredUser());
    refreshCurrentUser();

    const handleAuthChange = () => {
      setCurrentUser(getStoredUser());
      refreshCurrentUser();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchPosts, refreshCurrentUser]);



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



  const handleToggleLike = async (post) => {
    const token = localStorage.getItem('authToken');
    const userId = getUserId(currentUser);

    if (!token || !userId) {
      alert('Connectez-vous pour liker une publication.');
      return;
    }

    const alreadyLiked = hasUserLikedPost(post, userId);

    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: alreadyLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setPosts((prev) =>
          prev.map((p) => (p._id === post._id ? data.data : p))
        );
      } else {
        alert(data.message || 'Erreur lors du like');
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
            const userId = getUserId(currentUser);
            const isLiked = hasUserLikedPost(post, userId);
            const likesCount = post.likes?.length || 0;



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



                <button
                  type="button"
                  className={`publication-likes ${isLiked ? 'publication-likes--active' : ''}`}
                  onClick={() => handleToggleLike(post)}
                  aria-pressed={isLiked}
                >
                  {isLiked ? '♥' : '♡'} {likesCount} j&apos;aime
                </button>

              </div>

            );

          })}

        </div>

        <div className="home-column home-column--center">

          <h2>For You Page</h2>

          <div
            className="home-center-viewport"
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            onWheel={handleWheel}
          >
            <div
              className="home-center-track"
              style={{ transform: `translateY(-${activeIndex * (cardHeight + cardGap)}px)` }}
            >
              {centerCards.map((card, index) => (
                <div
                  key={card.title}
                  ref={index === 0 ? cardRef : null}
                  className="home-center-card"
                >
                  <div className="home-card-image">
                    <img src={card.image} alt={card.title} />
                  </div>
                  <div className="home-card-title">
                    <h3>{card.title}</h3>
                  </div>
                  <div className="home-card-audio">
                    <audio
                      controls
                      preload="none"
                      ref={(element) => {
                        audioRefs.current[index] = element;
                      }}
                    >
                      <source src={card.audio} type="audio/mpeg" />
                    </audio>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="home-column home-column--right home-column--profile">
  <ProfilePanel
    user={currentUser}
    onUserUpdate={(u) => setCurrentUser(u)}
    onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
  />
</div>

      </div>

    </div>

  );

};



export default Home;



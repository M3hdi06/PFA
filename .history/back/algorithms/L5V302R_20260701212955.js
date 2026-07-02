"use strict";

/**
 * L5V302R — Moteur de recommandation par cooccurrence de hashtags (Muzly)
 * =======================================================================
 *
 * Principe : deux hashtags qui apparaissent souvent ensemble dans les posts
 * sont "associés". Si un utilisateur aime #jazz et que #jazz apparaît souvent
 * avec #blues, alors les posts #blues sont probablement pertinents pour lui.
 *
 * Métrique utilisée : probabilité conditionnelle
 *     force(u -> p) = P(p | u) = count(posts contenant u ET p) / count(posts contenant u)
 *
 * Le calcul se fait en 2 temps :
 *   1. HORS-LIGNE (batch / cron) : on scanne tous les posts une fois et on
 *      construit un "modèle de cooccurrence" (des compteurs) stocké dans MongoDB.
 *   2. EN-LIGNE (à chaque requête) : on charge ce modèle et on l'utilise pour
 *      générer des candidats, les scorer, et les classer. Aucun recomptage.
 *
 * NB : les hashtags viennent d'une liste FERMÉE et prédéfinie (pas de fautes
 * de frappe), donc on peut les utiliser directement comme clés d'objet.
 */

// ===========================================================================
// PARTIE 1 — LE MODÈLE DE COOCCURRENCE (calcul hors-ligne)
// ===========================================================================

/**
 * Clé normalisée pour une paire de hashtags (l'ordre n'a pas d'importance :
 * (jazz, blues) et (blues, jazz) donnent la même clé).
 */
const pairKey = (a, b) => (a < b ? `${a}__${b}` : `${b}__${a}`);

/**
 * Construit le modèle de cooccurrence à partir d'un ensemble de publications.
 * ⚠️ À exécuter périodiquement (batch), PAS à chaque requête utilisateur.
 *
 * @param {Array<{hashtags: string[]}>} posts
 * @returns {{hashtagCounts: Object, pairCounts: Object, totalPosts: number}}
 *          Modèle 100% sérialisable → stockable tel quel dans MongoDB.
 */
const buildCooccurrenceModel = (posts) => {
  const hashtagCounts = {}; // hashtag  -> nb de posts qui le contiennent
  const pairCounts = {};    // "a__b"   -> nb de posts contenant a ET b
  let totalPosts = 0;

  for (const post of posts) {
    // On déduplique : un hashtag présent 2× dans un post ne compte qu'une fois.
    const tags = Array.isArray(post.hashtags)
      ? Array.from(new Set(post.hashtags))
      : [];
    if (tags.length === 0) continue;

    totalPosts += 1;

    for (let i = 0; i < tags.length; i += 1) {
      const a = tags[i];
      hashtagCounts[a] = (hashtagCounts[a] || 0) + 1;

      // Toutes les paires (a, b) du post, sans doublon.
      for (let j = i + 1; j < tags.length; j += 1) {
        const key = pairKey(a, tags[j]);
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }

  return { hashtagCounts, pairCounts, totalPosts };
};

/**
 * Force d'association d'un hashtag "p" étant donné un hashtag préféré "u".
 * = P(p | u) = count(u ET p) / count(u), dans [0, 1].
 *
 * C'est LE seul endroit où la métrique est définie : pour passer plus tard à
 * PMI ou Jaccard, tu ne modifies que cette fonction.
 */
const cooccurrenceStrength = (u, p, model) => {
  if (u === p) return 1; // match direct : le hashtag préféré est dans le post

  const countU = model.hashtagCounts[u] || 0;
  if (countU === 0) return 0; // hashtag préféré jamais vu → aucune info

  const together = model.pairCounts[pairKey(u, p)] || 0;
  return together / countU; // P(p | u)

  // Amélioration possible (voir notes) :
  // - lissage : (together + k) / (countU + k * V) pour éviter les 1.0 sur
  //   des hashtags rares (count = 1) qui sont statistiquement peu fiables ;
  // - PMI : log( P(u,p) / (P(u)*P(p)) ) pour ne pas gonfler les hashtags
  //   populaires qui cooccurrent avec tout.
};

// ===========================================================================
// PARTIE 2 — ACCÈS AUX DONNÉES (MongoDB)
// ===========================================================================

/**
 * Récupère les préférences d'un utilisateur.
 * ⚠️ Passe un userId du bon type (ObjectId si tes _id sont des ObjectId).
 */
const getUserPreferences = async (userId, db) => {
  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { preferredHashtags: 1, preferredGenres: 1 } }
  );

  return {
    userId,
    preferredHashtags: (user && user.preferredHashtags) || [],
    preferredGenres: (user && user.preferredGenres) || [], // dispo pour plus tard
  };
};

/**
 * Étend les hashtags préférés avec leurs voisins les plus co-occurrents.
 *
 * Sans ça, on ne remonterait QUE des posts qui contiennent déjà un hashtag
 * préféré → la cooccurrence ne servirait qu'au tri, jamais à la découverte.
 * Ici, si tu aimes #jazz, on va aussi chercher les posts #blues, #soul, etc.
 *
 * La liste des hashtags étant fermée et petite, ce balayage est peu coûteux.
 */
const expandHashtagsByCooccurrence = (preferredHashtags, model, options = {}) => {
  const { neighborsPerHashtag = 5 } = options;
  const expanded = new Set(preferredHashtags);

  const allHashtags = Object.keys(model.hashtagCounts);

  for (const u of preferredHashtags) {
    const neighbors = allHashtags
      .filter((p) => p !== u)
      .map((p) => ({ hashtag: p, strength: cooccurrenceStrength(u, p, model) }))
      .filter((n) => n.strength > 0)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, neighborsPerHashtag);

    for (const n of neighbors) expanded.add(n.hashtag);
  }

  return Array.from(expanded);
};

/**
 * Génère les publications candidates : celles qui contiennent au moins un
 * hashtag préféré OU un de ses voisins co-occurrents.
 */
const fetchCandidatePosts = async (userPreferences, model, db, options = {}) => {
  const { preferredHashtags, userId } = userPreferences;
  const { candidateLimit = 200, excludeOwnPosts = true } = options;

  if (preferredHashtags.length === 0) return []; // pas de préférence → rien à faire

  const searchHashtags = expandHashtagsByCooccurrence(
    preferredHashtags,
    model,
    options
  );

  const query = { hashtags: { $in: searchHashtags } };
  if (excludeOwnPosts) query.userId = { $ne: userId };

  return db
    .collection("posts")
    .find(query)
    .limit(candidateLimit)
    .toArray();
};

/**
 * Charge le modèle de cooccurrence pré-calculé depuis MongoDB.
 * Renvoie un modèle vide si rien n'a encore été calculé (système neuf).
 */
const loadCooccurrenceModel = async (db) => {
  const stored = await db
    .collection("cooccurrence_model")
    .findOne({ _id: "L5V302R" });

  return (stored && stored.model) || {
    hashtagCounts: {},
    pairCounts: {},
    totalPosts: 0,
  };
};

/**
 * Sauvegarde le modèle (upsert). Appelé par le job de rafraîchissement.
 */
const saveCooccurrenceModel = async (db, model) => {
  await db.collection("cooccurrence_model").updateOne(
    { _id: "L5V302R" },
    { $set: { model, updatedAt: new Date() } },
    { upsert: true }
  );
};

/**
 * JOB HORS-LIGNE : reconstruit le modèle à partir de tous les posts.
 * À brancher sur un cron (ex. toutes les nuits) ou après N nouveaux posts.
 */
const refreshCooccurrenceModel = async (db) => {
  const posts = await db
    .collection("posts")
    .find({}, { projection: { hashtags: 1 } })
    .toArray();

  const model = buildCooccurrenceModel(posts);
  await saveCooccurrenceModel(db, model);
  return model;
};

// ===========================================================================
// PARTIE 3 — SCORING & RANKING (calcul pur, sans base → testable en isolation)
// ===========================================================================

/**
 * Score de pertinence d'UN post pour un utilisateur, dans [0, 1].
 *
 * - Pour chaque hashtag du post, on prend sa MEILLEURE connexion (max) à
 *   l'une des préférences : un hashtag est pertinent s'il est lié à AU MOINS
 *   une chose que l'utilisateur aime (une moyenne diluerait le signal).
 * - On fait la MOYENNE sur les hashtags du post : un post "bourré" de
 *   hashtags n'est pas avantagé juste par le nombre (anti hashtag-stuffing).
 */
const scorePost = (post, preferredHashtags, model) => {
  const tags = Array.isArray(post.hashtags) ? post.hashtags : [];
  if (tags.length === 0 || preferredHashtags.length === 0) return 0;

  let sum = 0;
  for (const p of tags) {
    let best = 0;
    for (const u of preferredHashtags) {
      const s = cooccurrenceStrength(u, p, model);
      if (s > best) best = s;
    }
    sum += best;
  }
  return sum / tags.length;
};

/**
 * Calcule le score de chaque candidat. Fonction PURE et SYNCHRONE :
 * le modèle est déjà chargé, il n'y a plus d'I/O ici.
 */
const computeRecommendationScores = (userPreferences, posts, model) => {
  const { preferredHashtags } = userPreferences;
  return posts.map((post) => ({
    post,
    score: scorePost(post, preferredHashtags, model),
  }));
};

/**
 * Trie et coupe (top-N + seuil minimal). Ne mute PAS l'entrée.
 * Conserve { post, score } → utile pour le debug, l'explicabilité, la pagination.
 */
const rankRecommendations = (scoredPosts, options = {}) => {
  const { limit = 20, minScore = 0 } = options;

  return [...scoredPosts]
    .filter((item) => item.score > minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// ===========================================================================
// PARTIE 4 — ORCHESTRATION (le pipeline public)
// ===========================================================================

/**
 * Pipeline complet : préférences + modèle → candidats → scores → classement.
 *
 * @returns {Promise<Array<{post: Object, score: number}>>}
 *          On garde le score jusqu'ici. Le contrôleur projette vers `post`
 *          au tout dernier moment (voir exemple d'usage en bas de fichier).
 */
const recommendPostsForUser = async (userId, db, options = {}) => {
  // Préférences et modèle sont indépendants → on les charge en parallèle.
  const [userPreferences, model] = await Promise.all([
    getUserPreferences(userId, db),
    loadCooccurrenceModel(db),
  ]);

  const candidatePosts = await fetchCandidatePosts(
    userPreferences,
    model,
    db,
    options
  );

  const scoredPosts = computeRecommendationScores(
    userPreferences,
    candidatePosts,
    model
  );

  return rankRecommendations(scoredPosts, options);
};

// ===========================================================================
// EXPORTS
// ===========================================================================

module.exports = {
  // API publique principale
  recommendPostsForUser,

  // Étapes du pipeline (exportées pour les tests unitaires)
  getUserPreferences,
  fetchCandidatePosts,
  computeRecommendationScores,
  rankRecommendations,

  // Gestion du modèle de cooccurrence
  buildCooccurrenceModel,
  refreshCooccurrenceModel,
  loadCooccurrenceModel,
  saveCooccurrenceModel,

  // Briques de calcul pures
  cooccurrenceStrength,
  scorePost,
  expandHashtagsByCooccurrence,
};

/*
 * ---------------------------------------------------------------------------
 * EXEMPLE D'USAGE
 * ---------------------------------------------------------------------------
 *
 * // 1) Job planifié (cron), une fois par nuit par exemple :
 * await refreshCooccurrenceModel(db);
 *
 * // 2) Dans ton contrôleur Express :
 * const recos = await recommendPostsForUser(userId, db, { limit: 20 });
 * // recos = [{ post, score }, ...]
 *
 * // Projection finale pour le frontend (imageUrl / audioUrl) :
 * const payload = recos.map(({ post, score }) => ({
 *   id: post._id,
 *   title: post.title,
 *   imageUrl: post.imageUrl,
 *   audioUrl: post.audioUrl,
 *   hashtags: post.hashtags,
 *   score, // pratique en dev pour vérifier le classement, à retirer en prod si besoin
 * }));
 * res.json(payload);
 * ---------------------------------------------------------------------------
 */
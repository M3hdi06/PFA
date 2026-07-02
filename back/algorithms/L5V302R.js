"use strict";

/**
 * L5V302R — Moteur de recommandation par cooccurrence de hashtags (Muzly)
 * =======================================================================
 *
 * Principe : deux hashtags qui apparaissent souvent ensemble dans les posts
 * sont "associés". Si un utilisateur aime #jazz et que #jazz apparaît souvent
 * avec #blues, alors les posts #blues sont probablement pertinents pour lui.
 *
 * Métrique : probabilité conditionnelle
 *     force(u -> p) = P(p | u) = count(posts contenant u ET p) / count(posts contenant u)
 *
 * Deux temps de calcul :
 *   1. HORS-LIGNE (batch / cron) : refreshCooccurrenceModel() scanne tous les
 *      posts UNE fois et construit un "modèle de cooccurrence" stocké dans MongoDB.
 *   2. EN-LIGNE (à chaque requête) : recommendPostsForUser() charge ce modèle et
 *      l'utilise sans jamais recompter.
 *
 * ⚠️ Le refresh DOIT tourner avant les recommandations, sinon le modèle est vide
 *    et la découverte par cooccurrence ne fonctionne pas (voir ensureCooccurrenceModel).
 *
 * NB : les hashtags viennent d'une liste FERMÉE et prédéfinie → utilisables
 *      directement comme clés d'objet.
 */

// ===========================================================================
// CONFIG
// ===========================================================================

// Un genre est un signal plus LARGE qu'un hashtag choisi explicitement :
// on le prend en compte, mais avec un poids réduit dans le score.
const GENRE_WEIGHT = 0.6;

// Cast d'un userId reçu en chaîne vers ObjectId, si tes _id sont des ObjectId.
// On n'attaque ici que le driver natif (mongoose.connection.db), qui ne caste
// PAS automatiquement (contrairement à User.findById). On ne convertit que les
// chaînes hex de 24 caractères → les vrais _id de type string restent intacts.
const mongoose = require("mongoose");
const isHex24 = (s) => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
const toUserId = (userId) =>
  isHex24(userId) ? new mongoose.Types.ObjectId(userId) : userId;

// ===========================================================================
// PARTIE 1 — LE MODÈLE DE COOCCURRENCE (calcul hors-ligne)
// ===========================================================================

/**
 * Clé normalisée pour une paire de hashtags (ordre indifférent).
 */
const pairKey = (a, b) => (a < b ? `${a}__${b}` : `${b}__${a}`);

/**
 * Construit le modèle de cooccurrence à partir d'un ensemble de publications.
 * ⚠️ À exécuter périodiquement (batch), PAS à chaque requête.
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
    const tags = Array.isArray(post.hashtags)
      ? Array.from(new Set(post.hashtags)) // 1 hashtag = 1 fois par post
      : [];
    if (tags.length === 0) continue;

    totalPosts += 1;

    for (let i = 0; i < tags.length; i += 1) {
      const a = tags[i];
      hashtagCounts[a] = (hashtagCounts[a] || 0) + 1;

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
 * Seul endroit où la métrique est définie : pour passer à PMI ou Jaccard,
 * tu ne modifies QUE cette fonction.
 */
const cooccurrenceStrength = (u, p, model) => {
  if (u === p) return 1; // match direct : le hashtag préféré est dans le post

  const countU = model.hashtagCounts[u] || 0;
  if (countU === 0) return 0; // hashtag préféré jamais vu → aucune info

  const together = model.pairCounts[pairKey(u, p)] || 0;
  return together / countU; // P(p | u)

  // Améliorations possibles :
  // - lissage : (together + k) / (countU + k*V) pour éviter les 1.0 sur des
  //   hashtags rares (count = 1), statistiquement peu fiables ;
  // - PMI : log( P(u,p) / (P(u)*P(p)) ) pour ne pas gonfler les hashtags
  //   populaires qui cooccurrent avec tout.
};

// ===========================================================================
// PARTIE 2 — PRÉFÉRENCES UTILISATEUR (hashtags + genres)
// ===========================================================================

/**
 * Fusionne hashtags et genres en une carte pondérée { tag: poids }.
 *
 * - Hashtag choisi explicitement  → poids 1   (signal fort)
 * - Genre préféré                 → poids GENRE_WEIGHT (signal plus large)
 * - Un tag qui est à la fois genre ET hashtag garde le poids fort (1).
 *
 * ⚠️ Hypothèse : les genres utilisent le MÊME vocabulaire que les hashtags
 *    (naturel : "jazz", "rock"... sont à la fois des genres et des hashtags).
 *    Comme les posts ne portent que des `hashtags`, un genre ne peut influencer
 *    les recommandations que s'il est exprimable dans ce vocabulaire.
 *    Si tes genres sont un vocabulaire séparé, mappe-les ici vers des hashtags.
 */
const buildWeightedPreferences = (preferredHashtags, preferredGenres) => {
  const weighted = {};
  for (const g of preferredGenres) {
    weighted[g] = Math.max(weighted[g] || 0, GENRE_WEIGHT);
  }
  for (const h of preferredHashtags) {
    weighted[h] = 1; // le hashtag explicite l'emporte toujours
  }
  return weighted;
};

/**
 * Récupère les préférences d'un utilisateur et construit la carte pondérée.
 *
 * Schéma ACTUEL : le champ des préférences s'appelle `genres`. On lit donc
 * `genres` en priorité, tout en acceptant `preferredGenres` / `preferredHashtags`
 * pour rester compatible si tu ajoutes ces champs plus tard.
 *
 * Le userId est casté en ObjectId ici, et ce même _id casté est propagé dans
 * l'objet retourné → l'exclusion `$ne` de fetchCandidatePosts reçoit le bon type.
 */
const getUserPreferences = async (userId, db) => {
  const _id = toUserId(userId);

  const user = await db.collection("users").findOne(
    { _id },
    { projection: { genres: 1, preferredGenres: 1, preferredHashtags: 1 } }
  );

  const preferredGenres =
    (user && (user.genres || user.preferredGenres)) || [];
  const preferredHashtags = (user && user.preferredHashtags) || [];

  return {
    userId: _id, // ObjectId casté, réutilisé par fetchCandidatePosts
    preferredHashtags,
    preferredGenres,
    weightedTags: buildWeightedPreferences(preferredHashtags, preferredGenres),
  };
};

// ===========================================================================
// PARTIE 3 — ACCÈS AUX DONNÉES (MongoDB)
// ===========================================================================

/**
 * Étend une liste de tags préférés avec leurs voisins les plus co-occurrents.
 * Sans ça, la cooccurrence ne servirait qu'au tri, jamais à la découverte.
 * Liste de hashtags fermée et petite → balayage peu coûteux.
 */
const expandHashtagsByCooccurrence = (seedTags, model, options = {}) => {
  const { neighborsPerHashtag = 5 } = options;
  const expanded = new Set(seedTags);
  const allHashtags = Object.keys(model.hashtagCounts);

  for (const u of seedTags) {
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
 * tag préféré (hashtag OU genre) ou un de ses voisins co-occurrents.
 */
const fetchCandidatePosts = async (userPreferences, model, db, options = {}) => {
  const { weightedTags, userId } = userPreferences;
  const { candidateLimit = 200, excludeOwnPosts = true } = options;

  const seedTags = Object.keys(weightedTags); // hashtags + genres
  if (seedTags.length === 0) return [];

  const searchHashtags = expandHashtagsByCooccurrence(seedTags, model, options);

  const query = { hashtags: { $in: searchHashtags } };
  if (excludeOwnPosts) query.userId = { $ne: userId };

  return db.collection("posts").find(query).limit(candidateLimit).toArray();
};

/**
 * Charge le modèle pré-calculé depuis MongoDB.
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
 * JOB HORS-LIGNE : reconstruit le modèle à partir de TOUS les posts.
 * À brancher sur un cron (ex. chaque nuit) ou après N nouveaux posts.
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

/**
 * Garantit qu'un modèle existe : le construit UNIQUEMENT s'il est absent/vide.
 * À appeler au démarrage de l'app ou avant une démo (première exécution).
 * En production, c'est le cron (refreshCooccurrenceModel) qui prend le relais ;
 * ne t'appuie pas sur cette fonction dans le chemin d'une requête (scan complet).
 */
const ensureCooccurrenceModel = async (db) => {
  const model = await loadCooccurrenceModel(db);
  if (model.totalPosts > 0) return model;
  return refreshCooccurrenceModel(db);
};

// ===========================================================================
// PARTIE 4 — SCORING & RANKING (calcul pur, sans base → testable en isolation)
// ===========================================================================

/**
 * Score de pertinence d'UN post pour un utilisateur, dans [0, 1].
 *
 * - Pour chaque hashtag du post, on prend sa MEILLEURE connexion pondérée
 *   (max) parmi les tags préférés : poids × force de cooccurrence.
 *   → un hashtag est pertinent s'il est lié à AU MOINS une préférence.
 *   → le poids fait qu'une correspondance via un genre (0.6) compte moins
 *     qu'une correspondance via un hashtag explicite (1).
 * - On fait la MOYENNE sur les hashtags du post → anti hashtag-stuffing.
 *
 * @param {Object} weightedTags  carte { tag: poids } (hashtags + genres)
 */
const scorePost = (post, weightedTags, model) => {
  const tags = Array.isArray(post.hashtags) ? post.hashtags : [];
  const prefEntries = Object.entries(weightedTags); // [ [tag, poids], ... ]
  if (tags.length === 0 || prefEntries.length === 0) return 0;

  let sum = 0;
  for (const p of tags) {
    let best = 0;
    for (const [u, weight] of prefEntries) {
      const s = weight * cooccurrenceStrength(u, p, model);
      if (s > best) best = s;
    }
    sum += best;
  }
  return sum / tags.length;
};

/**
 * Calcule le score de chaque candidat. Fonction PURE et SYNCHRONE.
 */
const computeRecommendationScores = (userPreferences, posts, model) => {
  const { weightedTags } = userPreferences;
  return posts.map((post) => ({
    post,
    score: scorePost(post, weightedTags, model),
  }));
};

/**
 * Trie et coupe (top-N + seuil). Ne mute PAS l'entrée.
 * Conserve { post, score } → debug, explicabilité, pagination.
 */
const rankRecommendations = (scoredPosts, options = {}) => {
  const { limit = 20, minScore = 0 } = options;

  return [...scoredPosts]
    .filter((item) => item.score > minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// ===========================================================================
// PARTIE 5 — ORCHESTRATION (le pipeline public)
// ===========================================================================

/**
 * Pipeline complet : préférences + modèle → candidats → scores → classement.
 *
 * @returns {Promise<Array<{post: Object, score: number}>>}
 */
const recommendPostsForUser = async (userId, db, options = {}) => {
  const [userPreferences, model] = await Promise.all([
    getUserPreferences(userId, db),
    loadCooccurrenceModel(db),
  ]);

  // Garde-fou : sans modèle, la découverte par cooccurrence ne marche pas.
  if (model.totalPosts === 0) {
    console.warn(
      "[L5V302R] Modèle de cooccurrence VIDE. Lance refreshCooccurrenceModel(db) " +
      "(cron) ou ensureCooccurrenceModel(db) au démarrage, sinon les résultats " +
      "seront pauvres/vides."
    );
  }

  const candidatePosts = await fetchCandidatePosts(userPreferences, model, db, options);
  const scoredPosts = computeRecommendationScores(userPreferences, candidatePosts, model);
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
  ensureCooccurrenceModel,
  loadCooccurrenceModel,
  saveCooccurrenceModel,

  // Briques de calcul pures
  cooccurrenceStrength,
  scorePost,
  expandHashtagsByCooccurrence,
  buildWeightedPreferences,
};

/*
 * ---------------------------------------------------------------------------
 * EXEMPLE D'USAGE
 * ---------------------------------------------------------------------------
 *
 * // 1) Au démarrage de l'app (première fois) OU via un cron :
 * await ensureCooccurrenceModel(db);      // première exécution
 * // ...ou, planifié chaque nuit :
 * await refreshCooccurrenceModel(db);     // reconstruction complète
 *
 * // 2) Dans ton contrôleur Express :
 * const recos = await recommendPostsForUser(userId, db, { limit: 20 });
 * // recos = [{ post, score }, ...]
 *
 * // 3) Projection finale pour le frontend (imageUrl / audioUrl) :
 * const payload = recos.map(({ post, score }) => ({
 *   id: post._id,
 *   title: post.title,
 *   imageUrl: post.imageUrl,
 *   audioUrl: post.audioUrl,
 *   hashtags: post.hashtags,
 *   score,
 * }));
 * res.json(payload);
 * ---------------------------------------------------------------------------
 */

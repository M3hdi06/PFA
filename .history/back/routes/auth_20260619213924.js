const express = require("express");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { nom, email, password, genres } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
    }

    if (genres && (!Array.isArray(genres) || genres.length > 5 || genres.some((g) => typeof g !== "string"))) {
      return res.status(400).json({ success: false, message: "Les genres doivent être un tableau de 1 à 5 chaînes" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      nom,
      email,
      password: hashed,
      genres: Array.isArray(genres)
        ? genres.map((genre) => genre.trim().toLowerCase())
        : [],
    });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      user: { id: user._1? user._id : user.id, nom: user.nom, email: user.email, genres: user.genres }
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'inscription", error: error.message });
  }
});

// @POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email et mot de passe requis" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: "Connexion réussie", token, user: { id: user._id, nom: user.nom, email: user.email } });
  } catch (error) {
    console.error("Erreur connexion:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la connexion", error: error.message });
  }
});

// @GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token manquant" });

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key_prepfa");

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });

    res.status(200).json({ success: true, user: { id: user._id, nom: user.nom, email: user.email } });
  } catch (error) {
    res.status(401).json({ success: false, message: "Token invalide" });
  }
});

module.exports = router;

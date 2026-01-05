const express = require("express");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");

const router = express.Router();

// In-memory users store (simple replacement for MongoDB)
// NOTE: This is ephemeral and resets when the server restarts.
const users = [];

// Helper: find user by email
const findUserByEmail = (email) => users.find((u) => u.email === email);
const findUserById = (id) => users.find((u) => u.id === id);

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = { id: Date.now().toString(), nom, email, password: hashed, createdAt: new Date() };
    users.push(user);

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      user: { id: user.id, nom: user.nom, email: user.email }
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

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

    const token = generateToken(user.id);
    res.status(200).json({ success: true, message: "Connexion réussie", token, user: { id: user.id, nom: user.nom, email: user.email } });
  } catch (error) {
    console.error("Erreur connexion:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la connexion", error: error.message });
  }
});

// @GET /api/auth/me
router.get("/me", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token manquant" });

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key_prepfa");

    const user = findUserById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });

    res.status(200).json({ success: true, user: { id: user.id, nom: user.nom, email: user.email } });
  } catch (error) {
    res.status(401).json({ success: false, message: "Token invalide" });
  }
});

module.exports = router;

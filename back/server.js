const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const spotsRoutes = require("./routes/spots");
const postsRoutes = require("./routes/posts");
const commentsRoutes = require("./routes/comments");

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 4000;

// Configuration CORS pour accepter le frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));

// Connexion à MongoDB (optionnelle)
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connecté avec succès"))
    .catch((err) => {
      console.error("❌ Erreur de connexion MongoDB:", err.message);
      console.warn("⚠️  Le serveur continue sans MongoDB. Certaines fonctionnalités peuvent être limitées.");
    });
} else {
  console.warn("⚠️  MONGO_URI non défini. Le serveur fonctionne sans MongoDB.");
}

// Routes test
app.get("/", (req, res) => res.send("Hello Amine"));

// Routes d'authentification et spots
app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
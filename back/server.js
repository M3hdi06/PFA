const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, ".env") });

mongoose.set("bufferCommands", false);

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

// Routes test
app.get("/", (req, res) => res.send("Hello Amine"));

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Base de données indisponible. Réessaie après la connexion MongoDB."
    });
  }

  next();
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI non défini dans back/.env");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log("✅ MongoDB connecté avec succès");

  const authRoutes = require("./routes/auth");
  const spotsRoutes = require("./routes/spots");
  const postsRoutes = require("./routes/posts");
  const commentsRoutes = require("./routes/comments");

  // Routes d'authentification et spots
  app.use("/api/auth", authRoutes);
  app.use("/api/spots", spotsRoutes);
  app.use("/api/posts", postsRoutes);
  app.use("/api/comments", commentsRoutes);

  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Impossible de démarrer le backend:", err.message);
  process.exit(1);
});
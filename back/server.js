const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const spotsRoutes = require("./routes/spots");

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté avec succès"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// Routes test
app.get("/", (req, res) => res.send("Hello Amine"));

// Routes d'authentification et spots
app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRoutes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const spotsRoutes = require("./routes/spots");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Routes test
app.get("/", (req, res) => res.send("Hello Amine"));

// Routes d'authentification
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Starting server without MongoDB (mongoose removed)");

// Mount routes (auth implementation no longer requires mongoose)
app.use("/api/auth", authRoutes);
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log("Server started without MongoDB dependency");
});
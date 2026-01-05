const jwt = require("jsonwebtoken");

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key_prepfa");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// Générer un JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "secret_key_prepfa",
    { expiresIn: "7d" }
  );
};

module.exports = { authMiddleware, generateToken };

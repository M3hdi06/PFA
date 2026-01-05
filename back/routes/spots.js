const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");

// Dummy spots data
let spots = [
  {
    id: 1,
    nom: "Café du Coin",
    description: "Petit café sympa",
    category: "café",
    location: "Casablanca",
    lat: 33.5731,
    lng: -7.5898,
    rating: 4.5,
    reviews: [{ userId: 1, comment: "Super endroit !", rating: 5, createdAt: new Date() }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    nom: "Pizzeria Bella",
    description: "Pizzas délicieuses",
    category: "pizzeria",
    location: "Casablanca",
    lat: 33.5741,
    lng: -7.5908,
    rating: 4.2,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper: find spot by id
const findSpot = (id) => spots.find((s) => s.id === parseInt(id));

// GET all spots
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: spots.length,
    data: spots,
  });
});

// GET one spot by id
router.get("/:id", (req, res) => {
  const spot = findSpot(req.params.id);
  if (!spot)
    return res.status(404).json({ success: false, message: "Spot non trouvé" });

  res.status(200).json({ success: true, data: spot });
});

// GET spots by category
router.get("/category/:category", (req, res) => {
  const filtered = spots.filter((s) => s.category === req.params.category);
  res.status(200).json({ success: true, count: filtered.length, data: filtered });
});

// POST create new spot
router.post("/", authMiddleware, (req, res) => {
  const { nom, description, category, location, lat, lng, rating } = req.body;
  if (!nom || !category || !location || lat === undefined || lng === undefined)
    return res.status(400).json({ success: false, message: "Champs requis manquants" });

  const newSpot = {
    id: spots.length ? spots[spots.length - 1].id + 1 : 1,
    nom,
    description,
    category,
    location,
    lat,
    lng,
    rating: rating || 0,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  spots.push(newSpot);
  res.status(201).json({ success: true, message: "Spot créé", data: newSpot });
});

// PUT update spot
router.put("/:id", (req, res) => {
  const spot = findSpot(req.params.id);
  if (!spot)
    return res.status(404).json({ success: false, message: "Spot non trouvé" });

  Object.assign(spot, req.body, { updatedAt: new Date() });
  res.status(200).json({ success: true, message: "Spot modifié", data: spot });
});

// DELETE spot
router.delete("/:id", (req, res) => {
  const index = spots.findIndex((s) => s.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: "Spot non trouvé" });

  const removed = spots.splice(index, 1)[0];
  res.status(200).json({ success: true, message: "Spot supprimé", data: removed });
});

// POST add review
router.post("/:id/reviews", (req, res) => {
  const spot = findSpot(req.params.id);
  if (!spot) return res.status(404).json({ success: false, message: "Spot non trouvé" });

  const { userId, comment, rating } = req.body;
  if (!userId || rating === undefined)
    return res.status(400).json({ success: false, message: "userId et rating requis" });

  spot.reviews.push({ userId, comment, rating, createdAt: new Date() });
  spot.rating =
    spot.reviews.reduce((sum, r) => sum + r.rating, 0) / spot.reviews.length;

  res.status(201).json({ success: true, message: "Review ajoutée", data: spot });
});

module.exports = router;

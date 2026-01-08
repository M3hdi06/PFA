const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const Spot = require("../models/Spot");

// GET all spots
router.get("/", async (req, res) => {
  try {
    const spots = await Spot.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET trending spots (top 5) - DOIT ÊTRE AVANT /:id
router.get("/trending/top", async (req, res) => {
  try {
    const spots = await Spot.find().sort({ createdAt: -1 });
    
    const trendingSpots = spots
      .map(spot => ({
        ...spot.toObject(),
        likesCount: spot.likes ? spot.likes.length : 0
      }))
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      count: trendingSpots.length,
      data: trendingSpots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET one spot by id
router.get("/:id", async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    res.status(200).json({ success: true, data: spot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET spots by category
router.get("/category/:category", async (req, res) => {
  try {
    const spots = await Spot.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: spots.length, data: spots });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// POST create new spot
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { nom, description, category, location, lat, lng, rating } = req.body;
    if (!nom || !category || !location || lat === undefined || lng === undefined)
      return res.status(400).json({ success: false, message: "Champs requis manquants" });

    const newSpot = new Spot({
      nom,
      description,
      category,
      location,
      lat,
      lng,
      rating: rating || 0,
      createdBy: req.user.userId
    });

    await newSpot.save();
    res.status(201).json({ success: true, message: "Spot créé", data: newSpot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// PUT update spot
router.put("/:id", async (req, res) => {
  try {
    const spot = await Spot.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    res.status(200).json({ success: true, message: "Spot modifié", data: spot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// DELETE spot
router.delete("/:id", async (req, res) => {
  try {
    const spot = await Spot.findByIdAndDelete(req.params.id);
    
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    res.status(200).json({ success: true, message: "Spot supprimé", data: spot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// POST add review
router.post("/:id/reviews", async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    const { userId, comment, rating } = req.body;
    if (!userId || rating === undefined)
      return res.status(400).json({ success: false, message: "userId et rating requis" });

    spot.reviews.push({ userId, comment, rating });
    
    // Recalculate average rating
    spot.rating = spot.reviews.reduce((sum, r) => sum + r.rating, 0) / spot.reviews.length;

    await spot.save();
    res.status(201).json({ success: true, message: "Review ajoutée", data: spot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// POST like a spot
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    const userId = req.user.userId;

    if (spot.likes.includes(userId)) {
      return res.status(400).json({ success: false, message: "Vous avez déjà liké ce spot" });
    }

    spot.likes.push(userId);
    await spot.save();

    res.status(200).json({ 
      success: true, 
      message: "Spot liké", 
      likesCount: spot.likes.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// DELETE unlike a spot
router.delete("/:id/like", authMiddleware, async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot)
      return res.status(404).json({ success: false, message: "Spot non trouvé" });

    const userId = req.user.userId;

    if (!spot.likes.includes(userId)) {
      return res.status(400).json({ success: false, message: "Vous n'avez pas liké ce spot" });
    }

    spot.likes = spot.likes.filter(id => id.toString() !== userId.toString());
    await spot.save();

    res.status(200).json({ 
      success: true, 
      message: "Like retiré", 
      likesCount: spot.likes.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;

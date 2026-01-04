const express = require("express");
const router = express.Router();
const Spot = require("../models/Spot");

// ✅ GET tous les spots
router.get("/", async (req, res) => {
  try {
    const spots = await Spot.find().populate("reviews.userId", "nom email");
    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ GET un spot par ID
router.get("/:id", async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id).populate("reviews.userId", "nom email");
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: "Spot non trouvé",
      });
    }
    res.status(200).json({
      success: true,
      data: spot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ GET spots filtrés par catégorie
router.get("/category/:category", async (req, res) => {
  try {
    const spots = await Spot.find({ category: req.params.category }).populate("reviews.userId", "nom email");
    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ POST créer un nouveau spot
router.post("/", async (req, res) => {
  try {
    const { nom, description, category, location, lat, lng, rating } = req.body;

    // Valider les champs requis
    if (!nom || !category || !location || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Les champs nom, category, location, lat et lng sont requis",
      });
    }

    const spot = new Spot({
      nom,
      description,
      category,
      location,
      lat,
      lng,
      rating: rating || 0,
    });

    await spot.save();
    res.status(201).json({
      success: true,
      message: "Spot créé avec succès",
      data: spot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ PUT modifier un spot
router.put("/:id", async (req, res) => {
  try {
    const spot = await Spot.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: "Spot non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Spot modifié avec succès",
      data: spot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ DELETE supprimer un spot
router.delete("/:id", async (req, res) => {
  try {
    const spot = await Spot.findByIdAndDelete(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: "Spot non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Spot supprimé avec succès",
      data: spot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ POST ajouter une review à un spot
router.post("/:id/reviews", async (req, res) => {
  try {
    const { userId, comment, rating } = req.body;

    if (!userId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId et rating sont requis",
      });
    }

    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: "Spot non trouvé",
      });
    }

    spot.reviews.push({
      userId,
      comment,
      rating,
    });

    // Calculer le rating moyen
    const avgRating = spot.reviews.reduce((acc, review) => acc + review.rating, 0) / spot.reviews.length;
    spot.rating = avgRating;

    await spot.save();

    res.status(201).json({
      success: true,
      message: "Review ajoutée avec succès",
      data: spot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

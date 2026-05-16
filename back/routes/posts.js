const express = require("express");
const Post = require("../models/Post");

const router = express.Router();

// GET /api/posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "nom email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error("Erreur récupération posts:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des publications",
      error: error.message
    });
  }
});

// POST /api/posts
router.post("/", async (req, res) => {
  try {
    const { userId, text } = req.body;

    if (!userId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "userId et text sont requis"
      });
    }

    const post = await Post.create({
      userId,
      text: text.trim()
    });

    const populated = await Post.findById(post._id).populate("userId", "nom email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("Erreur création post:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la publication",
      error: error.message
    });
  }
});

module.exports = router;

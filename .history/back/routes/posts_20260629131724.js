const express = require("express");
const Post = require("../models/Post");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

const hasUserLiked = (likes, userId) =>
  likes.some((id) => id.toString() === userId.toString());

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

// POST /api/posts/:id/like
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Publication introuvable" });
    }

    const userId = req.user.userId;

    if (hasUserLiked(post.likes, userId)) {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà liké cette publication"
      });
    }

    post.likes.push(userId);
    await post.save();

    const populated = await Post.findById(post._id).populate("userId", "nom email");

    res.status(200).json({
      success: true,
      message: "Publication likée",
      likesCount: post.likes.length,
      data: populated
    });
  } catch (error) {
    console.error("Erreur like post:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du like",
      error: error.message
    });
  }
});

// DELETE /api/posts/:id/like
router.delete("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Publication introuvable" });
    }

    const userId = req.user.userId;

    if (!hasUserLiked(post.likes, userId)) {
      return res.status(400).json({
        success: false,
        message: "Vous n'avez pas liké cette publication"
      });
    }

    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    await post.save();

    const populated = await Post.findById(post._id).populate("userId", "nom email");

    res.status(200).json({
      success: true,
      message: "Like retiré",
      likesCount: post.likes.length,
      data: populated
    });
  } catch (error) {
    console.error("Erreur unlike post:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du retrait du like",
      error: error.message
    });
  }
});

module.exports = router;

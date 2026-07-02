const express = require("express");
const Comment = require("../models/comment");

const router = express.Router();

// POST /api/comments
router.post("/", async (req, res) => {
  try {
    const { postId, userId, text } = req.body;

    if (!postId || !userId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "postId, userId et text sont requis"
      });
    }

    const comment = await Comment.create({
      postId,
      userId,
      text: text.trim()
    });

    const populated = await Comment.findById(comment._id).populate("userId", "nom email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("Erreur création commentaire:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du commentaire",
      error: error.message
    });
  }
});

// GET /api/comments?postId=...
router.get("/", async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId est requis"
      });
    }

    const comments = await Comment.find({ postId })
      .populate("userId", "nom email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error("Erreur récupération commentaires:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commentaires",
      error: error.message
    });
  }
});

module.exports = router;

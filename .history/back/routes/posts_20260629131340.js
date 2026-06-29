const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/Post");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const hasUserLiked = (likes, userId) =>
  likes.some((id) => id.toString() === userId.toString());

const parseHashtags = (value) => {
  if (!value) return [];

  return String(value)
    .split(/[,\s]+/)
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean);
};

const uploadToCloudinary = (file, resourceType = "image") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType === "audio" ? "video" : "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });

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
router.post("/", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId, title, text } = req.body;
    const hashtags = parseHashtags(req.body.hashtags);
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!userId || (!title?.trim() && !text?.trim() && !imageFile && !audioFile)) {
      return res.status(400).json({
        success: false,
        message: "userId, un titre/texte ou un média est requis"
      });
    }

    const media = {};

    if (imageFile) {
      const uploadedImage = await uploadToCloudinary(imageFile, "image");
      media.imageUrl = uploadedImage.secure_url;
      media.imagePublicId = uploadedImage.public_id;
    }

    if (audioFile) {
      const uploadedAudio = await uploadToCloudinary(audioFile, "audio");
      media.audioUrl = uploadedAudio.secure_url;
      media.audioPublicId = uploadedAudio.public_id;
    }

    const post = await Post.create({
      userId,
      title: title?.trim() || "",
      text: text?.trim() || "",
      hashtags,
      media
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

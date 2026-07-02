const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/Post");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non pris en charge"));
    }
  }
});

const uploadToCloudinary = (file, resourceType) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "prepfa/posts",
      resource_type: resourceType,
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  );

  stream.end(file.buffer);
});

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
router.post("/", upload.fields([{ name: "image", maxCount: 1 }, { name: "audio", maxCount: 1 }]), async (req, res) => {
  try {
    const { userId, text, title = "", hashtags = "" } = req.body;
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!userId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "userId et text sont requis"
      });
    }

    const parsedHashtags = hashtags
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    let imageUrl = "";
    let audioUrl = "";

    if (imageFile) {
      const uploadedImage = await uploadToCloudinary(imageFile, "image");
      imageUrl = uploadedImage.secure_url;
    }

    if (audioFile) {
      const uploadedAudio = await uploadToCloudinary(audioFile, "video");
      audioUrl = uploadedAudio.secure_url;
    }

    let authorName = (req.body.authorName || "").trim();
    if (!authorName) {
      const author = await User.findById(userId).select("nom");
      if (author) {
        authorName = author.nom;
      }
    }

    const post = await Post.create({
      userId,
      title: title?.trim() || text.trim().slice(0, 100),
      authorName,
      text: text.trim(),
      hashtags: parsedHashtags,
      imageUrl,
      audioUrl,
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

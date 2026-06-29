const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: ""
  },
  text: {
    type: String,
    trim: true,
    default: ""
  },
  hashtags: [{
    type: String,
    trim: true,
    default: []
  }],
  media: {
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    audioPublicId: { type: String, default: "" }
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model("Post", postSchema);

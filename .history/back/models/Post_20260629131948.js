const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    trim: true,
    required: true
  },
  hashtags: {
    type: [String],
    default: []
  },
  imageUrl: {
    type: String,
    default: ""
  },
  audioUrl: {
    type: String,
    default: ""
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

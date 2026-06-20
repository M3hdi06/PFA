const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  genres: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: ["Browser", "Musician", "Band", "Investor"],
    default: "Browser"
  },
  profileOptions: {
    type: [String],
    default: []
  },
  searchGoal: {
    type: String,
    enum: ["complete", "wantComplete"],
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const GROUP_STATUS = ["complete", "wantMembers"];

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
  groupStatus: {
    type: String,
    enum: GROUP_STATUS,
    default: function () {
      return this.role === "Investor" ? "complete" : "wantMembers";
    },
    validate: {
      validator: function (value) {
        if (this.role === "Investor") {
          return value === "complete";
        }

        return GROUP_STATUS.includes(value);
      },
      message: "groupStatus invalide"
    },
    alias: "searchGoal"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const spotSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom du spot est requis"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['café', 'restaurant', 'pâtisserie', 'bar', 'pizzeria', 'glacier'],
    required: [true, "La catégorie est requise"],
  },
  location: {
    type: String,
    required: [true, "La localisation est requise"],
  },
  lat: {
    type: Number,
    required: [true, "La latitude est requise"],
  },
  lng: {
    type: Number,
    required: [true, "La longitude est requise"],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: String,
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Spot", spotSchema);

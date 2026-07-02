const express = require("express");
const { getRecommendations } = require("../controllers/recommendationsController");

const router = express.Router();

router.get("/recommendations/:userId", getRecommendations);

module.exports = router;

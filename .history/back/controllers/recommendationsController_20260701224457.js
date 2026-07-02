const { recommendPostsForUser } = require("../algorithms/L5V302R");

const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId est requis"
      });
    }

    const recommendations = await recommendPostsForUser(userId, req.db);

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error("Erreur recommandations:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des recommandations",
      error: error.message
    });
  }
};

module.exports = {
  getRecommendations
};

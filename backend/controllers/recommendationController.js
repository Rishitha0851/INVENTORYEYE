const ReorderRecommendation = require('../models/ReorderRecommendation');
const { generateRecommendations } = require('../services/recommendationService');

/**
 * GET /api/recommendations
 * Retrieves all current recommendations.
 */
const getRecommendations = async (req, res) => {
  try {
    const recommendations = await ReorderRecommendation.find({}).sort({ reorderPriority: 1 });
    // sort priority doesn't work perfectly alphabetically, but frontend will handle sorting by severity
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({ message: 'Server Error fetching recommendations' });
  }
};

/**
 * POST /api/recommendations/generate
 * Manually trigger recommendation generation based on latest Forecast & Product stock.
 */
const generateNewRecommendations = async (req, res) => {
  try {
    const updatedRecs = await generateRecommendations();
    res.json({ message: 'Recommendations generated successfully', data: updatedRecs });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ message: 'Server Error generating recommendations' });
  }
};

/**
 * GET /api/recommendations/critical
 * Retrieves only Critical recommendations.
 */
const getCriticalRecommendations = async (req, res) => {
  try {
    const recs = await ReorderRecommendation.find({ reorderPriority: 'Critical' });
    res.json(recs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching critical recommendations' });
  }
};

/**
 * GET /api/recommendations/high
 * Retrieves only High priority recommendations.
 */
const getHighRecommendations = async (req, res) => {
  try {
    const recs = await ReorderRecommendation.find({ reorderPriority: 'High' });
    res.json(recs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching high recommendations' });
  }
};

module.exports = { 
  getRecommendations, 
  generateNewRecommendations, 
  getCriticalRecommendations, 
  getHighRecommendations 
};

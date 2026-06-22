const express = require('express');
const router = express.Router();
const { 
  getRecommendations, 
  generateNewRecommendations,
  getCriticalRecommendations,
  getHighRecommendations
} = require('../controllers/recommendationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getRecommendations);
router.post('/generate', protect, generateNewRecommendations);
router.get('/critical', protect, getCriticalRecommendations);
router.get('/high', protect, getHighRecommendations);

module.exports = router;

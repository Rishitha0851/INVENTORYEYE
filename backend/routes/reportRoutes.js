const express = require('express');
const router = express.Router();
const { 
  getInventoryReport, 
  getForecastReport,
  getRecommendationReport,
  getExecutiveSummary
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/inventory', protect, getInventoryReport);
router.get('/forecast', protect, getForecastReport);
router.get('/recommendations', protect, getRecommendationReport);
router.get('/summary', protect, getExecutiveSummary);

module.exports = router;

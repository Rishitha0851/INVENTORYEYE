const express = require('express');
const router = express.Router();
const { 
  getForecasts, 
  getForecastSummary, 
  getForecastHistory, 
  getProductForecast, 
  generateForecast 
} = require('../controllers/forecastController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getForecasts);
router.get('/summary', protect, getForecastSummary);
router.get('/history', protect, getForecastHistory);
router.get('/product/:id', protect, getProductForecast);
router.post('/generate', protect, generateForecast);

module.exports = router;

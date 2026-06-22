const Forecast = require('../models/Forecast');
const ForecastHistory = require('../models/ForecastHistory');
const Product = require('../models/Product');
const { generateForecasts } = require('../services/forecastService');

/**
 * GET /api/forecasts
 * Retrieves current demand forecasts for all products.
 */
const getForecasts = async (req, res) => {
  try {
    const forecasts = await Forecast.find({});
    res.json(forecasts);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: 'Server Error fetching forecasts' });
  }
};

/**
 * GET /api/forecasts/history
 * Retrieves historical forecasts.
 */
const getForecastHistory = async (req, res) => {
  try {
    const history = await ForecastHistory.find({}).sort({ forecastDate: -1 });
    res.json(history);
  } catch (error) {
    console.error('Forecast history error:', error);
    res.status(500).json({ message: 'Server Error fetching forecast history' });
  }
};

/**
 * GET /api/forecasts/product/:id
 * Retrieves current forecast for a specific product.
 */
const getProductForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findOne({ product: req.params.id });
    if (!forecast) return res.status(404).json({ message: 'Forecast not found for this product' });
    res.json(forecast);
  } catch (error) {
    console.error('Forecast product error:', error);
    res.status(500).json({ message: 'Server Error fetching product forecast' });
  }
};

/**
 * POST /api/forecasts/generate
 * Manually trigger forecast recalculation based on SalesHistory.
 */
const generateForecast = async (req, res) => {
  try {
    await generateForecasts();
    const updatedForecasts = await Forecast.find({});
    res.json({ message: 'Forecasts generated successfully', data: updatedForecasts });
  } catch (error) {
    console.error('Generate forecast error:', error);
    res.status(500).json({ message: 'Server Error generating forecasts' });
  }
};

/**
 * GET /api/forecasts/summary
 * High-level summary KPIs for the dashboard header cards.
 */
const getForecastSummary = async (req, res) => {
  try {
    const forecasts = await Forecast.find({});
    const totalProducts = forecasts.length;
    const atRisk = forecasts.filter(f => f.daysUntilStockout !== null && f.daysUntilStockout <= 7).length;
    const outOfStock = forecasts.filter(f => f.currentStock === 0).length;

    let avgConfidence = 0;
    if (totalProducts > 0) {
      avgConfidence = Math.round(forecasts.reduce((sum, f) => sum + f.overallConfidence, 0) / totalProducts);
    }

    res.json({ totalProducts, atRisk, outOfStock, avgConfidence });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getForecasts, getForecastHistory, getProductForecast, generateForecast, getForecastSummary };

const mongoose = require('mongoose');

const weeklyForecastSchema = new mongoose.Schema({
  week: { type: String }, // e.g. "Week 1", "Week 2"
  expectedDemand: { type: Number },
  confidence: { type: Number }, // 0–100
});

const monthlyForecastSchema = new mongoose.Schema({
  month: { type: String }, // e.g. "Jul 2026"
  expectedDemand: { type: Number },
  confidence: { type: Number },
});

const forecastSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  currentStock: { type: Number, required: true },
  reorderPoint: { type: Number, required: true },
  avgWeeklyDemand: { type: Number },
  avgMonthlyDemand: { type: Number },
  weeklyForecasts: [weeklyForecastSchema],
  monthlyForecasts: [monthlyForecastSchema],
  trendDirection: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  trendPercent: { type: Number, default: 0 },
  daysUntilStockout: { type: Number },
  overallConfidence: { type: Number, default: 75 }, // 0–100
  insights: [{ type: String }],
  seasonalPeak: { type: String }, // e.g. "Q4"
  generatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const Forecast = mongoose.model('Forecast', forecastSchema);
module.exports = Forecast;

const mongoose = require('mongoose');

const forecastHistorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String }, // optional denormalization
  forecastDate: { type: Date, required: true, default: Date.now },
  weeklyPrediction: { type: Number, required: true },
  monthlyPrediction: { type: Number, required: true },
  confidenceScore: { type: Number, required: true }, // 0 - 100
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  generatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

forecastHistorySchema.index({ product: 1, forecastDate: -1 });

const ForecastHistory = mongoose.model('ForecastHistory', forecastHistorySchema);
module.exports = ForecastHistory;

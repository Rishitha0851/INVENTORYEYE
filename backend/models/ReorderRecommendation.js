const mongoose = require('mongoose');

const reorderRecommendationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  category: { type: String },
  supplier: { type: String },
  currentStock: { type: Number, required: true },
  minimumThreshold: { type: Number, required: true },
  predictedWeeklyDemand: { type: Number, required: true },
  predictedMonthlyDemand: { type: Number, required: true },
  recommendedOrderQuantity: { type: Number, required: true },
  reorderPriority: { 
    type: String, 
    enum: ['Critical', 'High', 'Medium', 'Low'], 
    required: true 
  },
  estimatedDaysRemaining: { type: Number }, // null if no demand
  expectedStockoutDate: { type: Date },
  recommendationReason: { type: String },
  confidenceScore: { type: Number, default: 80 },
  status: { 
    type: String, 
    enum: ['Pending', 'Ordered', 'Dismissed'], 
    default: 'Pending' 
  },
  generatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const ReorderRecommendation = mongoose.model('ReorderRecommendation', reorderRecommendationSchema);
module.exports = ReorderRecommendation;

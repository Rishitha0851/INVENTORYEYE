const Product = require('../models/Product');
const Forecast = require('../models/Forecast');
const ReorderRecommendation = require('../models/ReorderRecommendation');

/**
 * Combine Product and Forecast data to generate smart reorder recommendations.
 */
const generateRecommendations = async () => {
  try {
    const products = await Product.find({});
    const forecasts = await Forecast.find({});

    const now = new Date();
    const recommendations = [];

    for (const product of products) {
      const forecast = forecasts.find(f => f.product.toString() === product._id.toString());
      
      const predictedWeeklyDemand = forecast ? forecast.avgWeeklyDemand : Math.round((product.reorderPoint / 30) * 7) || 0;
      const predictedMonthlyDemand = forecast ? forecast.avgMonthlyDemand : Math.round(product.reorderPoint) || 0;
      const confidenceScore = forecast ? forecast.overallConfidence : 50;

      // Calculate Daily Demand
      const dailyDemand = predictedWeeklyDemand / 7;

      // Calculate Days Remaining
      let estimatedDaysRemaining = null;
      let expectedStockoutDate = null;
      
      if (product.stock > 0 && dailyDemand > 0) {
        estimatedDaysRemaining = Math.round(product.stock / dailyDemand);
        expectedStockoutDate = new Date(now);
        expectedStockoutDate.setDate(now.getDate() + estimatedDaysRemaining);
      } else if (product.stock <= 0) {
        estimatedDaysRemaining = 0;
        expectedStockoutDate = now;
      }

      // Priority Logic
      let priority = 'Low';
      if (product.stock <= 0) {
        priority = 'Critical';
      } else if (product.stock < product.reorderPoint) {
        priority = 'High';
      } else if (estimatedDaysRemaining !== null && estimatedDaysRemaining < 7) {
        priority = 'High';
      } else if (estimatedDaysRemaining !== null && estimatedDaysRemaining < 14) {
        priority = 'Medium';
      }

      // Recommended Order Quantity = (Predicted Monthly Demand * 1.2) - Current Stock
      // Include 20% safety stock buffer
      let recommendedOrderQuantity = Math.max(0, Math.round((predictedMonthlyDemand * 1.2) - product.stock));
      
      // AI Insight generation
      let recommendationReason = `${product.name} inventory level is healthy.`;
      if (priority === 'Critical') {
        recommendationReason = `⚠️ ${product.name} is completely out of stock. Order immediately!`;
      } else if (priority === 'High' && estimatedDaysRemaining !== null) {
        recommendationReason = `⚠️ ${product.name} will run out within ${estimatedDaysRemaining} days.`;
      } else if (priority === 'Medium') {
        recommendationReason = `Consider restocking ${product.name} to maintain safety levels.`;
      }

      // Update or create recommendation
      const recData = {
        product: product._id,
        productName: product.name,
        category: product.category,
        supplier: product.supplier,
        currentStock: product.stock,
        minimumThreshold: product.reorderPoint,
        predictedWeeklyDemand,
        predictedMonthlyDemand,
        recommendedOrderQuantity,
        reorderPriority: priority,
        estimatedDaysRemaining,
        expectedStockoutDate,
        recommendationReason,
        confidenceScore,
        generatedAt: now,
      };

      recommendations.push(recData);

      await ReorderRecommendation.findOneAndUpdate(
        { product: product._id },
        recData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error in generateRecommendations service:', error);
    throw error;
  }
};

module.exports = {
  generateRecommendations
};

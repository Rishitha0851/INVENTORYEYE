const Product = require('../models/Product');
const Forecast = require('../models/Forecast');
const ForecastHistory = require('../models/ForecastHistory');
const ReorderRecommendation = require('../models/ReorderRecommendation');
const Report = require('../models/Report');

/**
 * Generate and store the Inventory Report
 */
const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({});
    
    let totalValue = 0;
    const categories = {};
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalValue += (p.price * p.stock);
      categories[p.category] = (categories[p.category] || 0) + 1;
      
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock <= p.reorderPoint) lowStockCount++;
    });

    const data = {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoryDistribution: categories,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        stock: p.stock,
        price: p.price,
        value: p.price * p.stock,
        status: p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderPoint ? 'Low Stock' : 'Healthy'
      }))
    };

    // Store in DB
    const report = await Report.create({ type: 'Inventory', data });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating inventory report', error });
  }
};

/**
 * Generate and store the Forecast Report
 */
const getForecastReport = async (req, res) => {
  try {
    const forecasts = await Forecast.find({});
    
    let totalWeeklyDemand = 0;
    let totalMonthlyDemand = 0;
    let avgConfidence = 0;

    if (forecasts.length > 0) {
      totalWeeklyDemand = forecasts.reduce((acc, f) => acc + f.avgWeeklyDemand, 0);
      totalMonthlyDemand = forecasts.reduce((acc, f) => acc + f.avgMonthlyDemand, 0);
      avgConfidence = Math.round(forecasts.reduce((acc, f) => acc + f.overallConfidence, 0) / forecasts.length);
    }

    const data = {
      totalWeeklyDemand,
      totalMonthlyDemand,
      avgConfidence,
      forecasts: forecasts.map(f => ({
        id: f.product,
        name: f.productName,
        weeklyDemand: f.avgWeeklyDemand,
        monthlyDemand: f.avgMonthlyDemand,
        confidence: f.overallConfidence,
        trend: f.trendDirection
      }))
    };

    const report = await Report.create({ type: 'Forecast', data });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating forecast report', error });
  }
};

/**
 * Generate and store the Recommendation Report
 */
const getRecommendationReport = async (req, res) => {
  try {
    const recommendations = await ReorderRecommendation.find({});
    
    const criticalCount = recommendations.filter(r => r.reorderPriority === 'Critical').length;
    const highCount = recommendations.filter(r => r.reorderPriority === 'High').length;
    const totalRecommendedQuantity = recommendations.reduce((acc, r) => acc + r.recommendedOrderQuantity, 0);

    const priorities = { Critical: criticalCount, High: highCount, Medium: 0, Low: 0 };
    recommendations.forEach(r => {
      if(r.reorderPriority === 'Medium') priorities.Medium++;
      if(r.reorderPriority === 'Low') priorities.Low++;
    });

    const data = {
      totalRecommendations: recommendations.length,
      criticalCount,
      highCount,
      totalRecommendedQuantity,
      priorityDistribution: priorities,
      recommendations: recommendations.map(r => ({
        id: r.product,
        name: r.productName,
        priority: r.reorderPriority,
        currentStock: r.currentStock,
        recommendedQuantity: r.recommendedOrderQuantity,
        daysRemaining: r.estimatedDaysRemaining,
        supplier: r.supplier || 'N/A'
      }))
    };

    const report = await Report.create({ type: 'Recommendation', data });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating recommendation report', error });
  }
};

/**
 * Generate and store the Executive Summary Report
 */
const getExecutiveSummary = async (req, res) => {
  try {
    const products = await Product.find({});
    const forecasts = await Forecast.find({});
    const recommendations = await ReorderRecommendation.find({});

    const totalProducts = products.length;
    let inventoryValue = 0;
    const categoryDistribution = {};
    
    products.forEach(p => {
      inventoryValue += (p.price * p.stock);
      categoryDistribution[p.category] = (categoryDistribution[p.category] || 0) + 1;
    });

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.reorderPoint).length;
    
    const healthyCount = totalProducts - outOfStock - lowStock;
    let healthScore = 0;
    if (totalProducts > 0) {
      healthScore = Math.round(((healthyCount * 1 + lowStock * 0.5) / totalProducts) * 100);
    }

    let totalForecastDemand = 0;
    forecasts.forEach(f => totalForecastDemand += f.avgMonthlyDemand);

    const avgForecastConfidence = forecasts.length > 0 
      ? Math.round(forecasts.reduce((acc, f) => acc + f.overallConfidence, 0) / forecasts.length)
      : 0;

    const totalRecommendations = recommendations.length;
    const criticalReorders = recommendations.filter(r => r.reorderPriority === 'Critical').length;

    const priorityDistribution = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    recommendations.forEach(r => {
      priorityDistribution[r.reorderPriority] = (priorityDistribution[r.reorderPriority] || 0) + 1;
    });

    const data = {
      totalProducts,
      totalInventoryValue: inventoryValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalForecastDemand,
      forecastAccuracy: avgForecastConfidence,
      totalRecommendations,
      criticalReorders,
      inventoryHealthScore: healthScore,
      productsAtRisk: outOfStock + lowStock,
      inventoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })),
      priorityDistribution: Object.entries(priorityDistribution).map(([name, value]) => ({ name, value })),
      forecastTrends: forecasts.map(f => ({ name: f.productName.substring(0, 10), demand: f.avgMonthlyDemand })),
      insights: [
        `Inventory health is currently ${healthScore}%.`,
        `${outOfStock + lowStock} products are at risk of stockout.`,
        `Forecast accuracy remains around ${avgForecastConfidence}%.`,
        criticalReorders > 0 ? `Immediate reorder recommended for ${criticalReorders} critical items.` : `No critical reorders needed.`
      ]
    };

    const report = await Report.create({ type: 'ExecutiveSummary', data });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating executive summary', error });
  }
};

module.exports = {
  getInventoryReport,
  getForecastReport,
  getRecommendationReport,
  getExecutiveSummary
};

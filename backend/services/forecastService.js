const Product = require('../models/Product');
const SalesHistory = require('../models/SalesHistory');
const ForecastHistory = require('../models/ForecastHistory');
const Forecast = require('../models/Forecast'); // We will keep updating the current forecast

/**
 * Generate synthetic sales data for the last 90 days if the DB is empty.
 */
const generateDemoSalesData = async () => {
  try {
    const count = await SalesHistory.countDocuments();
    if (count > 0) return;

    const products = await Product.find({});
    if (!products.length) return;

    console.log('Seeding demo sales data for last 90 days...');
    const salesToInsert = [];
    const now = new Date();

    for (const product of products) {
      // Use product _id to seed deterministic random behavior
      const seed = parseInt(product._id.toString().slice(-6), 16);
      const baseDemand = Math.max(1, Math.round(product.reorderPoint * 0.8));

      for (let i = 0; i < 90; i++) {
        const saleDate = new Date(now);
        saleDate.setDate(now.getDate() - i);

        // Add some random noise and a slight weekly seasonality
        const dayOfWeek = saleDate.getDay();
        const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 0.9;
        
        // Random variance ±30%
        const randomFactor = 0.7 + ((Math.sin(seed + i) + 1) / 2) * 0.6;
        
        let quantitySold = Math.round(baseDemand * weekendMultiplier * randomFactor);
        
        // Sometimes 0 sales
        if (Math.sin(seed * i) > 0.8) {
          quantitySold = 0;
        }

        if (quantitySold > 0) {
          salesToInsert.push({
            product: product._id,
            productName: product.name,
            quantitySold,
            saleDate,
            revenue: quantitySold * product.price,
          });
        }
      }
    }

    if (salesToInsert.length > 0) {
      await SalesHistory.insertMany(salesToInsert);
      console.log(`Seeded ${salesToInsert.length} sales records.`);
    }
  } catch (error) {
    console.error('Error generating demo sales data:', error);
  }
};

/**
 * Generate natural language AI insights.
 */
const generateAIInsights = (productName, currentStock, reorderPoint, trend, trendPercent, daysUntilStockout) => {
  const insights = [];

  if (trend === 'up' && trendPercent > 10) {
    insights.push(`${productName} demand expected to increase by ${Math.round(trendPercent)}% next week.`);
  } else if (trend === 'down' && trendPercent > 10) {
    insights.push(`${productName} demand is slowing down, decreasing by ${Math.round(trendPercent)}%.`);
  } else {
    insights.push(`${productName} demand is stable.`);
  }

  if (daysUntilStockout !== null) {
    if (daysUntilStockout <= 0 || currentStock <= 0) {
      insights.push(`⚠️ ${productName} is currently out of stock or critical.`);
    } else if (daysUntilStockout <= 7) {
      insights.push(`⚠️ ${productName} stock may run out within ${daysUntilStockout} days.`);
    } else if (daysUntilStockout <= 14) {
      insights.push(`${productName} needs restocking soon (safe for ~${daysUntilStockout} days).`);
    }
  }

  // Stock vs Reorder point
  if (currentStock > 0 && currentStock <= reorderPoint) {
    insights.push(`⚠️ ${productName} stock is below the recommended reorder point of ${reorderPoint}.`);
  }

  // Recommended stock increase
  if (trend === 'up' && currentStock < reorderPoint * 1.5) {
    insights.push(`Consider increasing order quantity for ${productName} to meet rising demand.`);
  }

  return insights;
};

/**
 * Recalculate forecasts for all products based on SalesHistory.
 */
const generateForecasts = async () => {
  const products = await Product.find({});
  const now = new Date();

  for (const product of products) {
    // 1. Fetch past 30 days of sales
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentSales = await SalesHistory.find({
      product: product._id,
      saleDate: { $gte: thirtyDaysAgo }
    }).sort({ saleDate: -1 });

    // Calculate moving average
    let total30 = 0;
    let totalLast7 = 0;
    let totalPrev7 = 0;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    recentSales.forEach(sale => {
      total30 += sale.quantitySold;
      if (sale.saleDate >= sevenDaysAgo) {
        totalLast7 += sale.quantitySold;
      } else if (sale.saleDate >= fourteenDaysAgo && sale.saleDate < sevenDaysAgo) {
        totalPrev7 += sale.quantitySold;
      }
    });

    // Averages
    const avgDaily30 = total30 / 30;
    const avgDailyLast7 = totalLast7 / 7;
    const avgDailyPrev7 = totalPrev7 / 7;

    // 2. Trend Analysis
    let trendDirection = 'stable';
    let trendPercent = 0;

    if (avgDailyPrev7 > 0) {
      const diff = avgDailyLast7 - avgDailyPrev7;
      trendPercent = (Math.abs(diff) / avgDailyPrev7) * 100;
      if (diff > (avgDailyPrev7 * 0.05)) {
        trendDirection = 'up';
      } else if (diff < -(avgDailyPrev7 * 0.05)) {
        trendDirection = 'down';
      }
    }

    // 3. Forecast Predictions
    // Base future daily demand on last 7 days + trend adjustment
    const projectedDailyDemand = avgDailyLast7 > 0 ? avgDailyLast7 : avgDaily30 > 0 ? avgDaily30 : (product.reorderPoint / 30);
    
    const avgWeeklyDemand = Math.round(projectedDailyDemand * 7);
    const avgMonthlyDemand = Math.round(projectedDailyDemand * 30);

    // 4. Stock Depletion Estimation
    let daysUntilStockout = null;
    if (product.stock > 0 && projectedDailyDemand > 0) {
      daysUntilStockout = Math.round(product.stock / projectedDailyDemand);
    } else if (product.stock <= 0) {
      daysUntilStockout = 0;
    }

    // 5. Confidence Score
    // Calculate variance in last 7 days to estimate confidence
    let variance = 0;
    if (recentSales.length > 0) {
      const salesLast7Days = Array(7).fill(0);
      recentSales.forEach(sale => {
        if (sale.saleDate >= sevenDaysAgo) {
          // approx day mapping
          const dayIdx = Math.floor((now - sale.saleDate) / (1000 * 60 * 60 * 24));
          if (dayIdx >= 0 && dayIdx < 7) {
            salesLast7Days[dayIdx] += sale.quantitySold;
          }
        }
      });
      const mean = salesLast7Days.reduce((a,b)=>a+b, 0) / 7;
      variance = salesLast7Days.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 7;
    }
    
    // Higher variance = lower confidence. Cap between 50 and 98
    const stdDev = Math.sqrt(variance);
    let confidenceScore = 95 - (stdDev / (projectedDailyDemand || 1)) * 10;
    confidenceScore = Math.min(98, Math.max(50, Math.round(confidenceScore)));

    if (total30 === 0) {
      confidenceScore = 50; // Low confidence if no data
    }

    // 6. Generate AI Insights
    const insights = generateAIInsights(product.name, product.stock, product.reorderPoint, trendDirection, trendPercent, daysUntilStockout);

    // Build Weekly & Monthly Arrays for Chart
    const weeklyForecasts = [
      { week: 'Week 1', expectedDemand: Math.round(avgWeeklyDemand), confidence: confidenceScore },
      { week: 'Week 2', expectedDemand: Math.round(avgWeeklyDemand * (trendDirection==='up'?1.05:trendDirection==='down'?0.95:1)), confidence: Math.max(50, confidenceScore - 5) },
      { week: 'Week 3', expectedDemand: Math.round(avgWeeklyDemand * (trendDirection==='up'?1.10:trendDirection==='down'?0.90:1)), confidence: Math.max(50, confidenceScore - 10) },
      { week: 'Week 4', expectedDemand: Math.round(avgWeeklyDemand * (trendDirection==='up'?1.15:trendDirection==='down'?0.85:1)), confidence: Math.max(50, confidenceScore - 15) },
    ];

    const currentMonthIdx = now.getMonth();
    const monthlyForecasts = [
      { month: new Date(now.getFullYear(), currentMonthIdx + 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' }), expectedDemand: avgMonthlyDemand, confidence: confidenceScore - 5 },
      { month: new Date(now.getFullYear(), currentMonthIdx + 2, 1).toLocaleString('default', { month: 'short', year: 'numeric' }), expectedDemand: Math.round(avgMonthlyDemand * (trendDirection==='up'?1.10:trendDirection==='down'?0.90:1)), confidence: confidenceScore - 10 },
      { month: new Date(now.getFullYear(), currentMonthIdx + 3, 1).toLocaleString('default', { month: 'short', year: 'numeric' }), expectedDemand: Math.round(avgMonthlyDemand * (trendDirection==='up'?1.20:trendDirection==='down'?0.80:1)), confidence: confidenceScore - 15 },
    ];

    const forecastData = {
      product: product._id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.stock,
      reorderPoint: product.reorderPoint,
      avgWeeklyDemand,
      avgMonthlyDemand,
      weeklyForecasts,
      monthlyForecasts,
      trendDirection,
      trendPercent: Math.round(trendPercent),
      daysUntilStockout,
      overallConfidence: confidenceScore,
      insights,
      seasonalPeak: 'Data Based', // Could calculate real peak if 1yr data available
      generatedAt: now,
    };

    // Update Current Forecast
    await Forecast.findOneAndUpdate(
      { product: product._id },
      forecastData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Add to Forecast History
    await ForecastHistory.create({
      product: product._id,
      productName: product.name,
      forecastDate: now,
      weeklyPrediction: avgWeeklyDemand,
      monthlyPrediction: avgMonthlyDemand,
      confidenceScore,
      trend: trendDirection,
      generatedAt: now
    });
  }
};

module.exports = {
  generateDemoSalesData,
  generateForecasts
};

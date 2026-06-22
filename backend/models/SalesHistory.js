const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantitySold: { type: Number, required: true },
  saleDate: { type: Date, required: true },
  revenue: { type: Number, required: true },
}, {
  timestamps: true,
});

// Index to quickly query sales for a specific product over a date range
salesHistorySchema.index({ product: 1, saleDate: -1 });

const SalesHistory = mongoose.model('SalesHistory', salesHistorySchema);
module.exports = SalesHistory;

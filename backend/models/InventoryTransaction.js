const mongoose = require('mongoose');

const inventoryTransactionSchema = mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, {
  timestamps: true,
});

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
module.exports = InventoryTransaction;

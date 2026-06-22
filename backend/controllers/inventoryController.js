const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');

const getTransactions = async (req, res) => {
  const transactions = await InventoryTransaction.find({}).populate('product', 'name sku').sort({ date: -1 });
  res.json(transactions);
};

const adjustInventory = async (req, res) => {
  const { productId, type, quantity, notes } = req.body;
  
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (type === 'OUT' && product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  const transaction = new InventoryTransaction({
    product: productId,
    type,
    quantity,
    notes
  });

  await transaction.save();

  if (type === 'IN') {
    product.stock += Number(quantity);
  } else if (type === 'OUT') {
    product.stock -= Number(quantity);
  }

  await product.save();
  
  res.status(201).json({ transaction, currentStock: product.stock });
};

module.exports = { getTransactions, adjustInventory };

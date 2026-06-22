const Product = require('../models/Product');

const getProducts = async (req, res) => {
  const products = await Product.find({});
  res.json(products);
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

const createProduct = async (req, res) => {
  const { sku, name, category, supplier, description, price, stock, reorderPoint } = req.body;
  
  const productExists = await Product.findOne({ sku });
  if (productExists) {
    return res.status(400).json({ message: 'Product SKU already exists' });
  }

  const product = new Product({
    sku, name, category, supplier, description, price, stock, reorderPoint
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

const updateProduct = async (req, res) => {
  const { name, category, supplier, description, price, stock, reorderPoint } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.category = category || product.category;
    product.supplier = supplier || product.supplier;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.reorderPoint = reorderPoint || product.reorderPoint;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };

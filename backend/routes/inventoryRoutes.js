const express = require('express');
const router = express.Router();
const { getTransactions, adjustInventory } = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getTransactions).post(protect, adjustInventory);

module.exports = router;

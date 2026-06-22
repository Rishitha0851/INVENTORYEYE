const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();

connectDB().then(async () => {
  const User = require('./models/User');
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        name: 'Admin',
        email: 'rishithamakam0851@gmail.com',
        password: 'admin'
      });
      console.log('Default admin user seeded: rishithamakam0851@gmail.com / admin');
    }

    // Initialize Capstone Module 2: AI Forecasting Engine Data
    const { generateDemoSalesData, generateForecasts } = require('./services/forecastService');
    const { generateRecommendations } = require('./services/recommendationService');
    const SalesHistory = require('./models/SalesHistory');
    const salesCount = await SalesHistory.countDocuments();
    if (salesCount === 0) {
      console.log('No SalesHistory found. Populating demo data and running first forecast...');
      await generateDemoSalesData();
      await generateForecasts();
      await generateRecommendations();
      console.log('Forecasting & Recommendation Engines initialized.');
    }
  } catch (err) {
    console.error('Error during DB init:', err);
  }
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('InventoryEye API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

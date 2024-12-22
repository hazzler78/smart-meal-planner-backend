const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { authenticateToken } = require('./utils/auth');

// Import routes
const inventoryRoutes = require('./routes/inventory');
const suggestionsRoutes = require('./routes/suggestions');
const mealPlanRoutes = require('./routes/mealPlans');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/suggestions', authenticateToken, suggestionsRoutes);
app.use('/api/mealplans', authenticateToken, mealPlanRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app; 
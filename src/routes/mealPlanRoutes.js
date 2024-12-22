const express = require('express');
const NodeCache = require('node-cache');
const auth = require('../middleware/auth');
const {
  loadMealPlans,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlanById,
  autoGenerateMealPlan,
  validateMealPlan
} = require('../services/mealPlanService');

const router = express.Router();

// Initialize cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

// Middleware to handle cache
const cacheMiddleware = (key, ttl = 300) => (req, res, next) => {
  const cacheKey = `${key}-${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }

  // Store the original res.json function
  const originalJson = res.json;
  res.json = function(data) {
    // Cache the data before sending
    cache.set(cacheKey, data, ttl);
    // Call the original json function
    return originalJson.call(this, data);
  };

  next();
};

// Clear cache when meal plans are modified
const clearMealPlanCache = () => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('mealplan')) {
      cache.del(key);
    }
  });
};

// Get all meal plans with pagination and filters
router.get('/', auth, cacheMiddleware('mealplan-list'), (req, res) => {
  try {
    const filters = {
      nameContains: req.query.search?.toLowerCase(),
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      sortBy: ['name', 'date'].includes(req.query.sortBy) ? req.query.sortBy : undefined,
      sortOrder: ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'asc',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const result = loadMealPlans(filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific meal plan by ID
router.get('/:id', auth, cacheMiddleware('mealplan-detail'), (req, res) => {
  try {
    const { mealPlans } = loadMealPlans();
    const mealPlan = mealPlans.find(mp => mp.id === req.params.id);
    
    if (!mealPlan) {
      return res.status(404).json({ 
        error: "Meal plan not found",
        id: req.params.id
      });
    }
    
    res.json(mealPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add new meal plan
router.post('/', auth, (req, res) => {
  try {
    const mealPlan = req.body;
    validateMealPlan(mealPlan);
    
    const newMealPlan = addMealPlan(mealPlan);
    clearMealPlanCache();
    res.status(201).json({
      message: "Meal plan added successfully",
      mealPlan: newMealPlan
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update existing meal plan
router.put('/:id', auth, (req, res) => {
  try {
    const mealPlan = req.body;
    validateMealPlan(mealPlan);
    
    const updatedMealPlan = updateMealPlan(req.params.id, mealPlan);
    clearMealPlanCache();
    res.json({
      message: "Meal plan updated successfully",
      mealPlan: updatedMealPlan
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete meal plan
router.delete('/:id', auth, (req, res) => {
  try {
    deleteMealPlan(req.params.id);
    clearMealPlanCache();
    res.json({
      message: "Meal plan deleted successfully",
      id: req.params.id
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Auto-generate meal plan
router.post('/autogenerate', auth, async (req, res) => {
  try {
    const { preferences, startDate, endDate } = req.body;
    
    if (!preferences || !startDate || !endDate) {
      return res.status(400).json({ 
        error: "Preferences, start date, and end date are required" 
      });
    }

    const mealPlan = await autoGenerateMealPlan(preferences, startDate, endDate);
    clearMealPlanCache();
    res.status(201).json({
      message: "Meal plan generated successfully",
      mealPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
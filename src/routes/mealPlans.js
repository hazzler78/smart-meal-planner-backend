const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// In-memory storage for meal plans (for testing)
let mealPlans = [];

// Create meal plan
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('days').isInt({ min: 1, max: 31 }),
    body('mealsPerDay').isInt({ min: 1, max: 6 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const mealPlan = {
      id: `plan${mealPlans.length + 1}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      meals: []
    };

    mealPlans.push(mealPlan);
    res.json(mealPlan);
  }
);

// Get meal plans
router.get('/', (req, res) => {
  res.json(mealPlans);
});

// Get meal plan by id
router.get('/:id', (req, res) => {
  const mealPlan = mealPlans.find(p => p.id === req.params.id);
  if (!mealPlan) {
    return res.status(404).json({ error: 'Meal plan not found' });
  }
  res.json(mealPlan);
});

module.exports = router; 
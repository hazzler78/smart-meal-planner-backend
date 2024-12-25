import express from 'express';
import { autoGenerateMealPlan, loadMealPlans, addMealPlan, updateMealPlan, deleteMealPlan } from '../services/mealPlanService.js';

const router = express.Router();

// Get all meal plans
router.get('/', async (req, res) => {
  try {
    const mealPlans = await loadMealPlans();
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific meal plan
router.get('/:id', async (req, res) => {
  try {
    const mealPlans = await loadMealPlans();
    const mealPlan = mealPlans.mealPlans.find(mp => mp.id === req.params.id);
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create meal plan
router.post('/', async (req, res) => {
  try {
    const { name, startDate, days, mealsPerDay } = req.body;

    // Validate input
    if (!startDate || !days || !mealsPerDay) {
      return res.status(400).json({ error: 'startDate, days, and mealsPerDay are required' });
    }

    if (days <= 0 || mealsPerDay <= 0) {
      return res.status(400).json({ error: 'days and mealsPerDay must be positive numbers' });
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const mealPlan = await autoGenerateMealPlan({
      name: name || 'Generated Meal Plan',
      startDate,
      endDate: endDate.toISOString().split('T')[0]
    });

    res.status(200).json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update meal plan
router.put('/:id', async (req, res) => {
  try {
    const mealPlan = await updateMealPlan(req.params.id, req.body);
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meal plan
router.delete('/:id', async (req, res) => {
  try {
    await deleteMealPlan(req.params.id);
    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    if (error.message === 'Meal plan not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router; 
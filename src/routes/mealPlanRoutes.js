import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import {
  loadMealPlans,
  getMealPlanById,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan,
  validateMealPlan,
  autoGenerateMealPlan
} from '../services/mealPlanService.js';

const router = express.Router();

// Get all meal plans with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      userId: req.user.userId,
      nameContains: req.query.nameContains,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await loadMealPlans(filters);
    res.json(result);
  } catch (error) {
    console.error('Error loading meal plans:', error);
    res.status(500).json({ error: 'Failed to load meal plans' });
  }
});

// Get meal plan by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const mealPlan = await getMealPlanById(req.params.id);
    if (mealPlan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to access this meal plan' });
    }
    res.json(mealPlan);
  } catch (error) {
    if (error.message === 'Meal plan not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error getting meal plan:', error);
      res.status(500).json({ error: 'Failed to get meal plan' });
    }
  }
});

// Create new meal plan
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Create meal plan data with user ID from auth token
    const mealPlanData = {
      ...req.body,
      userId: req.user.userId
    };

    // Validate meal plan data
    validateMealPlan(mealPlanData);

    // Generate meal suggestions if ingredients are provided
    let newMealPlan;
    if (Array.isArray(mealPlanData.ingredients) && mealPlanData.ingredients.length > 0) {
      newMealPlan = await autoGenerateMealPlan(mealPlanData);
    } else {
      newMealPlan = await addMealPlan(mealPlanData);
    }

    res.status(201).json(newMealPlan);
  } catch (error) {
    console.error('Meal plan creation error:', error);
    if (error.message.includes('Missing required field') || 
        error.message === 'Start date cannot be after end date' ||
        error.message === 'No ingredients available') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error creating meal plan:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

// Update meal plan
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const mealPlan = await getMealPlanById(req.params.id);
    if (mealPlan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this meal plan' });
    }

    const updatedMealPlan = await updateMealPlan(req.params.id, req.body);
    res.json(updatedMealPlan);
  } catch (error) {
    if (error.message === 'Meal plan not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error updating meal plan:', error);
      res.status(500).json({ error: 'Failed to update meal plan' });
    }
  }
});

// Delete meal plan
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const mealPlan = await getMealPlanById(req.params.id);
    if (mealPlan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this meal plan' });
    }

    await deleteMealPlan(req.params.id);
    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    if (error.message === 'Meal plan not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error deleting meal plan:', error);
      res.status(500).json({ error: 'Failed to delete meal plan' });
    }
  }
});

export default router; 
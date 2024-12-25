import express from 'express';
import { generateSuggestions } from '../services/suggestionService.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Get recipe suggestions based on ingredients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const ingredients = req.query.ingredients 
      ? Array.isArray(req.query.ingredients) 
        ? req.query.ingredients 
        : [req.query.ingredients]
      : [];

    const suggestions = await generateSuggestions(ingredients);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in recipe suggestions route:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Get suggestions based on inventory
router.get('/from-inventory', authenticateToken, async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.user.inventory || []);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in inventory-based suggestions route:', error);
    res.status(500).json({ error: 'Failed to generate suggestions from inventory' });
  }
});

// Get suggestions based on preferences
router.get('/from-preferences', authenticateToken, async (req, res) => {
  try {
    const suggestions = await generateSuggestions([], req.user.preferences);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in preference-based suggestions route:', error);
    res.status(500).json({ error: 'Failed to generate suggestions from preferences' });
  }
});

export { router }; 
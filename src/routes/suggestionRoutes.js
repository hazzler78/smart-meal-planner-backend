const express = require('express');
const auth = require('../middleware/auth');
const { generateSuggestions } = require('../services/suggestionService');
const { getIngredientSubstitutions, getRecipeInstructions } = require('../services/aiService');
const router = express.Router();

router.get('/recipes', auth, async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.user.userId);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/substitutions/:ingredient', auth, async (req, res) => {
  try {
    const substitutions = await getIngredientSubstitutions(
      req.params.ingredient,
      req.user.preferences
    );
    res.json({ substitutions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recipe/:id/instructions', auth, async (req, res) => {
  try {
    const recipe = await getRecipeById(req.params.id);
    const instructions = await getRecipeInstructions(recipe, req.user.preferences);
    res.json({ instructions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
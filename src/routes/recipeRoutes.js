const express = require("express");
const NodeCache = require("node-cache");
const { 
  loadRecipes, 
  searchRecipes, 
  addRecipe, 
  updateRecipe, 
  deleteRecipe,
  validateRecipe 
} = require("../services/recipeService");
const { processCommand } = require("../services/commandProcessor");
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

// Clear cache when recipes are modified
const clearRecipeCache = () => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('recipe')) {
      cache.del(key);
    }
  });
};

// Get all recipes with pagination and filters
router.get("/", cacheMiddleware('recipe-list'), (req, res) => {
  try {
    const filters = {
      nameContains: req.query.search?.toLowerCase(),
      ingredients: req.query.ingredients?.split(','),
      cuisine: req.query.cuisine,
      difficulty: req.query.difficulty,
      sortBy: ['name', 'difficulty', 'prepTime'].includes(req.query.sortBy) ? req.query.sortBy : undefined,
      sortOrder: ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'asc',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const result = loadRecipes(filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific recipe by ID
router.get("/:id", cacheMiddleware('recipe-detail'), (req, res) => {
  try {
    const { recipes } = loadRecipes();
    const recipe = recipes.find(r => r.id === req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        error: "Recipe not found",
        id: req.params.id
      });
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add new recipe
router.post("/", (req, res) => {
  try {
    const recipe = req.body;
    validateRecipe(recipe);
    
    const newRecipe = addRecipe(recipe);
    clearRecipeCache();
    res.status(201).json({
      message: "Recipe added successfully",
      recipe: newRecipe
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update existing recipe
router.put("/:id", (req, res) => {
  try {
    const recipe = req.body;
    validateRecipe(recipe);
    
    const updatedRecipe = updateRecipe(req.params.id, recipe);
    clearRecipeCache();
    res.json({
      message: "Recipe updated successfully",
      recipe: updatedRecipe
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete recipe
router.delete("/:id", (req, res) => {
  try {
    deleteRecipe(req.params.id);
    clearRecipeCache();
    res.json({
      message: "Recipe deleted successfully",
      id: req.params.id
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Process natural language commands
router.post("/command", (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        error: "Command is required" 
      });
    }

    const { action, params } = processCommand(command);
    
    switch (action) {
      case 'searchRecipes': {
        const cacheKey = `recipes-search-${JSON.stringify(params)}`;
        const cachedResults = cache.get(cacheKey);
        
        if (cachedResults) {
          return res.json(cachedResults);
        }

        const result = searchRecipes({
          ...params,
          page: req.query.page ? parseInt(req.query.page) : 1,
          limit: req.query.limit ? parseInt(req.query.limit) : 10
        });
        
        cache.set(cacheKey, result, 300); // Cache for 5 minutes
        return res.json(result);
      }

      case 'findRecipeById': {
        const { recipes } = loadRecipes();
        const recipe = recipes.find(r => r.id === params.id);
        
        if (!recipe) {
          return res.status(404).json({ 
            error: "Recipe not found",
            id: params.id
          });
        }
        
        return res.json(recipe);
      }

      case 'findRecipesByIngredients': {
        const cacheKey = `recipes-by-ingredients-${JSON.stringify(params.ingredients)}`;
        const cachedRecipes = cache.get(cacheKey);
        
        if (cachedRecipes) {
          return res.json(cachedRecipes);
        }

        const result = searchRecipes({
          ingredients: params.ingredients,
          page: req.query.page ? parseInt(req.query.page) : 1,
          limit: req.query.limit ? parseInt(req.query.limit) : 10
        });
        
        cache.set(cacheKey, result, 300); // Cache for 5 minutes
        return res.json(result);
      }

      default:
        return res.status(400).json({ error: "Invalid recipe command" });
    }
  } catch (error) {
    if (error.message === "Command not recognized") {
      return res.status(400).json({ 
        error: error.message,
        suggestions: [
          "Try: 'find recipes with chicken and rice'",
          "Try: 'search for Italian recipes'",
          "Try: 'find easy recipes'",
          "Try: 'get recipe details for [recipe-id]'"
        ]
      });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
import express from 'express';
import NodeCache from 'node-cache';
import { 
  addItem, 
  removeItem, 
  getInventoryWithFilters,
  validateItem,
  validateQuantity,
  checkItemQuantity
} from '../services/inventoryService.js';
import { processCommand } from '../services/commandProcessor.js';
import { searchRecipes } from '../services/recipeService.js';
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

// Clear cache when inventory is modified
const clearInventoryCache = () => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('inventory')) {
      cache.del(key);
    }
  });
};

// Get inventory with filters, sorting, and pagination
router.get("/", cacheMiddleware('inventory-list'), (req, res) => {
  try {
    const filters = {
      nameContains: req.query.search?.toLowerCase(),
      minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      maxQuantity: req.query.maxQuantity ? Number(req.query.maxQuantity) : undefined,
      sortBy: ['name', 'quantity'].includes(req.query.sortBy) ? req.query.sortBy : undefined,
      sortOrder: ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'asc',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const result = getInventoryWithFilters(filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific item quantity with validation
router.get("/:item", cacheMiddleware('inventory-item'), (req, res) => {
  try {
    const validatedItem = validateItem(req.params.item);
    const { items } = getInventoryWithFilters({ nameContains: validatedItem });
    const item = items.find(i => i.item === validatedItem);
    
    if (!item) {
      return res.status(404).json({ 
        error: "Item not found",
        item: validatedItem,
        quantity: 0
      });
    }
    
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add item with improved validation
router.post("/add", (req, res) => {
  try {
    const { item, quantity, unit } = req.body;
    
    if (!item || quantity === undefined) {
      return res.status(400).json({ 
        error: "Item and quantity are required" 
      });
    }

    const inventory = addItem(item, quantity);
    clearInventoryCache(); // Clear cache when inventory is modified
    res.json({
      message: "Item added successfully",
      item,
      quantity,
      unit,
      inventory
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove item with improved validation and error messages
router.post("/remove", (req, res) => {
  try {
    const { item, quantity } = req.body;
    
    if (!item || quantity === undefined) {
      return res.status(400).json({ 
        error: "Item and quantity are required" 
      });
    }

    const inventory = removeItem(item, quantity);
    clearInventoryCache(); // Clear cache when inventory is modified
    res.json({
      message: "Item removed successfully",
      item,
      quantity,
      inventory
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Insufficient quantity")) {
      return res.status(400).json({ error: error.message });
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
      case 'checkInventory': {
        const result = getInventoryWithFilters({
          page: req.query.page ? parseInt(req.query.page) : 1,
          limit: req.query.limit ? parseInt(req.query.limit) : 10
        });
        return res.json(result);
      }
      
      case 'checkItem': {
        const quantity = checkItemQuantity(params.item);
        return res.json({ 
          item: params.item, 
          quantity 
        });
      }
      
      case 'addToInventory': {
        const updatedInventory = addItem(params.item, params.quantity);
        clearInventoryCache();
        return res.json(updatedInventory);
      }
      
      case 'removeFromInventory': {
        const newInventory = removeItem(params.item, params.quantity);
        clearInventoryCache();
        return res.json(newInventory);
      }

      case 'findRecipesByIngredients': {
        const cacheKey = `recipes-by-ingredients-${JSON.stringify(params.ingredients)}`;
        const cachedRecipes = cache.get(cacheKey);
        
        if (cachedRecipes) {
          return res.json(cachedRecipes);
        }

        const availableRecipes = searchRecipes({
          ingredients: params.ingredients.map(ing => ing.item)
        });
        
        const response = {
          message: `Found ${availableRecipes.length} recipes you can make`,
          recipes: availableRecipes
        };
        
        cache.set(cacheKey, response, 300); // Cache for 5 minutes
        return res.json(response);
      }

      case 'clearCategory': {
        const items = getInventoryWithFilters()
          .items
          .filter(item => {
            const category = params.category.toLowerCase();
            switch (category) {
              case 'dairy':
                return /milk|cheese|yogurt|cream|butter/i.test(item.item);
              case 'meat':
                return /chicken|beef|pork|fish|meat/i.test(item.item);
              case 'produce':
                return /fruit|vegetable|tomato|lettuce|carrot|onion/i.test(item.item);
              case 'pantry':
                return /flour|sugar|rice|pasta|oil/i.test(item.item);
              default:
                return false;
            }
          });

        items.forEach(item => {
          try {
            removeItem(item.item, item.quantity);
          } catch (error) {
            console.error(`Error removing ${item.item}:`, error);
          }
        });

        clearInventoryCache();
        return res.json({
          message: `Cleared ${items.length} items from ${params.category} category`,
          removedItems: items
        });
      }
      
      case 'bulkAddToInventory': {
        const results = params.items.map(item => {
          try {
            return {
              item: item.item,
              success: true,
              result: addItem(item.item, item.quantity)
            };
          } catch (error) {
            return {
              item: item.item,
              success: false,
              error: error.message
            };
          }
        });

        clearInventoryCache();
        return res.json({
          message: 'Bulk update completed',
          results
        });
      }

      default:
        return res.status(400).json({ error: "Invalid inventory command" });
    }
  } catch (error) {
    if (error.message === "Command not recognized") {
      return res.status(400).json({ 
        error: error.message,
        suggestions: [
          "Try: 'what can I make with 2 eggs and 1 tomato'",
          "Try: 'clear all dairy from inventory'",
          "Try: 'add 2 cups flour'",
          "Try: 'check flour stock'",
          "Try: 'remove 1 egg'"
        ]
      });
    }
    if (error.message.includes("not found") || 
        error.message.includes("Insufficient quantity")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Bulk add items to inventory
router.post("/", (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: "Items array is required" 
      });
    }

    // Validate all items first
    const validationErrors = items.map(item => {
      if (!item.item || item.quantity === undefined) {
        return 'Each item must have an item name and quantity';
      }
      try {
        validateItem(item.item);
        validateQuantity(item.quantity);
        return null;
      } catch (error) {
        return error.message;
      }
    }).filter(error => error !== null);

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: validationErrors[0] // Return the first validation error
      });
    }

    // If validation passes, add all items
    const results = items.map(item => {
      try {
        return {
          item: item.item,
          success: true,
          result: addItem(item.item, item.quantity)
        };
      } catch (error) {
        return {
          item: item.item,
          success: false,
          error: error.message
        };
      }
    });

    const allSuccessful = results.every(r => r.success);
    clearInventoryCache();
    
    if (!allSuccessful) {
      const firstError = results.find(r => !r.success)?.error;
      return res.status(400).json({ error: firstError });
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update inventory item
router.put("/", (req, res) => {
  try {
    const { item, quantity, operation } = req.body;
    
    if (!item || quantity === undefined || !operation) {
      return res.status(400).json({ 
        error: "Item, quantity, and operation are required" 
      });
    }

    let result;
    if (operation === 'remove') {
      result = removeItem(item, quantity);
    } else if (operation === 'add') {
      result = addItem(item, quantity);
    } else {
      return res.status(400).json({ 
        error: "Operation must be either 'add' or 'remove'" 
      });
    }

    clearInventoryCache();
    res.json({
      success: true,
      item,
      quantity,
      operation,
      result
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Insufficient quantity")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

export default router; 
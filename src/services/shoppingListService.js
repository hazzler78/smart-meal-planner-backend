const fs = require('fs').promises;
const path = require('path');
const inventoryService = require('./inventoryService');

const SHOPPING_LIST_FILE = path.join(__dirname, '../../data/shoppingList.json');

// In-memory store for test mode
let testModeList = [];

// Initialize shopping list file if it doesn't exist
const initializeShoppingList = async () => {
  try {
    await fs.access(SHOPPING_LIST_FILE);
  } catch (error) {
    await fs.writeFile(SHOPPING_LIST_FILE, JSON.stringify([]));
  }
};

// Load shopping list from file or memory in test mode
const loadShoppingList = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return [...testModeList];
    }
    await initializeShoppingList();
    const data = await fs.readFile(SHOPPING_LIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading shopping list:', error);
    return [];
  }
};

// Save shopping list to file or memory in test mode
const saveShoppingList = async (list) => {
  if (process.env.NODE_ENV === 'test') {
    testModeList = [...list];
    return;
  }
  try {
    await fs.writeFile(SHOPPING_LIST_FILE, JSON.stringify(list, null, 2));
  } catch (error) {
    console.error('Error saving shopping list:', error);
    throw new Error('Failed to save shopping list');
  }
};

// Add items to shopping list
const addToList = async (items) => {
  try {
    const currentList = await loadShoppingList();
    const updatedList = [...currentList];

    for (const newItem of items) {
      const existingItem = updatedList.find(item => 
        item.ingredient.toLowerCase() === newItem.ingredient.toLowerCase() &&
        item.unit === newItem.unit
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        updatedList.push(newItem);
      }
    }

    await saveShoppingList(updatedList);
    return updatedList;
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    throw new Error('Failed to add to shopping list');
  }
};

// Remove items from shopping list
const removeFromList = async (items) => {
  try {
    const currentList = await loadShoppingList();
    const updatedList = currentList.filter(item => 
      !items.some(removeItem => 
        removeItem.ingredient.toLowerCase() === item.ingredient.toLowerCase() &&
        removeItem.unit === item.unit
      )
    );

    await saveShoppingList(updatedList);
    return updatedList;
  } catch (error) {
    console.error('Error removing from shopping list:', error);
    throw new Error('Failed to remove from shopping list');
  }
};

// Clear entire shopping list
const clearList = async () => {
  try {
    await saveShoppingList([]);
    return [];
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    throw new Error('Failed to clear shopping list');
  }
};

// Generate shopping list from recipes
const generateFromRecipes = async (recipes) => {
  try {
    const inventoryData = await inventoryService.getInventoryWithFilters();
    
    // Create inventory map for quick lookup
    const inventory = {};
    for (const item of inventoryData.items) {
      const key = `${item.item.toLowerCase()}|${item.unit}`;
      inventory[key] = item.quantity;
    }

    // Calculate total needs from recipes
    const needs = {};
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.item.toLowerCase()}|${ingredient.unit}`;
        const inStock = inventory[key] || 0;
        
        // Calculate how much we need of this ingredient
        let currentNeed = ingredient.quantity;
        if (inStock > 0) {
          // If we have some in stock, subtract it from what we need
          if (!needs[key]) {
            // If this is the first time we're seeing this ingredient,
            // we can use the full inventory amount
            currentNeed = Math.max(0, ingredient.quantity - inStock);
          } else {
            // If we've seen this ingredient before, we've already used some inventory,
            // so we need the full amount
            currentNeed = ingredient.quantity;
          }
        }
        
        if (currentNeed > 0) {
          if (!needs[key]) {
            needs[key] = {
              name: ingredient.item,
              unit: ingredient.unit,
              quantity: 0
            };
          }
          needs[key].quantity += currentNeed;
        }
      }
    }

    // Convert needs to shopping list
    const shoppingList = Object.values(needs).map(item => ({
      ingredient: item.name,
      quantity: item.quantity,
      unit: item.unit
    }));

    // Sort by ingredient name
    return shoppingList.sort((a, b) => 
      a.ingredient.toLowerCase().localeCompare(b.ingredient.toLowerCase())
    );
  } catch (error) {
    console.error('Error generating shopping list from recipes:', error);
    throw new Error('Failed to generate shopping list from recipes');
  }
};

// Reset test mode list (for testing purposes)
const resetTestMode = () => {
  if (process.env.NODE_ENV === 'test') {
    testModeList = [];
  }
};

module.exports = {
  loadShoppingList,
  addToList,
  removeFromList,
  clearList,
  generateFromRecipes,
  resetTestMode
}; 
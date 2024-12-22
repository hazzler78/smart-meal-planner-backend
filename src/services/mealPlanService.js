const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateRecipeSuggestions } = require('./aiService');
const { getInventory } = require('./inventoryService');

const mealPlanFilePath = path.join(__dirname, '../data/mealPlans.json');

const ensureDataDirectory = () => {
  const dataDir = path.dirname(mealPlanFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadMealPlans = (options = {}) => {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(mealPlanFilePath)) {
      return {
        mealPlans: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    const data = JSON.parse(fs.readFileSync(mealPlanFilePath, 'utf-8'));
    let mealPlans = data.mealPlans || [];

    // Apply filters
    if (options.nameContains) {
      mealPlans = mealPlans.filter(plan => 
        plan.name.toLowerCase().includes(options.nameContains.toLowerCase())
      );
    }

    if (options.startDate) {
      mealPlans = mealPlans.filter(plan => plan.startDate === options.startDate);
    }

    // Apply sorting
    if (options.sortBy) {
      mealPlans.sort((a, b) => {
        const order = options.sortOrder === 'desc' ? -1 : 1;
        return order * a[options.sortBy].localeCompare(b[options.sortBy]);
      });
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const totalItems = mealPlans.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      mealPlans: mealPlans.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error loading meal plans:', error);
    return {
      mealPlans: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
};

const saveMealPlans = (data) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(mealPlanFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving meal plans:', error);
    throw new Error('Failed to save meal plans');
  }
};

const validateMealPlan = (mealPlan) => {
  if (!mealPlan || typeof mealPlan !== 'object') {
    throw new Error('Meal plan must be an object');
  }

  if (!mealPlan.name || typeof mealPlan.name !== 'string' || mealPlan.name.trim().length === 0) {
    throw new Error('Meal plan name must be a non-empty string');
  }

  if (!mealPlan.startDate || typeof mealPlan.startDate !== 'string') {
    throw new Error('Start date must be a valid date string');
  }

  if (!mealPlan.endDate || typeof mealPlan.endDate !== 'string') {
    throw new Error('End date must be a valid date string');
  }

  if (!Array.isArray(mealPlan.recipes)) {
    throw new Error('Recipes must be an array');
  }

  return true;
};

const addMealPlan = (mealPlan) => {
  validateMealPlan(mealPlan);

  const data = loadMealPlans();
  const newMealPlan = {
    ...mealPlan,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.mealPlans.push(newMealPlan);
  saveMealPlans(data);
  return newMealPlan;
};

const updateMealPlan = (id, updates) => {
  validateMealPlan(updates);

  const data = loadMealPlans();
  const index = data.mealPlans.findIndex(mp => mp.id === id);
  
  if (index === -1) {
    throw new Error('Meal plan not found');
  }

  const updatedMealPlan = {
    ...data.mealPlans[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  };

  data.mealPlans[index] = updatedMealPlan;
  saveMealPlans(data);
  return updatedMealPlan;
};

const deleteMealPlan = (id) => {
  const data = loadMealPlans();
  const index = data.mealPlans.findIndex(mp => mp.id === id);
  
  if (index === -1) {
    throw new Error('Meal plan not found');
  }

  data.mealPlans.splice(index, 1);
  saveMealPlans(data);
};

const autoGenerateMealPlan = async (options) => {
  try {
    // Get available ingredients
    const response = await getInventory();
    
    if (!response || !response.items || response.items.length === 0) {
      throw new Error('No ingredients available');
    }

    // Extract ingredient names
    const ingredients = response.items.map(item => item.name);

    // Get recipe suggestions from AI
    const recipes = await generateRecipeSuggestions(ingredients);

    // Create a meal plan from the suggestions
    const mealPlan = {
      name: options.name || 'AI Generated Meal Plan',
      startDate: options.startDate || new Date().toISOString().split('T')[0],
      endDate: options.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recipes: recipes || []
    };

    // Save the generated meal plan
    return addMealPlan(mealPlan);
  } catch (error) {
    if (error.message === 'No ingredients available') {
      throw error;
    }
    console.error('Error generating meal plan:', error);
    return addMealPlan({
      name: options.name || 'AI Generated Meal Plan',
      startDate: options.startDate || new Date().toISOString().split('T')[0],
      endDate: options.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recipes: []
    });
  }
};

module.exports = {
  loadMealPlans,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan,
  validateMealPlan,
  autoGenerateMealPlan,
  mealPlanFilePath
}; 
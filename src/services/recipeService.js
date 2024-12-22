const fs = require("fs");
const path = require("path");

const recipeFilePath = path.join(__dirname, "../data/recipes.json");

// Validation functions
const validateRecipeName = (name) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Recipe name must be a non-empty string');
  }
  if (name.length > 100) {
    throw new Error('Recipe name must be less than 100 characters');
  }
  if (!/^[a-zA-Z0-9\s-]+$/.test(name)) {
    throw new Error('Recipe name can only contain letters, numbers, spaces, and hyphens');
  }
  return name.trim();
};

const validateIngredients = (ingredients) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error('Recipe must have at least one ingredient');
  }
  
  return ingredients.map(ing => {
    // Check required fields first
    if (!ing.item || !ing.quantity) {
      throw new Error('Each ingredient must have an item name and quantity');
    }

    // Validate quantity
    const quantity = Number(ing.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Ingredient quantity must be a positive integer');
    }
    if (quantity > 1000000) {
      throw new Error('Ingredient quantity must be less than 1,000,000');
    }

    // Validate item name
    if (typeof ing.item !== 'string' || ing.item.trim().length === 0) {
      throw new Error('Each ingredient must have an item name and quantity');
    }
    if (ing.item.length > 100) {
      throw new Error('Ingredient name must be less than 100 characters');
    }

    // Validate unit (optional)
    if (ing.unit && typeof ing.unit !== 'string') {
      throw new Error('Ingredient unit must be a string');
    }

    return {
      item: ing.item.trim().toLowerCase(),
      quantity,
      unit: ing.unit ? ing.unit.trim().toLowerCase() : undefined
    };
  });
};

const validateInstructions = (instructions) => {
  if (!Array.isArray(instructions) || instructions.length === 0) {
    throw new Error('Recipe must have at least one instruction');
  }

  return instructions.map(instruction => {
    if (typeof instruction !== 'string' || instruction.trim().length === 0) {
      throw new Error('Instructions must be non-empty strings');
    }
    if (instruction.length > 500) {
      throw new Error('Instruction must be less than 500 characters');
    }
    return instruction.trim();
  });
};

// Enhanced recipe functions
const loadRecipes = () => {
  try {
    if (!fs.existsSync(recipeFilePath)) {
      saveRecipes([]);
      return [];
    }
    return JSON.parse(fs.readFileSync(recipeFilePath, "utf-8"));
  } catch (error) {
    console.error("Error loading recipes:", error);
    throw new Error("Failed to load recipes");
  }
};

const saveRecipes = (recipes) => {
  try {
    const dataDir = path.dirname(recipeFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(recipeFilePath, JSON.stringify(recipes, null, 2));
  } catch (error) {
    console.error("Error saving recipes:", error);
    throw new Error("Failed to save recipes");
  }
};

const addRecipe = (recipe) => {
  const name = validateRecipeName(recipe.name);
  const ingredients = validateIngredients(recipe.ingredients);
  const instructions = validateInstructions(recipe.instructions);

  const recipes = loadRecipes();
  
  // Check for duplicate names
  if (recipes.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Recipe with this name already exists');
  }

  const newRecipe = {
    id: Date.now().toString(),
    name,
    ingredients,
    instructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  recipes.push(newRecipe);
  saveRecipes(recipes);
  return newRecipe;
};

const updateRecipe = (id, updates) => {
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('Recipe not found');
  }

  const name = validateRecipeName(updates.name);
  const ingredients = validateIngredients(updates.ingredients);
  const instructions = validateInstructions(updates.instructions);

  // Check for duplicate names, excluding current recipe
  if (recipes.some(r => r.id !== id && r.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Recipe with this name already exists');
  }

  const updatedRecipe = {
    ...recipes[index],
    name,
    ingredients,
    instructions,
    updatedAt: new Date().toISOString()
  };

  recipes[index] = updatedRecipe;
  saveRecipes(recipes);
  return updatedRecipe;
};

const deleteRecipe = (id) => {
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('Recipe not found');
  }

  recipes.splice(index, 1);
  saveRecipes(recipes);
  return { message: 'Recipe deleted successfully' };
};

const getRecipeById = (id) => {
  const recipes = loadRecipes();
  const recipe = recipes.find(r => r.id === id);
  
  if (!recipe) {
    throw new Error('Recipe not found');
  }
  
  return recipe;
};

const searchRecipes = (query = {}) => {
  let recipes = loadRecipes();

  // Search by name
  if (query.name) {
    const searchTerm = query.name.toLowerCase();
    recipes = recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchTerm)
    );
  }

  // Search by ingredient
  if (query.ingredient) {
    const searchTerm = query.ingredient.toLowerCase();
    recipes = recipes.filter(recipe =>
      recipe.ingredients.some(ing => 
        ing.item.toLowerCase().includes(searchTerm)
      )
    );
  }

  // Filter by multiple ingredients
  if (query.ingredients && Array.isArray(query.ingredients)) {
    const requiredIngredients = query.ingredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => ing.item.toLowerCase());
      return requiredIngredients.every(ing => recipeIngredients.includes(ing));
    });
  }

  // Sort results
  if (query.sortBy === 'name') {
    recipes.sort((a, b) => 
      query.sortOrder === 'desc' 
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name)
    );
  } else if (query.sortBy === 'date') {
    recipes.sort((a, b) => 
      query.sortOrder === 'desc'
        ? new Date(b.updatedAt) - new Date(a.updatedAt)
        : new Date(a.updatedAt) - new Date(b.updatedAt)
    );
  }

  return recipes;
};

module.exports = {
  loadRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeById,
  searchRecipes,
  validateRecipeName,
  validateIngredients,
  validateInstructions
}; 
let mockRecipes = [];

const resetRecipes = () => {
  mockRecipes = [];
};

const searchRecipes = (query) => {
  if (!query) return mockRecipes;
  
  return mockRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(query.toLowerCase()) ||
    recipe.ingredients.some(i => i.item.toLowerCase().includes(query.toLowerCase()))
  );
};

const getRecipeById = (id) => {
  const recipe = mockRecipes.find(r => r.id === id);
  if (!recipe) {
    throw new Error('Recipe not found');
  }
  return recipe;
};

const addRecipe = (recipe) => {
  if (!recipe.name) {
    throw new Error('Recipe name is required');
  }

  // Check for duplicate names
  if (mockRecipes.some(r => r.name.toLowerCase() === recipe.name.toLowerCase())) {
    throw new Error('Recipe with this name already exists');
  }

  const newRecipe = {
    id: recipe.id || `recipe${mockRecipes.length + 1}`,
    ...recipe,
    createdAt: recipe.createdAt || new Date().toISOString(),
    updatedAt: recipe.updatedAt || new Date().toISOString()
  };

  mockRecipes.push(newRecipe);
  return newRecipe;
};

const updateRecipe = (id, updates) => {
  const index = mockRecipes.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error('Recipe not found');
  }

  // Check for duplicate names if name is being updated
  if (updates.name && mockRecipes.some(r => 
    r.id !== id && r.name.toLowerCase() === updates.name.toLowerCase()
  )) {
    throw new Error('Recipe with this name already exists');
  }

  mockRecipes[index] = {
    ...mockRecipes[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  return mockRecipes[index];
};

const deleteRecipe = (id) => {
  const index = mockRecipes.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error('Recipe not found');
  }

  mockRecipes.splice(index, 1);
};

module.exports = {
  searchRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  resetRecipes,
  mockRecipes
}; 
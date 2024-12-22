const { searchRecipes } = require('./recipeService');
const { getUserById } = require('./userService');
const { getMealSuggestions, getIngredientSubstitutions } = require('./aiService');
const { getInventory } = require('./inventoryService');

const generateSuggestions = async (userId) => {
  try {
    // Get user preferences and inventory
    const user = await getUserById(userId);
    const preferences = user.preferences || {};
    const inventory = await getInventory();

    // Get available ingredients from inventory
    const availableIngredients = inventory
      .filter(item => item.quantity > 0)
      .map(item => item.item);

    // Get AI-powered meal suggestions based on available ingredients
    let aiSuggestions = [];
    if (availableIngredients.length > 0) {
      try {
        aiSuggestions = await getMealSuggestions(availableIngredients, preferences);
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
      }
    }

    // Get existing recipes that match preferences
    const existingRecipes = getExistingRecipeSuggestions(preferences);

    // Combine and sort all suggestions
    const allSuggestions = [
      ...aiSuggestions.map(recipe => ({
        ...recipe,
        source: 'ai',
        reason: 'AI-generated recipe based on your available ingredients'
      })),
      ...existingRecipes.map(recipe => ({
        ...recipe,
        source: 'database',
        reason: generateSuggestionReason(recipe, preferences)
      }))
    ];

    // Sort suggestions by relevance score
    allSuggestions.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Return top 5 suggestions
    return allSuggestions.slice(0, 5);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw new Error('Failed to generate recipe suggestions');
  }
};

const getExistingRecipeSuggestions = (preferences) => {
  // Get all recipes and apply filters
  let recipes = searchRecipes();
  
  if (preferences.dietaryRestrictions) {
    recipes = recipes.filter(recipe => {
      const restrictedIngredients = preferences.dietaryRestrictions;
      return !recipe.ingredients.some(ing => 
        restrictedIngredients.includes(ing.item.toLowerCase())
      );
    });
  }

  if (preferences.favoriteIngredients) {
    recipes.forEach(recipe => {
      const favoriteCount = recipe.ingredients.filter(ing => 
        preferences.favoriteIngredients.includes(ing.item.toLowerCase())
      ).length;
      recipe.relevanceScore = (recipe.relevanceScore || 0) + favoriteCount;
    });
  }

  // Filter out recently cooked recipes
  const cookingHistory = preferences.cookingHistory || [];
  recipes = recipes.filter(recipe => 
    !cookingHistory.includes(recipe.id)
  );

  return recipes;
};

const generateSuggestionReason = (recipe, preferences) => {
  const reasons = [];

  if (preferences.favoriteIngredients) {
    const matchingIngredients = recipe.ingredients
      .filter(ing => preferences.favoriteIngredients.includes(ing.item.toLowerCase()))
      .map(ing => ing.item);
    
    if (matchingIngredients.length > 0) {
      reasons.push(`Contains your favorite ingredients: ${matchingIngredients.join(', ')}`);
    }
  }

  if (preferences.cookingLevel) {
    reasons.push(`Suitable for ${preferences.cookingLevel} level cooks`);
  }

  return reasons.join('. ');
};

module.exports = {
  generateSuggestions,
  getExistingRecipeSuggestions
}; 
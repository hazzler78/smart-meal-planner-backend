const inventoryService = require('./inventoryService');
const recipeService = require('./recipeService');
const aiService = require('./aiService');

const generateSuggestions = async (ingredients) => {
  try {
    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    let allSuggestions = [];

    // Get matching recipes first since they're from our database
    try {
      // Search for recipes that match any of the ingredients
      const recipeResults = await Promise.all(ingredients.map(ing => 
        recipeService.searchRecipes({ ingredient: ing })
      ));
      
      // Combine and deduplicate recipes
      const uniqueRecipes = new Map();
      recipeResults.flat().forEach(recipe => {
        if (!uniqueRecipes.has(recipe.name)) {
          uniqueRecipes.set(recipe.name, {
            ...recipe,
            source: 'database'
          });
        }
      });
      
      // Get the first database recipe
      const dbRecipes = Array.from(uniqueRecipes.values());
      if (dbRecipes.length > 0) {
        allSuggestions.push(dbRecipes[0]);
      }
      console.log('Matching Recipes:', dbRecipes);
    } catch (error) {
      console.error('Recipe search error:', error);
    }

    // Then try to get one AI suggestion
    let aiSucceeded = false;
    try {
      const aiResult = await aiService.getMealSuggestions(ingredients);
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        const formattedAiResult = {
          name: aiResult[0].name,
          ingredients: aiResult[0].ingredients.map(ing => ({
            item: typeof ing === 'string' ? ing : ing.item || ing,
            quantity: 1,
            unit: null
          })),
          instructions: aiResult[0].instructions,
          source: 'ai'
        };
        allSuggestions.push(formattedAiResult);
        aiSucceeded = true;
      }
      console.log('AI Suggestions:', aiResult);
    } catch (error) {
      console.error('AI service error:', error);
    }

    console.log('All Suggestions:', allSuggestions);

    // If AI failed, only return database suggestions
    const result = aiSucceeded ? allSuggestions : allSuggestions.filter(s => s.source === 'database');
    console.log('Final Result:', result);
    return result;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
};

module.exports = {
  generateSuggestions
}; 
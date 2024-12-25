import * as recipeService from './recipeService.js';
import * as aiService from './aiService.js';

const generateSuggestions = async (ingredients) => {
  try {
    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    let allSuggestions = [];

    // Get matching recipes first since they're from our database
    try {
      console.log('Searching for recipes with ingredients:', ingredients);
      // Search for recipes that match any of the ingredients
      const dbRecipes = await recipeService.searchRecipes({ ingredient: ingredients[0] });
      
      if (dbRecipes && dbRecipes.length > 0) {
        allSuggestions.push({
          ...dbRecipes[0],
          source: 'database'
        });
      }
      console.log('Found database recipes:', dbRecipes.length);
    } catch (error) {
      console.error('Recipe search error:', error);
    }

    // Then try to get one AI suggestion
    try {
      console.log('Requesting AI suggestions for ingredients:', ingredients);
      const aiResult = await aiService.getMealSuggestions(ingredients);
      
      // Handle both array and recipes object formats
      const aiRecipes = Array.isArray(aiResult) ? aiResult : (aiResult.recipes || []);
      
      if (aiRecipes.length > 0) {
        const aiSuggestion = aiRecipes[0];
        // Add AI suggestion if it has a name
        if (aiSuggestion && typeof aiSuggestion === 'object' && aiSuggestion.name) {
          const formattedAiSuggestion = {
            name: aiSuggestion.name,
            ingredients: Array.isArray(aiSuggestion.ingredients) 
              ? aiSuggestion.ingredients.map(ing => ({
                  item: typeof ing === 'string' ? ing : ing.item || ing,
                  quantity: 1,
                  unit: null
                }))
              : [],
            instructions: aiSuggestion.instructions || [],
            source: 'ai'
          };
          allSuggestions.push(formattedAiSuggestion);
        }
      }
    } catch (error) {
      console.error('AI service error:', error);
      if (error.code === 'invalid_api_key') {
        console.warn('OpenAI API key not configured or invalid');
      }
    }

    console.log('Total suggestions found:', allSuggestions.length);
    return allSuggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
};

export { generateSuggestions }; 
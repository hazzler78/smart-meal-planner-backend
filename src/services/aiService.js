const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const logError = (message, error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(message, error);
  }
};

const getMealSuggestions = async (ingredients) => {
  try {
    const prompt = `Generate recipe suggestions using these ingredients: ${ingredients.join(', ')}. Return the response as a JSON array of recipes, where each recipe has: name, ingredients (array of strings), and instructions (array of steps).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant that provides recipe suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw new Error('Failed to generate meal suggestions');
  }
};

const getIngredientSubstitutions = async (ingredient) => {
  try {
    const prompt = `Suggest substitutions for ${ingredient} in cooking. Return the response as a JSON array of substitutions, where each substitution has: name, ratio, and notes.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant that provides ingredient substitution suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error getting ingredient substitutions:', error);
    throw new Error('Failed to get ingredient substitutions');
  }
};

const getRecipeInstructions = async (recipe) => {
  try {
    const prompt = `Generate detailed cooking instructions for ${recipe.name} using these ingredients: ${recipe.ingredients.join(', ')}. Return the response as a JSON array of instruction steps.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant that provides detailed recipe instructions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating recipe instructions:', error);
    throw new Error('Failed to generate recipe instructions');
  }
};

const parseIngredient = (line) => {
  const parts = line.trim().split(' ');
  const quantity = parseFloat(parts[0]);
  
  if (isNaN(quantity)) {
    return {
      ingredient: line.trim(),
      quantity: null,
      unit: null
    };
  }

  if (parts.length === 2) {
    return {
      ingredient: parts[1],
      quantity,
      unit: null
    };
  }

  return {
    ingredient: parts.slice(2).join(' '),
    quantity,
    unit: parts[1]
  };
};

module.exports = {
  getMealSuggestions,
  getIngredientSubstitutions,
  getRecipeInstructions,
  parseIngredient
}; 
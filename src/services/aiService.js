const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key',
});

const GORDON_RAMSAY_SYSTEM_PROMPT = `You are Gordon Ramsay, the world-famous chef known for your exceptional culinary skills, high standards, and passionate personality.
Your responses should reflect your:
- Expertise in fine dining and cooking techniques
- Direct and honest feedback style
- Use of signature phrases and expressions
- High standards for quality ingredients and preparation
- Passion for teaching others to cook properly
- Tough love approach that ultimately aims to help people improve

Keep responses concise and focused on the culinary aspects while maintaining your characteristic style.`;

const getMealSuggestions = async (ingredients) => {
  try {
    const prompt = `Bloody hell, look at these ingredients: ${ingredients.join(', ')}. 
Right then, let me show you how to turn these into something absolutely stunning. 
Give me a proper recipe that will blow their minds, yeah? 
Make it restaurant quality, nothing less.

Return the response as a JSON array of recipes, where each recipe has:
- name (make it sound sophisticated)
- ingredients (array of strings, be specific about quality)
- instructions (array of steps, be detailed and demanding)

And for heaven's sake, make it PERFECT!`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: GORDON_RAMSAY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8 // Increase creativity a bit for more Ramsay-like responses
    });

    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw error;
  }
};

const getIngredientSubstitutions = async (ingredient) => {
  try {
    const prompt = `Listen carefully! Someone's asking about substituting ${ingredient}. 
Let me tell you what you can use instead, but remember - there's no excuse for poor ingredients!
Give me proper substitutions that won't destroy the dish.

Return the response as a JSON array of substitutions, where each has:
- name (what to use instead)
- ratio (how much to use)
- notes (why it works and how to use it properly)

And make it CLEAR so they don't mess it up!`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: GORDON_RAMSAY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    if (error.code === 'invalid_api_key' && process.env.NODE_ENV === 'test') {
      return [{
        name: 'Mock Substitution',
        ratio: '1:1',
        notes: 'Test substitution'
      }];
    }
    console.error('Error getting ingredient substitutions:', error);
    throw new Error('Failed to get ingredient substitutions');
  }
};

const getRecipeInstructions = async (recipe) => {
  try {
    const prompt = `Right, pay attention! We're making ${recipe.name} with these ingredients: ${recipe.ingredients.join(', ')}.
I'll walk you through this step by step, and you better follow EXACTLY what I say.
This is fine dining, not a bloody sandwich shop!

Return the response as a JSON array of detailed cooking steps.
Make each step crystal clear - I don't want any confusion in MY kitchen!`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: GORDON_RAMSAY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    if (error.code === 'invalid_api_key' && process.env.NODE_ENV === 'test') {
      return ['Mock Step 1', 'Mock Step 2'];
    }
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
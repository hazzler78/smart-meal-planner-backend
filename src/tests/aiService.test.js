// Mock OpenAI before requiring aiService
jest.mock('openai', () => require('./mocks/openai'));

const { mockOpenAI } = require('./mocks/openai');
const {
  getMealSuggestions,
  getIngredientSubstitutions,
  getRecipeInstructions,
  parseIngredient
} = require('../services/aiService');

describe('AI Service', () => {
  beforeEach(() => {
    // Reset OpenAI mock before each test
    jest.clearAllMocks();
  });

  describe('getMealSuggestions', () => {
    test('should generate meal suggestions based on ingredients', async () => {
      const mockRecipeResponse = [
        {
          name: 'Chicken Stir Fry',
          ingredients: ['chicken breast', 'rice', 'vegetables'],
          instructions: ['Cook chicken', 'Cook rice', 'Mix together']
        }
      ];

      mockOpenAI.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(mockRecipeResponse)
              }
            }
          ]
        }
      });

      const ingredients = ['chicken', 'rice', 'carrots'];
      const result = await getMealSuggestions(ingredients);

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      expect(result).toEqual(mockRecipeResponse);
    });

    test('should handle API errors gracefully', async () => {
      mockOpenAI.createChatCompletion.mockRejectedValueOnce(new Error('API Error'));

      const ingredients = ['chicken', 'rice'];
      await expect(getMealSuggestions(ingredients)).rejects.toThrow('Failed to generate meal suggestions');
    });
  });

  describe('getIngredientSubstitutions', () => {
    test('should suggest substitutions for an ingredient', async () => {
      const mockSubstitutions = [
        { name: 'applesauce', ratio: '1:1', notes: 'Good for baking' },
        { name: 'mashed banana', ratio: '1:1', notes: 'Adds moisture' }
      ];

      mockOpenAI.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(mockSubstitutions)
              }
            }
          ]
        }
      });

      const ingredient = 'egg';
      const result = await getIngredientSubstitutions(ingredient);

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      expect(result).toEqual(mockSubstitutions);
    });

    test('should handle API errors gracefully', async () => {
      mockOpenAI.createChatCompletion.mockRejectedValueOnce(new Error('API Error'));

      const ingredient = 'egg';
      await expect(getIngredientSubstitutions(ingredient)).rejects.toThrow('Failed to get ingredient substitutions');
    });
  });

  describe('getRecipeInstructions', () => {
    test('should generate detailed instructions for a recipe', async () => {
      const mockInstructions = [
        'Preheat oven to 350°F',
        'Mix ingredients in a bowl',
        'Bake for 30 minutes'
      ];

      mockOpenAI.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(mockInstructions)
              }
            }
          ]
        }
      });

      const recipe = {
        name: 'Chocolate Cake',
        ingredients: ['flour', 'sugar', 'cocoa powder']
      };
      const result = await getRecipeInstructions(recipe);

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      expect(result).toEqual(mockInstructions);
    });

    test('should handle API errors gracefully', async () => {
      mockOpenAI.createChatCompletion.mockRejectedValueOnce(new Error('API Error'));

      const recipe = {
        name: 'Chocolate Cake',
        ingredients: ['flour', 'sugar', 'cocoa powder']
      };
      await expect(getRecipeInstructions(recipe)).rejects.toThrow('Failed to generate recipe instructions');
    });
  });

  describe('Helper Functions', () => {
    describe('parseIngredient', () => {
      test('should parse ingredient lines with quantity and unit', () => {
        const result = parseIngredient('2 cups flour');
        expect(result).toEqual({
          ingredient: 'flour',
          quantity: 2,
          unit: 'cups'
        });
      });

      test('should handle ingredients without unit', () => {
        const result = parseIngredient('2 eggs');
        expect(result).toEqual({
          ingredient: 'eggs',
          quantity: 2,
          unit: null
        });
      });

      test('should handle ingredients without quantity', () => {
        const result = parseIngredient('salt to taste');
        expect(result).toEqual({
          ingredient: 'salt to taste',
          quantity: null,
          unit: null
        });
      });
    });
  });
}); 
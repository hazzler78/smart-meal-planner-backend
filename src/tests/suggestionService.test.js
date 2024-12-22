const { generateSuggestions } = require('../services/suggestionService');
const inventoryService = require('../services/inventoryService');
const { searchRecipes } = require('../services/recipeService');
const aiService = require('../services/aiService');
const userService = require('../services/userService');

// Mock dependencies
jest.mock('../services/inventoryService', () => ({
  getInventory: jest.fn()
}));
jest.mock('../services/recipeService');
jest.mock('../services/aiService', () => ({
  getMealSuggestions: jest.fn(),
  getIngredientSubstitutions: jest.fn()
}));
jest.mock('../services/userService', () => ({
  getUserById: jest.fn().mockResolvedValue({
    id: '123',
    preferences: {
      dietaryRestrictions: ['vegetarian'],
      allergies: ['nuts']
    }
  })
}));
jest.mock('openai', () => require('./mocks/openai'));

describe('Suggestion Service', () => {
  describe('generateSuggestions', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.resetAllMocks();

      // Mock user service
      userService.getUserById.mockResolvedValue({
        id: '123',
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          allergies: ['nuts']
        }
      });

      // Mock AI service response
      aiService.getMealSuggestions.mockResolvedValue([
        {
          name: 'Vegetable Rice Bowl',
          ingredients: [
            { item: 'rice', quantity: 1 },
            { item: 'vegetables', quantity: 2 },
            { item: 'tofu', quantity: 1 }
          ],
          instructions: ['Cook rice', 'Stir fry vegetables', 'Combine']
        }
      ]);

      // Mock inventory data
      inventoryService.getInventory.mockResolvedValue([
        { item: 'rice', quantity: 2 },
        { item: 'tofu', quantity: 1 },
        { item: 'vegetables', quantity: 3 }
      ]);

      // Mock recipe search results
      searchRecipes.mockReturnValue([
        {
          id: 'recipe1',
          name: 'Tofu Stir Fry',
          ingredients: [
            { item: 'tofu', quantity: 1 },
            { item: 'vegetables', quantity: 2 },
            { item: 'soy sauce', quantity: 1 }
          ],
          dietaryRestrictions: ['vegetarian']
        }
      ]);
    });

    test('should combine AI and existing recipe suggestions', async () => {
      const suggestions = await generateSuggestions('123');

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              item: expect.any(String),
              quantity: expect.any(Number)
            })
          ])
        })
      ]));

      expect(userService.getUserById).toHaveBeenCalledWith('123');
      expect(inventoryService.getInventory).toHaveBeenCalled();
      expect(searchRecipes).toHaveBeenCalled();
      expect(aiService.getMealSuggestions).toHaveBeenCalled();
    });

    test('should handle empty inventory', async () => {
      inventoryService.getInventory.mockResolvedValue([]);
      searchRecipes.mockReturnValue([]);

      const suggestions = await generateSuggestions('123');

      expect(suggestions).toBeDefined();
      expect(suggestions).toHaveLength(0);
    });

    test('should handle AI service errors', async () => {
      aiService.getMealSuggestions.mockRejectedValue(new Error('AI service error'));

      const suggestions = await generateSuggestions('123');

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'Tofu Stir Fry',
          ingredients: [
            { item: 'tofu', quantity: 1 },
            { item: 'vegetables', quantity: 2 },
            { item: 'soy sauce', quantity: 1 }
          ]
        })
      ]));
    });
  });
}); 
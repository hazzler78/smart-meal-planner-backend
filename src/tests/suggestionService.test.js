import { generateSuggestions } from '../services/suggestionService.js';
import * as aiService from '../services/aiService.js';
import * as recipeService from '../services/recipeService.js';

// Mock the AI service
jest.mock('../services/aiService.js', () => ({
  getMealSuggestions: jest.fn()
}));

// Mock the recipe service
jest.mock('../services/recipeService.js', () => ({
  searchRecipes: jest.fn()
}));

describe('Suggestion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSuggestions', () => {
    test('should combine AI and existing recipe suggestions', async () => {
      // Mock database recipes
      recipeService.searchRecipes.mockResolvedValue([{
        name: 'Test Recipe 1',
        ingredients: ['rice', 'vegetables'],
        instructions: ['Step 1', 'Step 2'],
        source: 'database'
      }]);

      // Mock AI suggestions
      aiService.getMealSuggestions.mockResolvedValue([{
        name: 'AI Recipe 1',
        ingredients: ['rice', 'vegetables'],
        instructions: ['Step 1', 'Step 2'],
        source: 'ai'
      }]);

      const result = await generateSuggestions(['rice', 'vegetables']);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('ingredients');
      expect(result[0]).toHaveProperty('instructions');
      expect(result[0]).toHaveProperty('source');
    });

    test('should handle empty inventory', async () => {
      const result = await generateSuggestions([]);
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    test('should handle AI service errors', async () => {
      // Mock database recipes
      recipeService.searchRecipes.mockResolvedValue([{
        name: 'Test Recipe 1',
        ingredients: ['rice'],
        instructions: ['Step 1'],
        source: 'database'
      }]);

      // Mock AI service error
      aiService.getMealSuggestions.mockRejectedValue(new Error('AI service error'));

      const result = await generateSuggestions(['rice']);
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expect.objectContaining({
        name: 'Test Recipe 1',
        source: 'database'
      }));
    });

    test('should handle recipe service errors', async () => {
      // Mock recipe service error
      recipeService.searchRecipes.mockRejectedValue(new Error('Recipe service error'));

      // Mock AI suggestions
      aiService.getMealSuggestions.mockResolvedValue([{
        name: 'AI Recipe 1',
        ingredients: ['rice'],
        instructions: ['Step 1'],
        source: 'ai'
      }]);

      const result = await generateSuggestions(['rice']);
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expect.objectContaining({
        name: 'AI Recipe 1',
        source: 'ai'
      }));
    });
  });
}); 
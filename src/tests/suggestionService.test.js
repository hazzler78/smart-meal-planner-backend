// Mock OpenAI before requiring any services
const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

const { generateSuggestions } = require('../services/suggestionService');

// Mock the services
jest.mock('../services/inventoryService', () => ({
  getInventory: jest.fn()
}));

describe('Suggestion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify([{
            name: 'Mock Recipe',
            ingredients: ['rice', 'vegetables'],
            instructions: ['Step 1', 'Step 2']
          }])
        }
      }]
    });
  });

  describe('generateSuggestions', () => {
    test('should combine AI and existing recipe suggestions', async () => {
      const result = await generateSuggestions(['rice', 'vegetables']);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('ingredients');
      expect(result[0]).toHaveProperty('instructions');
      
      const aiRecipe = result.find(r => r.source === 'ai');
      const dbRecipe = result.find(r => r.source === 'database');

      expect(aiRecipe).toBeDefined();
      expect(aiRecipe.name).toBe('Mock Recipe');
      expect(dbRecipe).toBeDefined();
      expect(dbRecipe.name).toBe('Test Recipe 1');
    });

    test('should handle empty inventory', async () => {
      const result = await generateSuggestions([]);
      expect(result).toEqual([]);
    });

    test('should handle AI service errors', async () => {
      // Mock OpenAI to fail
      mockCreate.mockRejectedValueOnce({
        code: 'invalid_api_key',
        message: 'Invalid API key'
      });
      
      const result = await generateSuggestions(['rice']);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expect.objectContaining({
        name: 'Test Recipe 1',
        source: 'database'
      }));
    });
  });
}); 
import { getMealSuggestions } from '../services/aiService.js';

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify([{
                name: "Mock Recipe",
                ingredients: ["ingredient1", "ingredient2"],
                instructions: ["step1", "step2"]
              }])
            }
          }]
        })
      }
    }
  }))
}));

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  test('getMealSuggestions returns mock data in test environment', async () => {
    const ingredients = ['rice', 'vegetables'];
    const suggestions = await getMealSuggestions(ingredients);

    expect(suggestions).toBeDefined();
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0]).toHaveProperty('name', 'Mock Recipe');
    expect(suggestions[0]).toHaveProperty('ingredients');
    expect(suggestions[0]).toHaveProperty('instructions');
  });

  test('getMealSuggestions handles API errors gracefully', async () => {
    const mockOpenAI = require('openai');
    mockOpenAI.OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    }));

    const ingredients = ['rice', 'vegetables'];
    await expect(getMealSuggestions(ingredients)).rejects.toThrow('Failed to generate meal suggestions');
  });

  test('getMealSuggestions handles invalid JSON responses', async () => {
    const mockOpenAI = require('openai');
    mockOpenAI.OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Invalid JSON'
              }
            }]
          })
        }
      }
    }));

    const ingredients = ['rice', 'vegetables'];
    await expect(getMealSuggestions(ingredients)).rejects.toThrow('Failed to parse meal suggestions');
  });
}); 
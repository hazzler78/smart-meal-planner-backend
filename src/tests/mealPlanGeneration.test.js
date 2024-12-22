const fs = require('fs');
const path = require('path');

// Mock fs operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock OpenAI
jest.mock('openai', () => require('./mocks/openai'));

// Create mock functions
const mockGenerateRecipeSuggestions = jest.fn().mockResolvedValue([{
  name: 'Mock Recipe',
  ingredients: ['ingredient1', 'ingredient2'],
  instructions: ['step1', 'step2']
}]);

const mockGetInventory = jest.fn().mockResolvedValue({
  items: [
    { name: 'ingredient1', amount: 1, unit: 'piece' },
    { name: 'ingredient2', amount: 2, unit: 'pieces' }
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  }
});

// Mock services
jest.mock('../services/aiService', () => ({
  generateRecipeSuggestions: mockGenerateRecipeSuggestions
}));

jest.mock('../services/inventoryService', () => ({
  getInventory: mockGetInventory
}));

// Import services after mocking
const { autoGenerateMealPlan } = require('../services/mealPlanService');

describe('Meal Plan Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInventory.mockResolvedValue({
      items: [
        { name: 'ingredient1', amount: 1, unit: 'piece' },
        { name: 'ingredient2', amount: 2, unit: 'pieces' }
      ],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    mockGenerateRecipeSuggestions.mockResolvedValue([{
      name: 'Mock Recipe',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: ['step1', 'step2']
    }]);
  });

  test('autoGenerateMealPlan should generate meal plan with AI suggestions', async () => {
    const result = await autoGenerateMealPlan({
      name: 'AI Generated Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-07'
    });

    expect(mockGetInventory).toHaveBeenCalled();
    expect(mockGenerateRecipeSuggestions).toHaveBeenCalledWith(['ingredient1', 'ingredient2']);

    expect(result).toMatchObject({
      name: 'AI Generated Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      recipes: [{
        name: 'Mock Recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2']
      }],
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  test('autoGenerateMealPlan should handle no ingredients available', async () => {
    mockGetInventory.mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    await expect(autoGenerateMealPlan({
      name: 'AI Generated Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-07'
    })).rejects.toThrow('No ingredients available');

    expect(mockGenerateRecipeSuggestions).not.toHaveBeenCalled();
  });

  test('autoGenerateMealPlan should handle AI service errors gracefully', async () => {
    mockGenerateRecipeSuggestions.mockRejectedValueOnce(new Error('AI service error'));

    const result = await autoGenerateMealPlan({
      name: 'AI Generated Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-07'
    });

    expect(result).toMatchObject({
      name: 'AI Generated Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      recipes: [],
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });
}); 
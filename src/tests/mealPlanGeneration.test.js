/**
 * @jest-environment node
 */

import { generateMealPlan } from '../services/mealPlanService.js';

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                meals: [
                  {
                    name: 'Stir-fried rice with vegetables',
                    ingredients: ['rice', 'vegetables', 'soy sauce'],
                    instructions: 'Cook rice and stir-fry with vegetables'
                  }
                ]
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('Meal Plan Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate meal plan successfully', async () => {
    const preferences = {
      name: 'Test Meal Plan',
      ingredients: ['rice', 'vegetables'],
      dietary: [],
      excluded: [],
      mealsPerDay: 3,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: '123'
    };

    const result = await generateMealPlan(preferences);
    
    expect(result).toBeDefined();
    expect(result.meals).toBeInstanceOf(Array);
    expect(result.meals.length).toBeGreaterThan(0);
    expect(result.meals[0]).toHaveProperty('name');
    expect(result.meals[0]).toHaveProperty('ingredients');
    expect(result.meals[0]).toHaveProperty('instructions');
  });

  test('should handle empty ingredients', async () => {
    const preferences = {
      name: 'Test Meal Plan',
      ingredients: [],
      dietary: [],
      excluded: [],
      mealsPerDay: 3,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: '123'
    };

    await expect(generateMealPlan(preferences)).rejects.toThrow('No ingredients provided');
  });

  test('should handle API errors', async () => {
    const mockOpenAI = require('openai');
    mockOpenAI.OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    }));

    const preferences = {
      name: 'Test Meal Plan',
      ingredients: ['rice', 'vegetables'],
      dietary: [],
      excluded: [],
      mealsPerDay: 3,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: '123'
    };

    await expect(generateMealPlan(preferences)).rejects.toThrow('Failed to generate meal plan');
  });
}); 
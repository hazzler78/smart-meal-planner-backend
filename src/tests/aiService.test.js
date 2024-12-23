const { mockOpenAI, mockOpenAIResponse } = require('./mocks/openai');
const {
  getMealSuggestions,
  getIngredientSubstitutions,
  getRecipeInstructions,
  parseIngredient
} = require('../services/aiService');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMealSuggestions returns parsed suggestions', async () => {
    const result = await getMealSuggestions(['eggs', 'milk']);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // Add other tests...
}); 
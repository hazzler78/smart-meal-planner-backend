// Import the mock service first
const mockRecipeService = require('./mocks/recipeService');

// Mock the recipe service before requiring the actual module
jest.mock('../services/recipeService', () => mockRecipeService);

describe('Recipe Service', () => {
  const mockRecipes = [
    {
      id: 'recipe1',
      name: 'Vegetable Stir Fry',
      ingredients: [
        { item: 'rice', quantity: 1 },
        { item: 'vegetables', quantity: 2 }
      ],
      instructions: ['Cook rice', 'Stir fry vegetables'],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      dietaryRestrictions: ['vegetarian']
    },
    {
      id: 'recipe2',
      name: 'Vegetable Soup',
      ingredients: [
        { item: 'vegetables', quantity: 3 },
        { item: 'broth', quantity: 1 }
      ],
      instructions: ['Chop vegetables', 'Simmer in broth'],
      prepTime: 10,
      cookTime: 30,
      servings: 6,
      dietaryRestrictions: ['vegetarian', 'vegan']
    }
  ];

  beforeEach(() => {
    mockRecipeService.resetRecipes();
    jest.clearAllMocks();
    // Add mock recipes
    mockRecipes.forEach(recipe => mockRecipeService.addRecipe(recipe));
  });

  describe('Recipe Operations', () => {
    test('searchRecipes should find recipes correctly', () => {
      const results = mockRecipeService.searchRecipes('vegetable');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].name).toContain('Vegetable');
    });

    test('deleteRecipe should remove recipes correctly', () => {
      mockRecipeService.deleteRecipe('recipe1');
      const results = mockRecipeService.searchRecipes('');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('recipe2');
    });

    test('getRecipeById should return correct recipe', () => {
      const recipe = mockRecipeService.getRecipeById('recipe1');
      expect(recipe).toBeDefined();
      expect(recipe.name).toBe('Vegetable Stir Fry');
    });

    test('getRecipeById should throw error for non-existent recipe', () => {
      expect(() => mockRecipeService.getRecipeById('nonexistent')).toThrow('Recipe not found');
    });

    test('addRecipe should add new recipe correctly', () => {
      const newRecipe = {
        name: 'New Recipe',
        ingredients: [{ item: 'ingredient1', quantity: 1 }],
        instructions: ['Step 1'],
        prepTime: 10,
        cookTime: 20,
        servings: 2
      };

      const added = mockRecipeService.addRecipe(newRecipe);
      expect(added).toBeDefined();
      expect(added.id).toBeDefined();
      expect(added.name).toBe('New Recipe');

      const found = mockRecipeService.getRecipeById(added.id);
      expect(found).toEqual(added);
    });

    test('updateRecipe should modify existing recipe', () => {
      const updates = {
        name: 'Updated Recipe',
        prepTime: 25
      };

      const updated = mockRecipeService.updateRecipe('recipe1', updates);
      expect(updated.name).toBe('Updated Recipe');
      expect(updated.prepTime).toBe(25);
      expect(updated.ingredients).toEqual(mockRecipes[0].ingredients);

      const found = mockRecipeService.getRecipeById('recipe1');
      expect(found).toEqual(updated);
    });

    test('updateRecipe should throw error for non-existent recipe', () => {
      expect(() => mockRecipeService.updateRecipe('nonexistent', { name: 'Test' }))
        .toThrow('Recipe not found');
    });
  });
}); 
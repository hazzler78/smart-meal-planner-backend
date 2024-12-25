const shoppingListService = require('../services/shoppingListService');

// Mock inventoryService
jest.mock('../services/inventoryService', () => ({
  getInventoryWithFilters: jest.fn()
}));

// Import mocked module after mocking
const inventoryService = require('../services/inventoryService');

describe('Shopping List Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    shoppingListService.resetTestMode();

    // Reset the inventory service mock
    inventoryService.getInventoryWithFilters.mockReset();
    // Set default mock response
    inventoryService.getInventoryWithFilters.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 }
    });
  });

  describe('loadShoppingList', () => {
    it('should return an empty array in test mode', async () => {
      const list = await shoppingListService.loadShoppingList();
      expect(list).toEqual([]);
    });
  });

  describe('addToList', () => {
    it('should add new items to the shopping list', async () => {
      const items = [
        { ingredient: 'tomatoes', quantity: 2, unit: 'kg' },
        { ingredient: 'onions', quantity: 3, unit: 'pieces' }
      ];

      const updatedList = await shoppingListService.addToList(items);
      expect(updatedList).toEqual(items);
    });

    it('should combine quantities for same ingredients with same units', async () => {
      const initialItems = [
        { ingredient: 'tomatoes', quantity: 2, unit: 'kg' }
      ];
      await shoppingListService.addToList(initialItems);

      const newItems = [
        { ingredient: 'tomatoes', quantity: 1, unit: 'kg' }
      ];
      const updatedList = await shoppingListService.addToList(newItems);

      expect(updatedList).toEqual([
        { ingredient: 'tomatoes', quantity: 3, unit: 'kg' }
      ]);
    });

    it('should keep items separate when units differ', async () => {
      const initialItems = [
        { ingredient: 'flour', quantity: 500, unit: 'g' }
      ];
      await shoppingListService.addToList(initialItems);

      const newItems = [
        { ingredient: 'flour', quantity: 1, unit: 'kg' }
      ];
      const updatedList = await shoppingListService.addToList(newItems);

      expect(updatedList).toEqual([
        { ingredient: 'flour', quantity: 500, unit: 'g' },
        { ingredient: 'flour', quantity: 1, unit: 'kg' }
      ]);
    });
  });

  describe('removeFromList', () => {
    it('should remove specified items from the shopping list', async () => {
      const initialItems = [
        { ingredient: 'tomatoes', quantity: 2, unit: 'kg' },
        { ingredient: 'onions', quantity: 3, unit: 'pieces' }
      ];
      await shoppingListService.addToList(initialItems);

      const itemsToRemove = [
        { ingredient: 'tomatoes', quantity: 2, unit: 'kg' }
      ];
      const updatedList = await shoppingListService.removeFromList(itemsToRemove);

      expect(updatedList).toEqual([
        { ingredient: 'onions', quantity: 3, unit: 'pieces' }
      ]);
    });
  });

  describe('clearList', () => {
    it('should clear the entire shopping list', async () => {
      const initialItems = [
        { ingredient: 'tomatoes', quantity: 2, unit: 'kg' },
        { ingredient: 'onions', quantity: 3, unit: 'pieces' }
      ];
      await shoppingListService.addToList(initialItems);

      const clearedList = await shoppingListService.clearList();
      expect(clearedList).toEqual([]);
    });
  });

  describe('generateFromRecipes', () => {
    beforeEach(() => {
      // Reset mock before each test in this describe block
      jest.resetAllMocks();
      // Clear the test mode list
      shoppingListService.resetTestMode();
    });

    it('should generate shopping list from recipes considering inventory', async () => {
      // Mock inventory data
      inventoryService.getInventoryWithFilters.mockResolvedValue({
        items: [
          { item: 'tomatoes', quantity: 1, unit: 'kg' },  // Have 1kg, need 2kg
          { item: 'onions', quantity: 2, unit: 'pieces' }, // Have 2, need 5
          { item: 'garlic', quantity: 0, unit: 'cloves' }  // Have 0, need 3
        ],
        pagination: { page: 1, limit: 10, totalItems: 3, totalPages: 1 }
      });

      const recipes = [
        {
          name: 'Test Recipe',
          ingredients: [
            { item: 'tomatoes', quantity: 2, unit: 'kg' },
            { item: 'onions', quantity: 5, unit: 'pieces' },
            { item: 'garlic', quantity: 3, unit: 'cloves' }
          ]
        }
      ];

      const shoppingList = await shoppingListService.generateFromRecipes(recipes);

      // Should include only what we need beyond what's in inventory
      expect(shoppingList).toEqual([
        { ingredient: 'garlic', quantity: 3, unit: 'cloves' },
        { ingredient: 'onions', quantity: 3, unit: 'pieces' },
        { ingredient: 'tomatoes', quantity: 1, unit: 'kg' }
      ]);
    });

    it('should handle recipes with no missing ingredients', async () => {
      // Mock inventory with sufficient quantities
      inventoryService.getInventoryWithFilters.mockResolvedValue({
        items: [
          { item: 'tomatoes', quantity: 5, unit: 'kg' },     // Have more than needed
          { item: 'onions', quantity: 10, unit: 'pieces' }   // Have more than needed
        ],
        pagination: { page: 1, limit: 10, totalItems: 2, totalPages: 1 }
      });

      const recipes = [
        {
          name: 'Test Recipe',
          ingredients: [
            { item: 'tomatoes', quantity: 2, unit: 'kg' },
            { item: 'onions', quantity: 5, unit: 'pieces' }
          ]
        }
      ];

      const shoppingList = await shoppingListService.generateFromRecipes(recipes);
      expect(shoppingList).toEqual([]);  // Should need nothing
    });

    it('should combine needed quantities from multiple recipes', async () => {
      // Mock empty inventory
      inventoryService.getInventoryWithFilters.mockResolvedValue({
        items: [
          { item: 'flour', quantity: 200, unit: 'g' }  // Have 200g, need 800g total
        ],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 }
      });

      const recipes = [
        {
          name: 'Recipe 1',
          ingredients: [
            { item: 'flour', quantity: 500, unit: 'g' }
          ]
        },
        {
          name: 'Recipe 2',
          ingredients: [
            { item: 'flour', quantity: 300, unit: 'g' }
          ]
        }
      ];

      const shoppingList = await shoppingListService.generateFromRecipes(recipes);
      expect(shoppingList).toEqual([
        { ingredient: 'flour', quantity: 600, unit: 'g' }  // Need 800g - 200g = 600g
      ]);
    });
  });
}); 
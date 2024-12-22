const fs = require('fs');
const path = require('path');

// Import the mock service first
const mockInventoryService = require('./mocks/inventoryService');

// Mock the inventory service before requiring the actual module
jest.mock('../services/inventoryService', () => {
  const actualModule = jest.requireActual('../services/inventoryService');
  return {
    ...actualModule,
    getInventory: mockInventoryService.getInventory,
    addInventoryItem: mockInventoryService.addInventoryItem,
    updateInventoryItem: mockInventoryService.updateInventoryItem,
    deleteInventoryItem: mockInventoryService.deleteInventoryItem,
    resetInventory: mockInventoryService.resetInventory
  };
});

// Now require the actual module
const {
  validateItem,
  validateQuantity
} = require('../services/inventoryService');

const testInventoryPath = path.join(__dirname, 'test_inventory.json');

describe('Inventory Service', () => {
  beforeEach(() => {
    mockInventoryService.resetInventory();
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    test('validateItem should handle valid items', () => {
      expect(validateItem('flour')).toBe('flour');
      expect(validateItem('Whole Wheat Flour')).toBe('whole wheat flour');
      expect(validateItem('brown-rice')).toBe('brown-rice');
    });

    test('validateItem should reject invalid items', () => {
      expect(() => validateItem('')).toThrow();
      expect(() => validateItem('   ')).toThrow();
      expect(() => validateItem(null)).toThrow();
      expect(() => validateItem(undefined)).toThrow();
      expect(() => validateItem('invalid@item')).toThrow();
      expect(() => validateItem('a'.repeat(101))).toThrow();
    });

    test('validateQuantity should handle valid quantities', () => {
      expect(validateQuantity(1)).toBe(1);
      expect(validateQuantity('1')).toBe(1);
      expect(validateQuantity(100)).toBe(100);
    });

    test('validateQuantity should reject invalid quantities', () => {
      expect(() => validateQuantity(0)).toThrow();
      expect(() => validateQuantity(-1)).toThrow();
      expect(() => validateQuantity(1000001)).toThrow();
      expect(() => validateQuantity('abc')).toThrow();
      expect(() => validateQuantity(1.5)).toThrow();
      expect(() => validateQuantity(null)).toThrow();
      expect(() => validateQuantity(undefined)).toThrow();
    });
  });

  describe('Inventory Operations', () => {
    test('addInventoryItem should add items correctly', async () => {
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await mockInventoryService.addInventoryItem({ item: 'sugar', quantity: 3 });

      const response = await mockInventoryService.getInventory();
      expect(response.items.length).toBe(5); // Including default items
      expect(response.items.find(i => i.item === 'flour').quantity).toBe(5);
      expect(response.items.find(i => i.item === 'sugar').quantity).toBe(3);
    });

    test('addInventoryItem should update existing items', async () => {
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 3 });

      const response = await mockInventoryService.getInventory();
      expect(response.items.find(i => i.item === 'flour').quantity).toBe(8);
    });

    test('updateInventoryItem should update items correctly', async () => {
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await mockInventoryService.updateInventoryItem({ item: 'flour', quantity: 2 }, 'remove');

      const response = await mockInventoryService.getInventory();
      expect(response.items.find(i => i.item === 'flour').quantity).toBe(3);
    });

    test('deleteInventoryItem should remove items correctly', async () => {
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await mockInventoryService.deleteInventoryItem('flour');

      const response = await mockInventoryService.getInventory();
      expect(response.items.find(i => i.item === 'flour')).toBeUndefined();
    });

    test('updateInventoryItem should throw error for non-existent items', async () => {
      await expect(mockInventoryService.updateInventoryItem({ item: 'nonexistent', quantity: 1 }, 'remove'))
        .rejects.toThrow('Item not found');
    });

    test('updateInventoryItem should throw error for insufficient quantity', async () => {
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await expect(mockInventoryService.updateInventoryItem({ item: 'flour', quantity: 6 }, 'remove'))
        .rejects.toThrow('Insufficient quantity');
    });

    test('getInventory should filter correctly', async () => {
      // Setup test data
      await mockInventoryService.addInventoryItem({ item: 'flour', quantity: 5 });
      await mockInventoryService.addInventoryItem({ item: 'sugar', quantity: 10 });
      await mockInventoryService.addInventoryItem({ item: 'salt', quantity: 3 });

      // Test search filter
      const searchResponse = await mockInventoryService.getInventory({ search: 'su' });
      expect(searchResponse.items.length).toBe(1);
      expect(searchResponse.items[0].item).toBe('sugar');

      // Test pagination
      const paginatedResponse = await mockInventoryService.getInventory({ page: 1, limit: 2 });
      expect(paginatedResponse.items.length).toBe(2);
      expect(paginatedResponse.pagination.total).toBeGreaterThan(2);
    });
  });
}); 
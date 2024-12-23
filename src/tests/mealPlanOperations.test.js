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

// Mock the meal plan service
jest.mock('../services/mealPlanService', () => {
  const mealPlans = [];

  return {
    loadMealPlans: (options = {}) => {
      const { nameContains, startDate, sortBy, sortOrder, page = 1, limit = 10 } = options;
      
      let filteredPlans = [...mealPlans];

      // Apply filters
      if (nameContains) {
        filteredPlans = filteredPlans.filter(plan => plan.name.includes(nameContains));
      }
      if (startDate) {
        filteredPlans = filteredPlans.filter(plan => plan.startDate === startDate);
      }

      // Apply sorting
      if (sortBy) {
        filteredPlans.sort((a, b) => {
          const order = sortOrder === 'desc' ? -1 : 1;
          return order * a[sortBy].localeCompare(b[sortBy]);
        });
      }

      // Apply pagination
      const totalItems = filteredPlans.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

      return {
        mealPlans: paginatedPlans,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    },

    addMealPlan: (mealPlan) => {
      const newPlan = {
        ...mealPlan,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mealPlans.push(newPlan);
      return newPlan;
    },

    updateMealPlan: (id, updatedPlan) => {
      const index = mealPlans.findIndex(plan => plan.id === id);
      if (index === -1) {
        throw new Error('Meal plan not found');
      }
      mealPlans[index] = {
        ...updatedPlan,
        updatedAt: new Date().toISOString()
      };
      return mealPlans[index];
    },

    deleteMealPlan: (id) => {
      const index = mealPlans.findIndex(plan => plan.id === id);
      if (index === -1) {
        throw new Error('Meal plan not found');
      }
      mealPlans.splice(index, 1);
    },

    // For testing purposes
    __resetMealPlans: () => {
      mealPlans.length = 0;
    }
  };
});

// Import services after mocking
const {
  loadMealPlans,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan,
  __resetMealPlans
} = require('../services/mealPlanService');

describe('Meal Plan Operations', () => {
  beforeEach(() => {
    // Reset the meal plans array before each test
    __resetMealPlans();
    jest.clearAllMocks();
  });

  describe('Basic CRUD Operations', () => {
    test('loadMealPlans should handle invalid JSON gracefully', () => {
      fs.readFileSync = jest.fn(() => {
        throw new Error('Invalid JSON');
      });

      const result = loadMealPlans();
      expect(result).toEqual({
        mealPlans: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    test('addMealPlan should add meal plans correctly', async () => {
      const mealPlan = {
        name: 'Test Plan',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        recipes: [
          {
            name: 'Test Recipe',
            ingredients: ['ingredient1', 'ingredient2'],
            instructions: ['step1', 'step2']
          }
        ]
      };

      const result = await addMealPlan(mealPlan);
      expect(result).toMatchObject({
        ...mealPlan,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      const loaded = await loadMealPlans();
      expect(loaded.mealPlans).toHaveLength(1);
      expect(loaded.mealPlans[0]).toEqual(result);
    });

    test('updateMealPlan should update meal plans correctly', async () => {
      const mealPlan = await addMealPlan({
        name: 'Original Plan',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        recipes: []
      });

      const updatedData = {
        ...mealPlan,
        name: 'Updated Plan',
        recipes: [
          {
            name: 'New Recipe',
            ingredients: ['new ingredient'],
            instructions: ['new step']
          }
        ]
      };

      const result = await updateMealPlan(mealPlan.id, updatedData);
      expect(result).toMatchObject({
        ...updatedData,
        updatedAt: expect.any(String)
      });

      const loaded = await loadMealPlans();
      expect(loaded.mealPlans[0].name).toBe('Updated Plan');
    });

    test('deleteMealPlan should delete meal plans correctly', async () => {
      const mealPlan = await addMealPlan({
        name: 'Plan to Delete',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        recipes: []
      });

      await deleteMealPlan(mealPlan.id);
      const loaded = await loadMealPlans();
      expect(loaded.mealPlans).toHaveLength(0);
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(async () => {
      await addMealPlan({
        name: 'Plan A',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        recipes: []
      });
      await addMealPlan({
        name: 'Plan B',
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        recipes: []
      });
    });

    test('loadMealPlans should filter by name correctly', async () => {
      const result = await loadMealPlans({ nameContains: 'Plan A' });
      expect(result.mealPlans).toHaveLength(1);
      expect(result.mealPlans[0].name).toBe('Plan A');
    });

    test('loadMealPlans should filter by date correctly', async () => {
      const result = await loadMealPlans({ startDate: '2024-01-08' });
      expect(result.mealPlans).toHaveLength(1);
      expect(result.mealPlans[0].name).toBe('Plan B');
    });

    test('loadMealPlans should sort correctly', async () => {
      const result = await loadMealPlans({ sortBy: 'name', sortOrder: 'desc' });
      expect(result.mealPlans[0].name).toBe('Plan B');
      expect(result.mealPlans[1].name).toBe('Plan A');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      for (let i = 0; i < 15; i++) {
        await addMealPlan({
          name: `Plan ${i}`,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          recipes: []
        });
      }
    });

    test('loadMealPlans should paginate correctly', async () => {
      const page1 = await loadMealPlans({ page: 1, limit: 10 });
      expect(page1.mealPlans).toHaveLength(10);
      expect(page1.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false
      });

      const page2 = await loadMealPlans({ page: 2, limit: 10 });
      expect(page2.mealPlans).toHaveLength(5);
      expect(page2.pagination).toEqual({
        page: 2,
        limit: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      });
    });
  });
}); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs-extra');
const path = require('path');
const app = require('../../app');
const express = require('express');

let mongoServer;

// Create test data directory
const TEST_DATA_DIR = path.join(__dirname, '../../data');
const TEST_RECIPES_FILE = path.join(TEST_DATA_DIR, 'recipes.json');
const TEST_INVENTORY_FILE = path.join(TEST_DATA_DIR, 'inventory.json');
const TEST_MEALPLANS_FILE = path.join(TEST_DATA_DIR, 'mealplans.json');

// Setup before all tests
beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Create test data directory and files
  await fs.ensureDir(TEST_DATA_DIR);

  // Initialize test files with empty data
  const emptyData = { recipes: [], items: [], mealPlans: [] };
  await fs.writeJson(TEST_RECIPES_FILE, emptyData);
  await fs.writeJson(TEST_INVENTORY_FILE, emptyData);
  await fs.writeJson(TEST_MEALPLANS_FILE, emptyData);

  // Initialize routes
  app.use(express.json());
  app.use('/api/inventory', require('../../routes/inventoryRoutes'));
  app.use('/api/recipes', require('../../routes/recipeRoutes'));
  app.use('/api/mealplans', require('../../routes/mealPlanRoutes'));
  app.use('/api/suggestions', require('../../routes/suggestionRoutes'));

  // Mock mongoose connection for integration tests
  mongoose.connect = jest.fn().mockResolvedValue(mongoose);
  mongoose.connection.on = jest.fn();
  mongoose.connection.once = jest.fn();
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();

  // Clean up test files and directory
  try {
    await fs.remove(TEST_DATA_DIR);
  } catch (error) {
    console.error('Error cleaning up test data directory:', error);
  }
});

// Reset database collections before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }

  // Reset test files with empty data
  const emptyData = { recipes: [], items: [], mealPlans: [] };
  await fs.writeJson(TEST_RECIPES_FILE, emptyData);
  await fs.writeJson(TEST_INVENTORY_FILE, emptyData);
  await fs.writeJson(TEST_MEALPLANS_FILE, emptyData);
}); 
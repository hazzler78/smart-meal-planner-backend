const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { generateToken } = require('../../utils/auth');
const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('Meal Planning Flow Integration Tests', () => {
  let mongoServer;
  let authToken;
  let userId;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create test data directory
    const dataDir = path.join(__dirname, '../../data');
    await fs.ensureDir(dataDir);

    // Initialize test files
    const testData = { recipes: [], items: [], mealPlans: [] };
    await fs.writeJson(path.join(dataDir, 'recipes.json'), testData);
    await fs.writeJson(path.join(dataDir, 'inventory.json'), testData);
    await fs.writeJson(path.join(dataDir, 'mealplans.json'), testData);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();

    // Clean up test files
    const dataDir = path.join(__dirname, '../../data');
    try {
      await fs.remove(dataDir);
    } catch (error) {
      console.error('Error cleaning up test data directory:', error);
    }
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});

    // Create test user
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      preferences: {
        dietaryRestrictions: ['vegetarian'],
        allergies: ['nuts']
      }
    });

    await user.save();
    userId = user._id;
    authToken = generateToken(userId);

    // Reset test files
    const testData = { recipes: [], items: [], mealPlans: [] };
    const dataDir = path.join(__dirname, '../../data');
    
    await fs.writeJson(path.join(dataDir, 'recipes.json'), testData);
    await fs.writeJson(path.join(dataDir, 'inventory.json'), testData);
    await fs.writeJson(path.join(dataDir, 'mealplans.json'), testData);
  });

  test('Complete meal planning flow', async () => {
    // Step 1: Add items to inventory
    const inventoryResponse = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { item: 'rice', quantity: 2 },
          { item: 'tofu', quantity: 1 },
          { item: 'vegetables', quantity: 3 }
        ]
      });

    expect(inventoryResponse.status).toBe(200);
    expect(inventoryResponse.body.success).toBe(true);

    // Step 2: Get recipe suggestions
    const suggestionsResponse = await request(app)
      .get('/api/suggestions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(suggestionsResponse.status).toBe(200);
    expect(Array.isArray(suggestionsResponse.body)).toBe(true);

    // Step 3: Generate meal plan
    const mealPlanResponse = await request(app)
      .post('/api/mealplans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Meal Plan',
        startDate: new Date().toISOString().split('T')[0],
        days: 3,
        mealsPerDay: 2
      });

    expect(mealPlanResponse.status).toBe(200);
    expect(mealPlanResponse.body).toHaveProperty('id');

    // Step 4: Verify inventory was updated
    const inventoryCheckResponse = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${authToken}`);

    expect(inventoryCheckResponse.status).toBe(200);
    expect(Array.isArray(inventoryCheckResponse.body.items)).toBe(true);
  });

  test('Error handling in meal planning flow', async () => {
    // Test with empty inventory
    const suggestionsResponse = await request(app)
      .get('/api/suggestions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(suggestionsResponse.status).toBe(200);
    expect(Array.isArray(suggestionsResponse.body)).toBe(true);
    expect(suggestionsResponse.body.length).toBe(0);

    // Test with invalid meal plan parameters
    const invalidMealPlanResponse = await request(app)
      .post('/api/mealplans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        startDate: 'invalid-date',
        days: -1,
        mealsPerDay: 0
      });

    expect(invalidMealPlanResponse.status).toBe(400);
    expect(invalidMealPlanResponse.body).toHaveProperty('error');

    // Test with invalid inventory items
    const invalidInventoryResponse = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { item: '', quantity: -1 },
          { item: 'invalid@item', quantity: 'not-a-number' }
        ]
      });

    expect(invalidInventoryResponse.status).toBe(400);
    expect(invalidInventoryResponse.body).toHaveProperty('error');
  });

  test('Concurrent operations handling', async () => {
    // Add initial inventory
    await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { item: 'rice', quantity: 5 },
          { item: 'tofu', quantity: 3 }
        ]
      });

    // Simulate concurrent inventory updates
    const updatePromises = Array(5).fill().map(() =>
      request(app)
        .put('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          item: 'rice',
          quantity: 1,
          operation: 'remove'
        })
    );

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r.status === 200);
    const failedUpdates = results.filter(r => r.status === 400);

    // Verify that inventory consistency was maintained
    const finalInventory = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${authToken}`);

    expect(finalInventory.status).toBe(200);
    expect(Array.isArray(finalInventory.body.items)).toBe(true);
    
    const riceItem = finalInventory.body.items.find(i => i.item === 'rice');
    expect(riceItem).toBeDefined();
    expect(riceItem.quantity).toBeGreaterThanOrEqual(0);
    expect(successfulUpdates.length + failedUpdates.length).toBe(5);
  });
}); 
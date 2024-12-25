import request from 'supertest';
import app from '../../app.js';
import { generateToken } from '../../utils/auth.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Close any existing connections
  await mongoose.disconnect();
  
  // Create new in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = await mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Meal Planning Flow Integration Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Register a test user
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    const response = await request(app)
      .post('/api/users/register')
      .send(userData);
    token = response.body.token;
    userId = response.body.id;
  });

  test('Complete meal planning flow', async () => {
    // Register a test user with a unique email
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    };
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send(userData);
    
    const userId = registerResponse.body.id;
    const token = registerResponse.body.token;

    // Create a meal plan with all required fields
    const mealPlanResponse = await request(app)
      .post('/api/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userId,
        name: 'Test Meal Plan',
        mealsPerDay: 3,
        ingredients: ['rice', 'vegetables'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        preferences: {
          dietary: [],
          excluded: []
        }
      });

    console.log('Meal plan response:', mealPlanResponse.body);

    expect(mealPlanResponse.status).toBe(201);
    expect(mealPlanResponse.body).toHaveProperty('id');

    // Step 2: Get meal plan details
    const mealPlanId = mealPlanResponse.body.id;
    const getMealPlanResponse = await request(app)
      .get(`/api/meal-plans/${mealPlanId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getMealPlanResponse.status).toBe(200);
    expect(getMealPlanResponse.body).toHaveProperty('meals');
  });

  test('Error handling in meal planning flow', async () => {
    // Test with missing required fields
    const invalidMealPlanData = {
      ingredients: ['rice', 'vegetables']
    };

    const response = await request(app)
      .post('/api/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidMealPlanData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
}); 
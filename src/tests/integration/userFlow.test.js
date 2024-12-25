/**
 * @jest-environment node
 */

import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/User.js';

describe('User Flow Integration Tests', () => {
  const mockUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  describe('Registration Flow', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(mockUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(mockUser.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not register user with existing email', async () => {
      await request(app)
        .post('/api/users/register')
        .send(mockUser);

      const response = await request(app)
        .post('/api/users/register')
        .send(mockUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should not register user with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ email: mockUser.email });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send(mockUser);
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(mockUser.email.toLowerCase());
    });

    test('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: mockUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: mockUser.password
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    let token;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(mockUser);
      token = response.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(mockUser.email.toLowerCase());
    });

    test('should not access protected route without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should not access protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should update user profile with valid token', async () => {
      const updates = { name: 'Updated Name' };
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.email).toBe(mockUser.email.toLowerCase());
    });
  });
}); 
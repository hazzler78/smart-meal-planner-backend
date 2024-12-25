/**
 * @jest-environment node
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import * as userService from '../services/userService.js';

let mongoServer;

beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Create new in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
  }
});

describe('User Service Tests', () => {
  const mockUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  describe('createUser', () => {
    test('should create a new user successfully', async () => {
      const user = await userService.createUser(mockUser);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(mockUser.email.toLowerCase());
      expect(user.name).toBe(mockUser.name);
      expect(user.password).toBeUndefined();
      expect(user.id).toBeDefined();
    });

    test('should not allow duplicate emails', async () => {
      await userService.createUser(mockUser);
      
      await expect(userService.createUser(mockUser))
        .rejects
        .toThrow('User already exists');
    });

    test('should hash the password', async () => {
      const user = await User.create(mockUser);
      expect(user.password).not.toBe(mockUser.password);
    });
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      await userService.createUser(mockUser);
      const user = await userService.getUserByEmail(mockUser.email);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(mockUser.email.toLowerCase());
    });

    test('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('validateCredentials', () => {
    test('should validate correct credentials', async () => {
      await userService.createUser(mockUser);
      const isValid = await userService.validateCredentials(mockUser.email, mockUser.password);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      await userService.createUser(mockUser);
      const isValid = await userService.validateCredentials(mockUser.email, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const isValid = await userService.validateCredentials('nonexistent@example.com', mockUser.password);
      expect(isValid).toBe(false);
    });
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      const createdUser = await userService.createUser(mockUser);
      const user = await userService.getUserById(createdUser.id);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(mockUser.email.toLowerCase());
    });

    test('should return null for non-existent id', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId that doesn't exist
      const user = await userService.getUserById(nonExistentId);
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    test('should update user details', async () => {
      const createdUser = await userService.createUser(mockUser);
      const updates = { name: 'Updated Name' };
      
      const updatedUser = await userService.updateUser(createdUser.id, updates);
      
      expect(updatedUser.name).toBe(updates.name);
      expect(updatedUser.email).toBe(mockUser.email.toLowerCase());
    });

    test('should not update email to existing email', async () => {
      const user1 = await userService.createUser(mockUser);
      const user2 = await userService.createUser({
        ...mockUser,
        email: 'another@example.com'
      });

      await expect(userService.updateUser(user2.id, { email: user1.email }))
        .rejects
        .toThrow('Email already exists');
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const user = await userService.createUser(mockUser);
      await userService.deleteUser(user.id);
      
      const deletedUser = await userService.getUserById(user.id);
      expect(deletedUser).toBeNull();
    });

    test('should handle non-existent user deletion gracefully', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId that doesn't exist
      await expect(userService.deleteUser(nonExistentId))
        .resolves
        .not.toThrow();
    });
  });
}); 
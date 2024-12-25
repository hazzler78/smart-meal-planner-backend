import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase()
    });

    return user.toJSON();
  } catch (error) {
    if (error.code === 11000 || error.message === 'User already exists') {
      throw new Error('User already exists');
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function getUserByEmail(email) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user ? user.toJSON() : null;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function validateCredentials(email, password) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return false;
    }

    const isValid = await user.comparePassword(password);
    return isValid;
  } catch (error) {
    throw new Error(`Failed to validate credentials: ${error.message}`);
  }
}

export async function getUserById(userId) {
  try {
    const user = await User.findById(userId);
    return user ? user.toJSON() : null;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function updateUser(userId, updates) {
  try {
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return user ? user.toJSON() : null;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Email already exists');
    }
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

export async function deleteUser(userId) {
  try {
    await User.findByIdAndDelete(userId);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function loginUser(email, password) {
  try {
    const isValid = await validateCredentials(email, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const user = await getUserByEmail(email);
    return user;
  } catch (error) {
    throw new Error(`Failed to login: ${error.message}`);
  }
}

export async function registerUser(userData) {
  try {
    const user = await createUser(userData);
    return user;
  } catch (error) {
    throw new Error(`Failed to register: ${error.message}`);
  }
} 
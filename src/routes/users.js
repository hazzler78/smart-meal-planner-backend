import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import * as userService from '../services/userService.js';
import { generateToken } from '../utils/auth.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  console.log('Login request body:', req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const isValid = await userService.validateCredentials(email, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await userService.getUserByEmail(email);
    const token = generateToken(user.id);

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  console.log('Registration request body:', req.body);
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user
    const user = await userService.createUser({ email, password, name });
    const token = generateToken(user.id);

    res.status(201).json({ token, user });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  console.log('Profile request for user:', req.user.id);
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password updates through this route

    const user = await userService.updateUser(req.user.id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete user account
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    await userService.deleteUser(req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router; 
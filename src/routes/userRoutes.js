const express = require('express');
const { register, login, updatePreferences } = require('../services/userService');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const user = await register(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.put('/preferences', auth, async (req, res) => {
  try {
    const preferences = await updatePreferences(req.user.userId, req.body);
    res.json(preferences);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 
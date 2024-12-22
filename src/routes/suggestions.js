const express = require('express');
const router = express.Router();

// Get recipe suggestions
router.get('/', async (req, res) => {
  try {
    // For testing purposes, return empty array
    // In production, this would call the AI service
    res.json([]);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router; 
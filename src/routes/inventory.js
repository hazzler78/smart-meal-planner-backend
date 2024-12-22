const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// In-memory storage for inventory (for testing)
let inventory = { items: [] };

// Get inventory
router.get('/', (req, res) => {
  res.json(inventory);
});

// Add items to inventory
router.post('/',
  [
    body('items').isArray(),
    body('items.*.item').notEmpty().trim(),
    body('items.*.quantity').isInt({ min: 0 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { items } = req.body;
    
    // Update or add new items
    items.forEach(newItem => {
      const existingItem = inventory.items.find(item => item.item === newItem.item);
      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        inventory.items.push(newItem);
      }
    });

    res.json({ success: true, inventory });
  }
);

// Update inventory item
router.put('/',
  [
    body('item').notEmpty().trim(),
    body('quantity').isInt({ min: 0 }),
    body('operation').isIn(['add', 'remove', 'set'])
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { item, quantity, operation } = req.body;
    const existingItem = inventory.items.find(i => i.item === item);

    if (!existingItem && operation !== 'set') {
      return res.status(400).json({ error: 'Item not found in inventory' });
    }

    switch (operation) {
      case 'add':
        existingItem.quantity += quantity;
        break;
      case 'remove':
        if (existingItem.quantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        existingItem.quantity -= quantity;
        break;
      case 'set':
        if (!existingItem) {
          inventory.items.push({ item, quantity });
        } else {
          existingItem.quantity = quantity;
        }
        break;
    }

    res.json({ success: true, inventory });
  }
);

module.exports = router; 
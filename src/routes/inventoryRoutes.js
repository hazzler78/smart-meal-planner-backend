import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import {
  addInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem
} from '../services/inventoryService.js';

const router = express.Router();

/**
 * @route GET /api/inventory
 * @description Get all inventory items for the authenticated user
 * @access Private
 * @returns {Array} List of inventory items
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await getInventory(req.user.id);
    res.json(items);
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

/**
 * @route POST /api/inventory
 * @description Add a new item to inventory
 * @access Private
 * @body {
 *   name: string - Name of the item
 *   quantity: number - Amount of the item
 *   unit: string - Unit of measurement (e.g., 'kg', 'pieces', 'liters')
 *   category: string - Category of the item (e.g., 'produce', 'dairy', 'pantry')
 *   state: string - State of the item (e.g., 'fresh', 'frozen', 'packaged')
 * }
 * @returns {Object} Added inventory item
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, quantity, unit, category, state } = req.body;
    
    // Validate required fields
    if (!name || !quantity || !unit || !category || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'quantity', 'unit', 'category', 'state']
      });
    }

    const item = await addInventoryItem(req.user.id, {
      name,
      quantity,
      unit,
      category,
      state
    });

    res.status(201).json(item);
  } catch (error) {
    if (error.message.includes('must be') || error.message.includes('cannot')) {
      // Validation errors
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error adding inventory item:', error);
      res.status(500).json({ error: 'Failed to add item to inventory' });
    }
  }
});

/**
 * @route PUT /api/inventory/:id
 * @description Update an inventory item
 * @access Private
 * @params {string} id - ID of the item to update
 * @body {
 *   quantity?: number - New quantity
 *   unit?: string - New unit
 *   category?: string - New category
 *   state?: string - New state
 * }
 * @returns {Object} Updated inventory item
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await updateInventoryItem(req.user.id, id, updates);
    res.json(item);
  } catch (error) {
    if (error.message === 'Item not found') {
      res.status(404).json({ error: 'Item not found' });
    } else if (error.message.includes('must be') || error.message.includes('cannot')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  }
});

/**
 * @route DELETE /api/inventory/:id
 * @description Delete an inventory item
 * @access Private
 * @params {string} id - ID of the item to delete
 * @returns {Object} Success message
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteInventoryItem(req.user.id, id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router; 
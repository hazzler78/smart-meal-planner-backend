import fs from 'fs/promises';
import path from 'path';

// Use test file in test environment
const INVENTORY_FILE = process.env.NODE_ENV === 'test' 
  ? path.join(process.cwd(), 'data', 'test-inventory.json')
  : path.join(process.cwd(), 'data', 'inventory.json');

/**
 * Validate and normalize an item name
 * @param {string} name - The item name to validate
 * @returns {string} The normalized item name
 * @throws {Error} If the item name is invalid
 */
export function validateItem(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Item name must be a non-empty string');
  }
  
  // Trim whitespace
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Item name cannot be empty or just whitespace');
  }
  
  // Check length
  if (trimmed.length > 100) {
    throw new Error('Item name cannot exceed 100 characters');
  }
  
  // Check for invalid characters
  if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
    throw new Error('Item name can only contain letters, numbers, spaces, and hyphens');
  }
  
  // Convert to lowercase for consistency
  return trimmed.toLowerCase();
}

/**
 * Validate and normalize a quantity value
 * @param {number|string} quantity - The quantity to validate
 * @returns {number} The normalized quantity
 * @throws {Error} If the quantity is invalid
 */
export function validateQuantity(quantity) {
  if (quantity === null || quantity === undefined) {
    throw new Error('Quantity is required');
  }
  
  const num = Number(quantity);
  if (isNaN(num)) {
    throw new Error('Quantity must be a valid number');
  }
  
  if (!Number.isInteger(num)) {
    throw new Error('Quantity must be a whole number');
  }
  
  if (num <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  
  if (num > 1000000) {
    throw new Error('Quantity cannot exceed 1,000,000');
  }
  
  return num;
}

/**
 * Add an item to the user's inventory
 * @param {string} userId - The ID of the user
 * @param {Object} item - The item to add
 * @param {string} item.name - Name of the item
 * @param {number} item.quantity - Quantity of the item
 * @param {string} item.unit - Unit of measurement
 * @param {string} item.category - Category of the item
 * @param {string} item.state - State of the item (fresh, packaged, etc.)
 * @returns {Promise<Object>} The added item
 */
export async function addInventoryItem(userId, item) {
  try {
    // Validate required fields
    if (!item.name || !item.quantity || !item.unit || !item.category || !item.state) {
      throw new Error('Missing required fields');
    }

    // Validate and normalize item name and quantity
    const normalizedName = validateItem(item.name);
    const normalizedQuantity = validateQuantity(item.quantity);

    // Ensure data directory exists
    await fs.mkdir(path.dirname(INVENTORY_FILE), { recursive: true });

    // Load current inventory
    let inventory = [];
    try {
      const data = await fs.readFile(INVENTORY_FILE, 'utf8');
      inventory = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty inventory
      inventory = [];
    }

    // Generate a unique ID for the item
    const newItem = {
      id: Date.now().toString(),
      ...item,
      name: normalizedName,
      quantity: normalizedQuantity,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Find if item already exists for this user
    const existingItemIndex = inventory.findIndex(
      i => i.userId === userId && 
           i.name === normalizedName &&
           i.unit === item.unit
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      inventory[existingItemIndex] = {
        ...inventory[existingItemIndex],
        quantity: inventory[existingItemIndex].quantity + normalizedQuantity,
        updatedAt: new Date().toISOString()
      };
      newItem.id = inventory[existingItemIndex].id;
    } else {
      // Add new item
      inventory.push(newItem);
    }

    // Save updated inventory
    await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventory, null, 2));

    return existingItemIndex >= 0 ? inventory[existingItemIndex] : newItem;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw new Error('Failed to add item to inventory');
  }
}

/**
 * Get all inventory items for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} Array of inventory items
 */
export async function getInventory(userId) {
  try {
    const data = await fs.readFile(INVENTORY_FILE, 'utf8');
    const inventory = JSON.parse(data);
    return inventory.filter(item => item.userId === userId);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Update an inventory item
 * @param {string} userId - The ID of the user
 * @param {string} itemId - The ID of the item to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated item
 */
export async function updateInventoryItem(userId, itemId, updates) {
  try {
    const data = await fs.readFile(INVENTORY_FILE, 'utf8');
    let inventory = JSON.parse(data);
    
    const itemIndex = inventory.findIndex(
      item => item.userId === userId && item.id === itemId
    );
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    inventory[itemIndex] = {
      ...inventory[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventory, null, 2));
    return inventory[itemIndex];
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw new Error('Failed to update inventory item');
  }
}

/**
 * Delete an inventory item
 * @param {string} userId - The ID of the user
 * @param {string} itemId - The ID of the item to delete
 * @returns {Promise<void>}
 */
export async function deleteInventoryItem(userId, itemId) {
  try {
    const data = await fs.readFile(INVENTORY_FILE, 'utf8');
    let inventory = JSON.parse(data);
    
    inventory = inventory.filter(
      item => !(item.userId === userId && item.id === itemId)
    );
    
    await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventory, null, 2));
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw new Error('Failed to delete inventory item');
  }
} 
const fs = require("fs");
const path = require("path");

const inventoryFilePath = path.join(__dirname, "../data/inventory.json");

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(inventoryFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const loadInventory = () => {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(inventoryFilePath)) {
      saveInventory({});
      return {};
    }
    return JSON.parse(fs.readFileSync(inventoryFilePath, "utf-8"));
  } catch (error) {
    console.error("Error loading inventory:", error);
    return {};
  }
};

const saveInventory = (inventory) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
  } catch (error) {
    console.error("Error saving inventory:", error);
    throw new Error("Failed to save inventory");
  }
};

const validateItem = (item) => {
  if (!item || typeof item !== 'string' || item.trim().length === 0) {
    throw new Error('Item name must be a non-empty string');
  }
  if (item.length > 100) {
    throw new Error('Item name must be less than 100 characters');
  }
  if (!/^[a-zA-Z0-9\s-]+$/.test(item)) {
    throw new Error('Item name can only contain letters, numbers, spaces, and hyphens');
  }
  return item.trim().toLowerCase();
};

const validateQuantity = (quantity) => {
  const num = Number(quantity);
  if (!Number.isInteger(num)) {
    throw new Error('Quantity must be an integer');
  }
  if (num <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (num > 1000000) {
    throw new Error('Quantity must be less than 1,000,000');
  }
  return num;
};

const getInventoryWithFilters = (filters = {}) => {
  const {
    nameContains,
    minQuantity,
    maxQuantity,
    sortBy,
    sortOrder,
    page = 1,
    limit = 10
  } = filters;

  const inventory = loadInventory();
  let items = Object.entries(inventory).map(([item, quantity]) => ({
    item,
    quantity
  }));

  // Apply name filter
  if (nameContains) {
    items = items.filter(entry => 
      entry.item.includes(nameContains.toLowerCase())
    );
  }

  // Apply quantity filters
  if (minQuantity !== undefined) {
    items = items.filter(entry => entry.quantity >= minQuantity);
  }
  if (maxQuantity !== undefined) {
    items = items.filter(entry => entry.quantity <= maxQuantity);
  }

  // Apply sorting
  if (sortBy) {
    items.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'desc' 
          ? b.item.localeCompare(a.item)
          : a.item.localeCompare(b.item);
      }
      if (sortBy === 'quantity') {
        return sortOrder === 'desc'
          ? b.quantity - a.quantity
          : a.quantity - b.quantity;
      }
      return 0;
    });
  }

  // Calculate pagination
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Return paginated results with metadata
  return {
    items: items.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

const addItem = (item, quantity) => {
  const validatedItem = validateItem(item);
  const validatedQuantity = validateQuantity(quantity);

  const inventory = loadInventory();
  inventory[validatedItem] = (inventory[validatedItem] || 0) + validatedQuantity;
  saveInventory(inventory);
  return inventory;
};

const removeItem = (item, quantity) => {
  const validatedItem = validateItem(item);
  const validatedQuantity = validateQuantity(quantity);

  const inventory = loadInventory();
  if (!inventory[validatedItem]) {
    throw new Error('Item not found in inventory');
  }
  if (inventory[validatedItem] < validatedQuantity) {
    throw new Error(`Insufficient quantity. Only ${inventory[validatedItem]} available`);
  }

  inventory[validatedItem] -= validatedQuantity;
  if (inventory[validatedItem] === 0) {
    delete inventory[validatedItem];
  }
  saveInventory(inventory);
  return inventory;
};

const checkItemQuantity = (item) => {
  const inventory = loadInventory();
  return inventory[item] || 0;
};

module.exports = {
  addItem,
  removeItem,
  checkItemQuantity,
  getInventoryWithFilters,
  validateItem,
  validateQuantity,
  loadInventory,
  saveInventory,
  inventoryFilePath
}; 
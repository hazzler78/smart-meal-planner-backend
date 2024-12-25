import fs from 'fs';
import path from 'path';
import { 
  addItem, 
  removeItem, 
  getInventoryWithFilters,
  loadInventory,
  saveInventory,
  inventoryFilePath
} from '../services/inventoryService.js';

describe('Inventory Persistence Tests', () => {
  // Save the original NODE_ENV
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Ensure we're not in test mode so data is actually saved
    process.env.NODE_ENV = 'development';
    
    // Clear the inventory file before each test
    if (fs.existsSync(inventoryFilePath)) {
      fs.writeFileSync(inventoryFilePath, JSON.stringify({}));
    }
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  afterAll(() => {
    // Clean up the inventory file after all tests
    if (fs.existsSync(inventoryFilePath)) {
      fs.unlinkSync(inventoryFilePath);
    }
  });

  test('should persist added items to inventory.json', () => {
    // Add items
    addItem('rice', 2);
    addItem('beans', 3);

    // Read the file directly
    const fileContent = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf-8'));
    
    // Verify file content
    expect(fileContent).toHaveProperty('rice', 2);
    expect(fileContent).toHaveProperty('beans', 3);
  });

  test('should persist removed items to inventory.json', () => {
    // Setup initial inventory
    addItem('rice', 5);
    addItem('beans', 3);

    // Remove some items
    removeItem('rice', 2);

    // Read the file directly
    const fileContent = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf-8'));
    
    // Verify file content
    expect(fileContent).toHaveProperty('rice', 3);
    expect(fileContent).toHaveProperty('beans', 3);
  });

  test('should remove items completely when quantity reaches 0', () => {
    // Setup initial inventory
    addItem('rice', 2);
    addItem('beans', 3);

    // Remove all rice
    removeItem('rice', 2);

    // Read the file directly
    const fileContent = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf-8'));
    
    // Verify rice is removed and beans remain
    expect(fileContent).not.toHaveProperty('rice');
    expect(fileContent).toHaveProperty('beans', 3);
  });

  test('should load persisted data correctly', () => {
    // Setup initial data
    const initialData = {
      'rice': 2,
      'beans': 3
    };
    fs.writeFileSync(inventoryFilePath, JSON.stringify(initialData));

    // Load the inventory
    const inventory = loadInventory();

    // Verify loaded data matches what was written
    expect(inventory).toEqual(initialData);
  });

  test('should handle concurrent operations correctly', async () => {
    // Add initial inventory
    addItem('rice', 5);

    // Perform multiple concurrent remove operations
    const operations = Array(3).fill().map(() => 
      Promise.resolve(removeItem('rice', 1))
    );

    await Promise.all(operations);

    // Read the file directly
    const fileContent = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf-8'));
    
    // Verify final state is correct
    expect(fileContent).toHaveProperty('rice', 2);
  });
}); 
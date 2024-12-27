import fs from 'fs';
import path from 'path';
import {
  addInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem
} from '../services/inventoryService.js';

const TEST_USER_ID = 'test-user-123';
const TEST_DATA_DIR = path.join(process.cwd(), 'data');
const TEST_INVENTORY_FILE = path.join(TEST_DATA_DIR, 'test-inventory.json');

describe('Inventory Persistence Tests', () => {
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Ensure the data directory exists
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clear the test inventory file before each test
    if (fs.existsSync(TEST_INVENTORY_FILE)) {
      fs.unlinkSync(TEST_INVENTORY_FILE);
    }
    // Create an empty inventory file
    fs.writeFileSync(TEST_INVENTORY_FILE, '[]');
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(TEST_INVENTORY_FILE)) {
      fs.unlinkSync(TEST_INVENTORY_FILE);
    }
  });

  afterAll(() => {
    // Clean up the test data directory
    if (fs.existsSync(TEST_INVENTORY_FILE)) {
      fs.unlinkSync(TEST_INVENTORY_FILE);
    }
    // Note: We don't delete the data directory as it might be used by other tests
  });

  test('should persist added items to inventory.json', async () => {
    // Add items
    await addInventoryItem(TEST_USER_ID, {
      name: 'rice',
      quantity: 2,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    await addInventoryItem(TEST_USER_ID, {
      name: 'beans',
      quantity: 3,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    // Read the file directly
    const fileContent = fs.readFileSync(TEST_INVENTORY_FILE, 'utf8');
    const savedInventory = JSON.parse(fileContent);

    // Verify items were saved
    expect(savedInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'rice',
          quantity: 2
        }),
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'beans',
          quantity: 3
        })
      ])
    );
  });

  test('should update existing items in inventory.json', async () => {
    // Add initial item
    const item = await addInventoryItem(TEST_USER_ID, {
      name: 'rice',
      quantity: 2,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    // Update the item
    await updateInventoryItem(TEST_USER_ID, item.id, {
      quantity: 5
    });

    // Read the file directly
    const fileContent = fs.readFileSync(TEST_INVENTORY_FILE, 'utf8');
    const savedInventory = JSON.parse(fileContent);

    // Verify item was updated
    expect(savedInventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'rice',
          quantity: 5
        })
      ])
    );
  });

  test('should delete items from inventory.json', async () => {
    // Add initial item
    const item = await addInventoryItem(TEST_USER_ID, {
      name: 'rice',
      quantity: 2,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    // Delete the item
    await deleteInventoryItem(TEST_USER_ID, item.id);

    // Read the file directly
    const fileContent = fs.readFileSync(TEST_INVENTORY_FILE, 'utf8');
    const savedInventory = JSON.parse(fileContent);

    // Verify item was deleted
    expect(savedInventory).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'rice'
        })
      ])
    );
  });

  test('should load persisted data correctly', async () => {
    // Add some test data
    await addInventoryItem(TEST_USER_ID, {
      name: 'rice',
      quantity: 2,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    await addInventoryItem(TEST_USER_ID, {
      name: 'beans',
      quantity: 3,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    // Load the inventory
    const inventory = await getInventory(TEST_USER_ID);

    // Verify loaded data
    expect(inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'rice',
          quantity: 2
        }),
        expect.objectContaining({
          userId: TEST_USER_ID,
          name: 'beans',
          quantity: 3
        })
      ])
    );
  });

  test('should handle concurrent operations correctly', async () => {
    // Add initial item
    const item = await addInventoryItem(TEST_USER_ID, {
      name: 'rice',
      quantity: 5,
      unit: 'kg',
      category: 'pantry',
      state: 'packaged'
    });

    // Perform multiple concurrent update operations
    const operations = Array(3).fill().map(() =>
      updateInventoryItem(TEST_USER_ID, item.id, {
        quantity: 2
      })
    );

    // Wait for all operations to complete
    await Promise.all(operations);

    // Verify final state
    const inventory = await getInventory(TEST_USER_ID);
    const riceItem = inventory.find(i => i.name === 'rice');
    expect(riceItem).toBeDefined();
    expect(riceItem.quantity).toBe(2); // Last update should win
  });
}); 
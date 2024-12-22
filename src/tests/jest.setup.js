const fs = require('fs');
const path = require('path');

// Define test data directory
const TEST_DATA_DIR = path.join(__dirname, '../data');

// Create test data directory if it doesn't exist
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

// Setup test environment before all tests
beforeAll(() => {
  // Create empty test files if they don't exist
  const testFiles = {
    'inventory.json': [],
    'recipes.json': [],
    'users.json': []
  };

  Object.entries(testFiles).forEach(([filename, initialData]) => {
    const filePath = path.join(TEST_DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(initialData));
    }
  });
});

// Cleanup after each test
afterEach(() => {
  // Reset test files to empty state
  const testFiles = {
    'inventory.json': [],
    'recipes.json': [],
    'users.json': []
  };

  Object.entries(testFiles).forEach(([filename, initialData]) => {
    const filePath = path.join(TEST_DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(initialData));
  });
});

// Global test environment setup
global.TEST_DATA_DIR = TEST_DATA_DIR; 
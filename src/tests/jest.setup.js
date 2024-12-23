process.env.OPENAI_API_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// Mock MongoDB
jest.mock('mongodb', () => ({
  ObjectId: jest.fn(id => id),
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    db: jest.fn()
  }))
}));

// Mock all fs functions
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock user service
jest.mock('../services/userService', () => ({
  getUserById: jest.fn().mockResolvedValue({
    id: '123',
    preferences: {
      dietaryRestrictions: ['vegetarian'],
      cuisinePreferences: ['italian', 'mexican']
    }
  })
}));

const path = require('path');
const TEST_DATA_DIR = path.join(__dirname, '../data');

// Setup test environment
beforeAll(() => {
  const testFiles = {
    'inventory.json': '[]',
    'recipes.json': '[]',
    'users.json': '[]',
    'mealPlans.json': '[]'
  };

  const fs = require('fs');
  
  fs.readFileSync.mockImplementation((filePath) => {
    const fileName = path.basename(filePath);
    return testFiles[fileName] || '[]';
  });

  fs.writeFileSync.mockImplementation((filePath, data) => {
    const fileName = path.basename(filePath);
    testFiles[fileName] = data;
  });
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

global.TEST_DATA_DIR = TEST_DATA_DIR;

// Add this at the top with other mocks
jest.mock('mongoose', () => {
  const mockSchema = {
    pre: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    virtual: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    methods: {},
    statics: {}
  };

  class MockModel {
    constructor(data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(this);
    }
    static find = jest.fn().mockReturnThis();
    static findOne = jest.fn().mockReturnThis();
    static deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  }

  function Schema() {
    return mockSchema;
  }
  Schema.Types = {
    ObjectId: String
  };

  return {
    Schema,
    model: jest.fn().mockReturnValue(MockModel),
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      close: jest.fn(),
      db: {
        collections: jest.fn().mockResolvedValue([{ deleteMany: jest.fn() }]),
        collection: jest.fn()
      }
    }
  };
});

// Update MongoDB mock
jest.mock('mongodb', () => {
  const mockCollection = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    insertOne: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    exec: jest.fn()
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  };

  return {
    ObjectId: jest.fn(id => id),
    MongoClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      db: jest.fn().mockReturnValue(mockDb)
    }))
  };
});

// Add this with other mocks
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  writeJson: jest.fn().mockResolvedValue(),
  remove: jest.fn().mockResolvedValue(),
  readJson: jest.fn().mockResolvedValue({}),
  ...require('fs')  // Include regular fs functions
}));

// Add this near the top with other mocks
jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(null),
    getUri: jest.fn().mockResolvedValue('mongodb://localhost:27017/test'),
    stop: jest.fn().mockResolvedValue(null)
  }))
}));

// Also add this mock for fs-extra and its dependencies
jest.mock('new-find-package-json', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    next: jest.fn().mockReturnValue({ value: { binary: { version: '4.0.0' } } })
  }))
}));
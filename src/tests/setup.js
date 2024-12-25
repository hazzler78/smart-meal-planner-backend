import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Close any existing connections
  await mongoose.disconnect();

  // Create a new MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);

  // Set test environment variables
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
  // Clean up after tests
  await mongoose.disconnect();
  await mongoServer.stop();

  // Reset environment variables
  delete process.env.JWT_SECRET;
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}); 
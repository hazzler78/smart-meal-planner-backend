module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup.js'],
  testTimeout: 30000, // Increased timeout for integration tests
  verbose: true,
  forceExit: true, // Force Jest to exit after all tests complete
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}; 
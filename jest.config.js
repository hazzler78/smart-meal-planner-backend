module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'],
  collectCoverageFrom: [
    'src/services/*.js',
    'src/routes/*.js',
    'src/middleware/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  coverageReporters: ['text', 'lcov'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}; 
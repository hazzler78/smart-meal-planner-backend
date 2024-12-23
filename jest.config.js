module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb|mongodb-memory-server|mongoose)/)'
  ],
  transform: {
    '^.+\\.ts?$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [151001]
      }
    }]
  },
  moduleNameMapper: {
    '^mongoose$': '<rootDir>/node_modules/mongoose'
  }
}; 
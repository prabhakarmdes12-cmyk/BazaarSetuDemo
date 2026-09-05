/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test/setupEnv.js'],
  globalSetup: '<rootDir>/src/test/globalSetup.js',
  globalTeardown: '<rootDir>/src/test/globalTeardown.js',
  testTimeout: 30000,
};

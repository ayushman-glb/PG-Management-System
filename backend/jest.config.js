module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

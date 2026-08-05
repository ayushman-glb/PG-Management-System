module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|jwks-rsa|firebase-admin)/)',
  ],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

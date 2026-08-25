module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts', '**/src/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|jwks-rsa|puppeteer|puppeteer-core|@puppeteer|@sparticuz|chromium-bidi)/)',
  ],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

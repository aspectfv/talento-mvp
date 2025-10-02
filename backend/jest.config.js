export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  // handle es module imports in tests without adding .js extension
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
}

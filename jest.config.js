/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    // Security-critical modules require higher coverage
    './src/utils/validation.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/wordpress/WpCliManager.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/node/GitManager.ts': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@getflywheel/local/main$': '<rootDir>/tests/__mocks__/local-main.ts',
    '^@getflywheel/local$': '<rootDir>/tests/__mocks__/local.ts',
    '^electron$': '<rootDir>/tests/__mocks__/electron.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000
};

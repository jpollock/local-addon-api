/**
 * Jest test setup file
 * Configures test environment and resets mocks between tests
 */

import { resetElectronMocks } from './__mocks__/electron';
import { resetAllMocks } from './__mocks__/local-main';

// Reset all mocks before each test
beforeEach(() => {
  resetAllMocks();
  resetElectronMocks();
});

// Restore all mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Set test timeout (10 seconds for async operations)
jest.setTimeout(10000);

// Suppress console output during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

/**
 * Mock factory utilities for tests
 * Provides helper functions to create mock objects
 */

import { Site, createMockSite } from '../__mocks__/local';
import { mockServices } from '../__mocks__/local-main';
import type { NodeApp, WordPressPlugin } from '../../src/types';

/**
 * Create a mock Site with optional overrides
 */
export { createMockSite };

/**
 * Create mock LocalServices for ServiceContainer
 */
export const createMockServiceContainer = () => ({
  cradle: { ...mockServices }
});

/**
 * Create a mock NodeApp
 */
export const createMockNodeApp = (overrides: Partial<NodeApp> = {}): NodeApp => ({
  id: 'test-app-id',
  name: 'Test App',
  path: '/Users/test/Local Sites/test-site/app/public/app',
  status: 'stopped',
  command: 'npm start',
  installCommand: 'npm install',
  env: {},
  autoStart: false,
  createdAt: new Date(),
  ...overrides
});

/**
 * Create a mock WordPressPlugin
 */
export const createMockWordPressPlugin = (overrides: Partial<WordPressPlugin> = {}): WordPressPlugin => ({
  id: 'test-plugin-id',
  name: 'Test Plugin',
  slug: 'test-plugin',
  source: 'bundled',
  status: 'installed',
  installedPath: '/Users/test/Local Sites/test-site/app/public/wp-content/plugins/test-plugin',
  autoActivate: false,
  createdAt: new Date(),
  ...overrides
});

/**
 * Create a mock WP-CLI run result
 */
export const createMockWpCliResult = (overrides: { stdout?: string; stderr?: string } = {}) => ({
  stdout: '',
  stderr: '',
  ...overrides
});

/**
 * Create mock IPC request/response
 */
export const createMockIpcRequest = <T>(data: T) => ({
  ...data
});

export const createMockIpcResponse = <T>(success: boolean, data?: T, error?: string) => ({
  success,
  ...(data && { data }),
  ...(error && { error })
});

export default {
  createMockSite,
  createMockServiceContainer,
  createMockNodeApp,
  createMockWordPressPlugin,
  createMockWpCliResult,
  createMockIpcRequest,
  createMockIpcResponse
};

/**
 * Node.js orchestration module
 *
 * Provides APIs for managing Node.js applications within Local sites:
 * - GitManager - Git repository operations
 * - NpmManager - npm/yarn/pnpm detection and execution
 * - ConfigManager - Configuration persistence
 */

export { GitManager } from './GitManager';
export type {
  GitCloneOptions,
  GitProgressEvent,
  GitCloneResult,
} from './GitManager';

export { NpmManager } from './NpmManager';
export type {
  NpmType,
  NpmInfo,
  NpmOptions,
} from './NpmManager';

export { ConfigManager } from './ConfigManager';
export type {
  ConfigManagerOptions,
} from './ConfigManager';

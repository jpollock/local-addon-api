/**
 * Utility module exports
 */

// Constants
export {
  TIMEOUTS,
  LIMITS,
  DEFAULTS,
  ENV_VARS,
  WP_ENV_VARS,
  ALLOWED_PARENT_ENV,
  PATHS,
  PACKAGE_MANAGER_LOCKFILES,
} from './constants';

// Error utilities
export {
  getErrorMessage,
  getErrorStack,
  isError,
} from './errorUtils';

// Safe environment
export { getSafeEnv } from './safeEnv';

// Timeout utilities
export { withTimeout } from './timeout';

// Logger
export {
  initializeLogger,
  getLogger,
  createLogger,
  logger,
} from './logger';

// Validation
export {
  validateCommand,
  validateStartCommand,
  validateInstallCommand,
  validateBuildCommand,
  validateAppId,
  validatePath,
  validateAppPath,
  isValidPluginSlug,
  isValidGitUrl,
  isValidBranchName,
} from './validation';

export type {
  CommandValidationResult,
  PathValidationResult,
} from './validation';

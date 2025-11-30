/**
 * @local-labs/local-addon-api
 *
 * Comprehensive addon development toolkit for Local by Flywheel.
 * Provides APIs for Node.js app orchestration, WordPress plugin management,
 * site lifecycle management, and shared utilities.
 */

// ========================================
// Core Module
// ========================================
export {
  // Service container
  ServiceContainer,
  getServices,
  // Lifecycle management
  LifecycleManager,
  onSiteStarted,
  onSiteStopped,
  onSiteAdded,
  onSiteDeleted,
  // IPC management
  IpcManager,
  createIpcHandler,
  createSimpleIpcHandler,
  removeIpcHandler,
} from './core';

export type {
  HookCallback,
  AddonMainContext,
  IpcHandler,
  RequestValidator,
} from './core';

// ========================================
// Site Management Module
// ========================================
export {
  SiteManager,
  siteManager,
  DatabaseManager,
  PortManager,
  portManager,
} from './site';

// ========================================
// Utilities Module
// ========================================
export {
  // Constants
  TIMEOUTS,
  LIMITS,
  DEFAULTS,
  ENV_VARS,
  WP_ENV_VARS,
  ALLOWED_PARENT_ENV,
  PATHS,
  PACKAGE_MANAGER_LOCKFILES,
  // Error utilities
  getErrorMessage,
  getErrorStack,
  isError,
  // Safe environment
  getSafeEnv,
  // Timeout utilities
  withTimeout,
  // Logger
  initializeLogger,
  getLogger,
  createLogger,
  logger,
  // Validation
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
} from './utils';

export type {
  CommandValidationResult,
  PathValidationResult,
} from './utils';

// ========================================
// Types Module
// ========================================
export type {
  // Local service types
  LocalLogger,
  LocalSiteData,
  LocalSiteProcessManager,
  LocalSiteDatabase,
  LocalPorts,
  LocalWpCli,
  LocalServices,
  WpCliRunResult,
  SiteStatus,
  // Result pattern
  SuccessResult,
  ErrorResult,
  Result,
  AsyncResult,
  // Node app types
  NodeApp,
  NodeAppStatus,
  NodeAppConfig,
  HealthCheckConfig,
  SiteNodeApps,
  GitConfig,
  ProcessInfo,
  // WordPress types
  WordPressEnv,
  WordPressPlugin,
  PluginSource,
  SiteWordPressPlugins,
  PluginConfigInput,
  // IPC types
  AddAppRequest,
  AddAppResponse,
  RemoveAppRequest,
  StartAppRequest,
  StopAppRequest,
  GetAppsRequest,
  GetAppsResponse,
  GetLogsRequest,
  GetLogsResponse,
  UpdateEnvRequest,
  UpdateEnvResponse,
  NodeAppEvent,
  NodeAppLogEvent,
  InstallPluginRequest,
  InstallPluginResponse,
  ActivatePluginRequest,
  DeactivatePluginRequest,
  RemovePluginRequest,
  GetPluginsRequest,
  GetPluginsResponse,
  IpcResponse,
  // Renderer types
  LocalHooks,
  LocalSiteProps,
  LocalElectron,
  RendererContext,
} from './types';

// Result helpers
export { ok, err } from './types';

// ========================================
// Node Orchestration Module
// ========================================
export {
  GitManager,
  NpmManager,
  ConfigManager,
} from './node';

export type {
  GitCloneOptions,
  GitProgressEvent,
  GitCloneResult,
  NpmType,
  NpmInfo,
  NpmOptions,
  ConfigManagerOptions,
} from './node';

// ========================================
// WordPress Module
// ========================================
export {
  WordPressPluginManager,
  WpCliManager,
  WordPressEnvManager,
  ZipPluginInstaller,
  BundledPluginDetector,
} from './wordpress';

export type {
  PluginInstallProgress,
  WpCliResult,
  PluginInfo,
  ZipDownloadProgress,
  ZipInstallResult,
  DetectionResult,
} from './wordpress';

// ========================================
// Schemas Module
// ========================================
export {
  PluginConfigSchema,
  NodeOrchestratorConfigSchema,
} from './schemas';

export type {
  PluginConfig,
  BundledPluginConfig,
  GitPluginConfig,
  ZipPluginConfig,
  WpOrgPluginConfig,
  NodeConfig,
  WordPressConfig,
  NodeOrchestratorConfig,
} from './schemas';

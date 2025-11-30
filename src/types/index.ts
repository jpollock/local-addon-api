/**
 * Types module exports
 */

// Local service container types
export type {
  LocalLogger,
  LocalSiteData,
  LocalSiteProcessManager,
  LocalSiteDatabase,
  LocalPorts,
  LocalWpCli,
  LocalServices,
  WpCliRunResult,
  SiteStatus,
} from './local-services';

// Result pattern types
export type {
  SuccessResult,
  ErrorResult,
  Result,
  AsyncResult,
} from './result';
export { ok, err } from './result';

// Node app types
export type {
  NodeApp,
  NodeAppStatus,
  NodeAppConfig,
  HealthCheckConfig,
  SiteNodeApps,
  GitConfig,
  ProcessInfo,
} from './node-app';

// WordPress types
export type {
  WordPressEnv,
  WordPressPlugin,
  PluginSource,
  SiteWordPressPlugins,
  PluginConfigInput,
  BundledPluginConfig,
  GitPluginConfig,
  ZipPluginConfig,
  WpOrgPluginConfig,
} from './wordpress';

// IPC types
export type {
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
} from './ipc';

// Renderer types
export type {
  LocalHooks,
  LocalSiteProps,
  LocalElectron,
  RendererContext,
} from './renderer';

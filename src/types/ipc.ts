/**
 * IPC (Inter-Process Communication) type definitions
 */

import type { NodeApp } from './node-app';
import type { WordPressPlugin } from './wordpress';

// ========================================
// Node App IPC Types
// ========================================

export interface AddAppRequest {
  siteId: string;
  app: Partial<NodeApp> & {
    gitUrl: string;
    name: string;
  };
}

export interface AddAppResponse {
  success: boolean;
  app?: NodeApp;
  error?: string;
}

export interface RemoveAppRequest {
  siteId: string;
  appId: string;
}

export interface StartAppRequest {
  siteId: string;
  appId: string;
}

export interface StopAppRequest {
  siteId: string;
  appId: string;
}

export interface GetAppsRequest {
  siteId: string;
}

export interface GetAppsResponse {
  success: boolean;
  apps?: NodeApp[];
  error?: string;
}

export interface GetLogsRequest {
  siteId: string;
  appId: string;
  lines?: number;
}

export interface GetLogsResponse {
  success: boolean;
  logs?: string[];
  error?: string;
}

export interface UpdateEnvRequest {
  siteId: string;
  appId: string;
  env: Record<string, string>;
}

export interface UpdateEnvResponse {
  success: boolean;
  error?: string;
}

// ========================================
// Node App Events
// ========================================

export interface NodeAppEvent {
  siteId: string;
  appId: string;
  app: NodeApp;
  timestamp: Date;
}

export interface NodeAppLogEvent {
  siteId: string;
  appId: string;
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: Date;
}

// ========================================
// WordPress Plugin IPC Types
// ========================================

export interface InstallPluginRequest {
  siteId: string;
  plugin: {
    name: string;
    gitUrl: string;
    branch: string;
    slug: string;
    autoActivate?: boolean;
  };
}

export interface InstallPluginResponse {
  success: boolean;
  plugin?: WordPressPlugin;
  error?: string;
}

export interface ActivatePluginRequest {
  siteId: string;
  pluginId: string;
}

export interface DeactivatePluginRequest {
  siteId: string;
  pluginId: string;
}

export interface RemovePluginRequest {
  siteId: string;
  pluginId: string;
}

export interface GetPluginsRequest {
  siteId: string;
}

export interface GetPluginsResponse {
  success: boolean;
  plugins?: WordPressPlugin[];
  error?: string;
}

// ========================================
// Generic IPC Response Type
// ========================================

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

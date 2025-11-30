/**
 * Type definitions for Local's service container
 */

import type * as Local from '@getflywheel/local';

/**
 * Local's logger service interface
 */
export interface LocalLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  log(level: string, message: string, context?: Record<string, unknown>): void;
}

/**
 * Local's site data service interface
 */
export interface LocalSiteData {
  getSite(siteId: string): Local.Site | undefined;
  getSites(): Local.Site[];
}

/**
 * Site status type
 */
export type SiteStatus = 'running' | 'stopped' | 'starting' | 'stopping';

/**
 * Local's site process manager service interface
 */
export interface LocalSiteProcessManager {
  getSiteStatus(site: Local.Site): SiteStatus;
  start(site: Local.Site): Promise<void>;
  stop(site: Local.Site, options?: { dumpDatabase?: boolean }): Promise<void>;
}

/**
 * Local's site database service interface
 */
export interface LocalSiteDatabase {
  waitForDB(site: Local.Site): Promise<boolean>;
  runQuery?(site: Local.Site, query: string): Promise<string>;
}

/**
 * Local's ports service interface
 */
export interface LocalPorts {
  getAvailablePort(): Promise<number>;
}

/**
 * WP-CLI execution result
 */
export interface WpCliRunResult {
  stdout: string;
  stderr: string;
}

/**
 * Local's WP-CLI service interface
 */
export interface LocalWpCli {
  run(site: Local.Site, args: string[]): Promise<WpCliRunResult>;
}

/**
 * Aggregate interface for all Local services we depend on
 */
export interface LocalServices {
  localLogger: LocalLogger;
  siteData: LocalSiteData;
  siteProcessManager: LocalSiteProcessManager;
  siteDatabase: LocalSiteDatabase;
  ports: LocalPorts;
  wpCli: LocalWpCli;
}

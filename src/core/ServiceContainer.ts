/**
 * ServiceContainer - Typed wrapper around Local's service container
 *
 * Provides type-safe access to Local's services with lazy initialization.
 */

import type {
  LocalServices,
  LocalLogger,
  LocalSiteData,
  LocalSiteProcessManager,
  LocalSiteDatabase,
  LocalPorts,
  LocalWpCli,
} from '../types';

/**
 * Get the raw services from Local's service container
 * @returns Local services object
 * @throws Error if called before Local is initialized
 */
export function getServices(): LocalServices {
  // Dynamic import to avoid issues when Local isn't available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const LocalMain = require('@getflywheel/local/main');
  return LocalMain.getServiceContainer().cradle as LocalServices;
}

/**
 * ServiceContainer - Singleton wrapper for Local's service container
 *
 * Provides typed, cached access to Local's services.
 * Services are retrieved lazily to ensure Local is initialized.
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.getInstance();
 * const site = container.siteData.getSite(siteId);
 * container.logger.info('Site found', { siteId });
 * ```
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private _services: LocalServices | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Get all services (lazy initialization)
   */
  private get services(): LocalServices {
    if (!this._services) {
      this._services = getServices();
    }
    return this._services;
  }

  /**
   * Get the logger service
   */
  get logger(): LocalLogger {
    return this.services.localLogger;
  }

  /**
   * Get the site data service
   */
  get siteData(): LocalSiteData {
    return this.services.siteData;
  }

  /**
   * Get the site process manager service
   */
  get processManager(): LocalSiteProcessManager {
    return this.services.siteProcessManager;
  }

  /**
   * Get the site database service
   */
  get database(): LocalSiteDatabase {
    return this.services.siteDatabase;
  }

  /**
   * Get the ports service
   */
  get ports(): LocalPorts {
    return this.services.ports;
  }

  /**
   * Get the WP-CLI service
   */
  get wpCli(): LocalWpCli {
    return this.services.wpCli;
  }

  /**
   * Reset the cached services (useful for testing)
   */
  reset(): void {
    this._services = null;
  }
}

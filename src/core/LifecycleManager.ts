/**
 * LifecycleManager - Safe lifecycle hook registration for Local addons
 *
 * Provides a unified API for registering site lifecycle hooks with
 * automatic error handling and support for both hook actions and IPC events.
 */

import type * as Local from '@getflywheel/local';
import { getServices } from './ServiceContainer';

/**
 * Callback type for lifecycle hooks
 */
export type HookCallback<T = Local.Site> = (site: T) => void | Promise<void>;

/**
 * Local addon context type (from @getflywheel/local/main)
 */
export interface AddonMainContext {
  hooks: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    addAction(hookName: string, callback: (...args: any[]) => void | Promise<void>): void;
    addFilter?(filterName: string, callback: (value: any) => any): void;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };
  electron: {
    ipcMain: {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      handle(channel: string, handler: (...args: any[]) => any): void;
      on(channel: string, handler: (...args: any[]) => void): void;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    };
  };
}

/**
 * LifecycleManager - Manages site lifecycle hook registration
 *
 * Provides safe registration of lifecycle hooks with:
 * - Automatic error handling to prevent addon crashes
 * - Support for async callbacks
 * - Unified siteAdded handling (hooks + IPC events)
 *
 * @example
 * ```typescript
 * export default function (context: AddonMainContext): void {
 *   const lifecycle = new LifecycleManager(context);
 *
 *   lifecycle.onSiteStarted(async (site) => {
 *     console.log('Site started:', site.name);
 *   });
 *
 *   lifecycle.onSiteAdded(async (site) => {
 *     console.log('Site added:', site.name);
 *   });
 * }
 * ```
 */
export class LifecycleManager {
  private context: AddonMainContext;

  constructor(context: AddonMainContext) {
    this.context = context;
  }

  /**
   * Register a callback for when a site starts
   */
  onSiteStarted(callback: HookCallback): void {
    this.context.hooks.addAction('siteStarted', this.wrapHandler(callback));
  }

  /**
   * Register a callback for when a site stops
   */
  onSiteStopped(callback: HookCallback): void {
    this.context.hooks.addAction('siteStopped', this.wrapHandler(callback));
  }

  /**
   * Register a callback for when a site is stopping
   */
  onSiteStopping(callback: HookCallback): void {
    this.context.hooks.addAction('siteStopping', this.wrapHandler(callback));
  }

  /**
   * Register a callback for when a site is added
   *
   * Note: This registers both the hook action AND the IPC event listener
   * to ensure coverage of all site creation flows (including imports/blueprints
   * which only emit IPC events, not hook actions).
   */
  onSiteAdded(callback: HookCallback): void {
    // Register hook action (covers normal site creation)
    this.context.hooks.addAction('siteAdded', this.wrapHandler(callback));

    // Also listen for IPC event (covers imports and blueprints)
    // Note: IPC events pass serialized site data, not the full Site object
    this.context.electron.ipcMain.on('siteAdded', (_event: unknown, siteData: { id: string }) => {
      try {
        const { siteData: siteService } = getServices();
        const site = siteService.getSite(siteData.id);
        if (site) {
          // Wrap in async handler for error handling
          Promise.resolve(callback(site)).catch((error) => {
            this.logError('siteAdded IPC handler', error);
          });
        }
      } catch (error) {
        this.logError('siteAdded IPC handler', error);
      }
    });
  }

  /**
   * Register a callback for when a site is deleted
   */
  onSiteDeleted(callback: HookCallback): void {
    this.context.hooks.addAction('siteDeleted', this.wrapHandler(callback));
  }

  /**
   * Register a callback for when a site is being deleted
   */
  onSiteDeleting(callback: HookCallback): void {
    this.context.hooks.addAction('siteDeleting', this.wrapHandler(callback));
  }

  /**
   * Register a callback for when a site is updated
   */
  onSiteUpdated(callback: HookCallback): void {
    this.context.hooks.addAction('siteUpdated', this.wrapHandler(callback));
  }

  /**
   * Wrap a callback with error handling
   */
  private wrapHandler<T>(callback: HookCallback<T>): HookCallback<T> {
    return async (site: T) => {
      try {
        await callback(site);
      } catch (error) {
        this.logError('lifecycle hook', error);
      }
    };
  }

  /**
   * Log an error safely
   */
  private logError(context: string, error: unknown): void {
    try {
      const { localLogger } = getServices();
      localLogger.error(`[LifecycleManager] Error in ${context}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } catch {
      // Fallback to console if logger unavailable
      console.error(`[LifecycleManager] Error in ${context}:`, error);
    }
  }
}

// ========================================
// Convenience Functions
// ========================================

/**
 * Register a site started callback
 */
export function onSiteStarted(context: AddonMainContext, callback: HookCallback): void {
  new LifecycleManager(context).onSiteStarted(callback);
}

/**
 * Register a site stopped callback
 */
export function onSiteStopped(context: AddonMainContext, callback: HookCallback): void {
  new LifecycleManager(context).onSiteStopped(callback);
}

/**
 * Register a site added callback
 */
export function onSiteAdded(context: AddonMainContext, callback: HookCallback): void {
  new LifecycleManager(context).onSiteAdded(callback);
}

/**
 * Register a site deleted callback
 */
export function onSiteDeleted(context: AddonMainContext, callback: HookCallback): void {
  new LifecycleManager(context).onSiteDeleted(callback);
}

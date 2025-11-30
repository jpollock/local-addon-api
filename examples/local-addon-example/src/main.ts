/**
 * Example Local Addon - Main Process
 *
 * Demonstrates usage of @local-labs/local-addon-api for building Local addons.
 * This file runs in the main (Node.js) process.
 */

import * as path from 'path';
import type * as Local from '@getflywheel/local';
import {
  // Core module
  LifecycleManager,
  IpcManager,
  getServices,

  // Site module
  SiteManager,
  DatabaseManager,
  PortManager,

  // WordPress module
  WordPressPluginManager,
  WpCliManager,
  BundledPluginDetector,
  WordPressEnvManager,

  // Node module
  GitManager,
  ConfigManager,

  // Utils
  isValidPluginSlug,
  logger,
  ok,
  err,

  // Types
  type Result,
  type AddonMainContext,
} from '@local-labs/local-addon-api';

// ============================================================================
// Addon State
// ============================================================================

interface AddonState {
  lifecycle: LifecycleManager;
  ipc: IpcManager;
  siteManager: SiteManager;
  portManager: PortManager;
  configManager: ConfigManager;
  gitManager: GitManager;
  wpCliManager: WpCliManager;
  pluginManager: WordPressPluginManager;
  trackedSites: Map<string, { port?: number }>;
}

let state: AddonState | null = null;

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main addon entry point - called by Local when addon loads
 */
export default function (context: AddonMainContext): void {
  console.log('[ExampleAddon] Initializing...');

  // Get Local's services
  const services = getServices();

  // Initialize managers
  const siteManager = new SiteManager();
  const portManager = new PortManager();
  const configManager = new ConfigManager();
  const gitManager = new GitManager();
  const wpCliManager = new WpCliManager(services.wpCli);
  const pluginManager = new WordPressPluginManager(gitManager, wpCliManager);

  // Initialize lifecycle and IPC managers
  const lifecycle = new LifecycleManager(context);
  const ipc = new IpcManager(context.electron.ipcMain);

  // Store state
  state = {
    lifecycle,
    ipc,
    siteManager,
    portManager,
    configManager,
    gitManager,
    wpCliManager,
    pluginManager,
    trackedSites: new Map(),
  };

  // Register lifecycle hooks
  registerLifecycleHooks(lifecycle, state);

  // Register IPC handlers
  registerIpcHandlers(ipc, state);

  console.log('[ExampleAddon] Initialized successfully');
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

function registerLifecycleHooks(lifecycle: LifecycleManager, state: AddonState): void {
  // Handle site start
  lifecycle.onSiteStarted(async (site: Local.Site) => {
    console.log(`[ExampleAddon] Site started: ${site.name}`);

    try {
      // Example: Extract WordPress environment variables
      const wpEnv = WordPressEnvManager.extractWordPressEnv(site);
      console.log('[ExampleAddon] WordPress env:', WordPressEnvManager.sanitizeForLogging(wpEnv));

      // Example: Check if site has Node apps configured
      const hasApps = await state.configManager.hasApps(site.id, site.path);
      if (hasApps) {
        console.log('[ExampleAddon] Site has Node apps configured');
      }

      // Track the site
      state.trackedSites.set(site.id, {});

    } catch (error) {
      console.error('[ExampleAddon] Error handling site start:', error);
    }
  });

  // Handle site stop
  lifecycle.onSiteStopped(async (site: Local.Site) => {
    console.log(`[ExampleAddon] Site stopped: ${site.name}`);

    // Clean up tracked site
    const tracked = state.trackedSites.get(site.id);
    if (tracked?.port) {
      state.portManager.releasePort(tracked.port);
    }
    state.trackedSites.delete(site.id);
  });

  // Handle site added
  lifecycle.onSiteAdded(async (site: Local.Site) => {
    console.log(`[ExampleAddon] Site added: ${site.name}`);

    // Example: Detect bundled plugins in a Node app repository
    // This would be used when the site has a Node app with bundled WP plugins
  });

  // Handle site deleted
  lifecycle.onSiteDeleted(async (site: Local.Site) => {
    console.log(`[ExampleAddon] Site deleted: ${site.name}`);

    // Clear any cached config
    state.configManager.clearCache(site.id);
  });
}

// ============================================================================
// IPC Handlers
// ============================================================================

interface GetSiteInfoRequest {
  siteId: string;
}

interface InstallPluginRequest {
  siteId: string;
  pluginSlug: string;
  source: 'wporg' | 'git' | 'bundled';
  url?: string;
  path?: string;
}

interface RunWpCliRequest {
  siteId: string;
  command: string;
}

function registerIpcHandlers(ipc: IpcManager, state: AddonState): void {
  // Get site information
  ipc.handle<GetSiteInfoRequest, any>(
    'example-addon:get-site-info',
    async (request) => {
      const site = state.siteManager.getSite(request.siteId);
      if (!site) {
        return err('Site not found');
      }

      const isRunning = state.siteManager.isRunning(site);
      const pluginsPath = state.siteManager.getPluginsPath(site);
      const siteUrl = state.siteManager.getUrl(site);

      return ok({
        id: site.id,
        name: site.name,
        isRunning,
        pluginsPath,
        siteUrl,
      });
    },
    // Request validator
    (req: unknown): GetSiteInfoRequest | null => {
      if (typeof req === 'object' && req !== null && 'siteId' in req) {
        return req as GetSiteInfoRequest;
      }
      return null;
    }
  );

  // Install a WordPress plugin
  ipc.handle<InstallPluginRequest, any>(
    'example-addon:install-plugin',
    async (request) => {
      // Validate plugin slug
      if (!isValidPluginSlug(request.pluginSlug)) {
        return err('Invalid plugin slug');
      }

      const site = state.siteManager.getSite(request.siteId);
      if (!site) {
        return err('Site not found');
      }

      if (!state.siteManager.isRunning(site)) {
        return err('Site must be running to install plugins');
      }

      try {
        let config: any;

        switch (request.source) {
          case 'wporg':
            config = { source: 'wporg', slug: request.pluginSlug };
            break;
          case 'git':
            if (!request.url) {
              return err('Git URL required');
            }
            config = { source: 'git', slug: request.pluginSlug, url: request.url };
            break;
          case 'bundled':
            if (!request.path) {
              return err('Bundled path required');
            }
            config = { source: 'bundled', slug: request.pluginSlug, path: request.path };
            break;
          default:
            return err('Invalid source');
        }

        const plugin = await state.pluginManager.installPlugin(site, config);

        return ok({
          id: plugin.id,
          slug: plugin.slug,
          status: plugin.status,
          version: plugin.version,
        });

      } catch (error: any) {
        return err(error.message || 'Failed to install plugin');
      }
    }
  );

  // Run WP-CLI command
  // Note: WpCliManager has built-in security validation for WP-CLI commands
  // It only allows whitelisted commands (plugin, option, user, post, db, cache, rewrite, theme)
  ipc.handle<RunWpCliRequest, any>(
    'example-addon:run-wp-cli',
    async (request) => {
      const site = state.siteManager.getSite(request.siteId);
      if (!site) {
        return err('Site not found');
      }

      if (!state.siteManager.isRunning(site)) {
        return err('Site must be running');
      }

      // WpCliManager.runCommand handles validation internally
      const result = await state.wpCliManager.runCommand(site, request.command);
      if (result.success) {
        return ok({ output: result.output });
      } else {
        return err(result.error || 'Command failed');
      }
    }
  );

  // Get allocated port for an app
  ipc.handleSimple<{ siteId: string }, { port: number }>(
    'example-addon:get-port',
    async (request) => {
      let tracked = state.trackedSites.get(request.siteId);
      if (!tracked) {
        tracked = {};
        state.trackedSites.set(request.siteId, tracked);
      }

      if (!tracked.port) {
        tracked.port = await state.portManager.getAvailablePort();
      }

      return { port: tracked.port };
    }
  );

  // List all plugins for a site
  ipc.handleSimple<{ siteId: string }, any>(
    'example-addon:list-plugins',
    async (request) => {
      const site = state.siteManager.getSite(request.siteId);
      if (!site) {
        throw new Error('Site not found');
      }

      const plugins = await state.pluginManager.listPlugins(site);
      return { plugins };
    }
  );
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Called when addon is unloaded
 */
export function deactivate(): void {
  console.log('[ExampleAddon] Deactivating...');

  if (state) {
    // Remove all IPC handlers
    state.ipc.removeAll();

    // Clear port allocations
    state.portManager.clearAllocations();

    // Clear config caches
    state.configManager.clearAllCaches();

    state = null;
  }

  console.log('[ExampleAddon] Deactivated');
}

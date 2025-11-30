/**
 * Tests for ConfigManager module
 */

import { ConfigManager } from '../../../src/node/ConfigManager';
import * as fs from 'fs-extra';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    config: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

describe('ConfigManager', () => {
  let manager: ConfigManager;
  const testSiteId = 'test-site-123';
  const testSitePath = '/Users/test/sites/mysite';

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ConfigManager({ configPath: '/test/config' });
  });

  describe('loadApps', () => {
    it('should return empty array when config file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const apps = await manager.loadApps(testSiteId, testSitePath);

      expect(apps).toEqual([]);
    });

    it('should load apps from config file', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [
          { id: 'app1', name: 'App 1', path: '/app1' },
          { id: 'app2', name: 'App 2', path: '/app2' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const apps = await manager.loadApps(testSiteId, testSitePath);

      expect(apps).toHaveLength(2);
      expect(apps[0].id).toBe('app1');
      expect(apps[1].id).toBe('app2');
    });

    it('should return empty array on invalid config structure', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ invalid: 'structure' });

      const apps = await manager.loadApps(testSiteId, testSitePath);

      expect(apps).toEqual([]);
    });

    it('should return empty array on read error', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockRejectedValue(new Error('Read error'));

      const apps = await manager.loadApps(testSiteId, testSitePath);

      expect(apps).toEqual([]);
    });

    it('should cache loaded config', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1', path: '/app1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      await manager.loadApps(testSiteId, testSitePath);
      jest.clearAllMocks();

      // Second load should use cache
      await manager.loadApps(testSiteId, testSitePath);

      expect(mockFs.readJson).not.toHaveBeenCalled();
    });
  });

  describe('saveApps', () => {
    it('should save apps to config file', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      const apps = [{ id: 'app1', name: 'App 1', path: '/app1' }];
      await manager.saveApps(testSiteId, testSitePath, apps as any);

      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, apps },
        { spaces: 2 }
      );
    });

    it('should throw error on write failure', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockRejectedValue(new Error('Write error'));

      await expect(
        manager.saveApps(testSiteId, testSitePath, [])
      ).rejects.toThrow('Failed to save config');
    });

    it('should update cache after save', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      const apps = [{ id: 'app1', name: 'App 1', path: '/app1' }];
      await manager.saveApps(testSiteId, testSitePath, apps as any);

      // Clear readJson calls
      jest.clearAllMocks();

      // Load should use cache
      const loaded = await manager.loadApps(testSiteId, testSitePath);

      expect(mockFs.readJson).not.toHaveBeenCalled();
      expect(loaded).toEqual(apps);
    });
  });

  describe('getApp', () => {
    it('should return app when found', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [
          { id: 'app1', name: 'App 1' },
          { id: 'app2', name: 'App 2' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const app = await manager.getApp(testSiteId, testSitePath, 'app2');

      expect(app).toEqual({ id: 'app2', name: 'App 2' });
    });

    it('should return null when app not found', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const app = await manager.getApp(testSiteId, testSitePath, 'nonexistent');

      expect(app).toBeNull();
    });
  });

  describe('saveApp', () => {
    it('should add new app', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      await manager.saveApp(testSiteId, testSitePath, { id: 'app1', name: 'App 1' } as any);

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, apps: [{ id: 'app1', name: 'App 1' }] },
        { spaces: 2 }
      );
    });

    it('should update existing app', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'Old Name' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      await manager.saveApp(testSiteId, testSitePath, { id: 'app1', name: 'New Name' } as any);

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, apps: [{ id: 'app1', name: 'New Name' }] },
        { spaces: 2 }
      );
    });
  });

  describe('removeApp', () => {
    it('should remove app from config', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [
          { id: 'app1', name: 'App 1' },
          { id: 'app2', name: 'App 2' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      await manager.removeApp(testSiteId, testSitePath, 'app1');

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, apps: [{ id: 'app2', name: 'App 2' }] },
        { spaces: 2 }
      );
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific site', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      await manager.loadApps(testSiteId, testSitePath);
      manager.clearCache(testSiteId);

      jest.clearAllMocks();

      // Should reload from file
      await manager.loadApps(testSiteId, testSitePath);
      expect(mockFs.readJson).toHaveBeenCalled();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all cached data', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      await manager.loadApps(testSiteId, testSitePath);
      await manager.loadApps('other-site', testSitePath);

      manager.clearAllCaches();

      expect(manager.getCachedSites()).toEqual([]);
    });
  });

  describe('hasApps', () => {
    it('should return true when site has apps', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      expect(await manager.hasApps(testSiteId, testSitePath)).toBe(true);
    });

    it('should return false when site has no apps', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      expect(await manager.hasApps(testSiteId, testSitePath)).toBe(false);
    });
  });

  describe('getCachedSites', () => {
    it('should return empty array when no sites cached', () => {
      expect(manager.getCachedSites()).toEqual([]);
    });

    it('should return cached site IDs', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      await manager.loadApps(testSiteId, testSitePath);

      expect(manager.getCachedSites()).toContain(testSiteId);
    });
  });

  describe('exportConfig', () => {
    it('should export config as JSON string', async () => {
      const mockConfig = {
        siteId: testSiteId,
        apps: [{ id: 'app1', name: 'App 1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const exported = await manager.exportConfig(testSiteId, testSitePath);
      const parsed = JSON.parse(exported);

      expect(parsed.siteId).toBe(testSiteId);
      expect(parsed.apps).toHaveLength(1);
    });
  });

  describe('importConfig', () => {
    it('should import config from JSON string', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      const configJson = JSON.stringify({
        siteId: 'other-site',
        apps: [{ id: 'imported-app', name: 'Imported' }],
      });

      await manager.importConfig(testSiteId, testSitePath, configJson);

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, apps: [{ id: 'imported-app', name: 'Imported' }] },
        { spaces: 2 }
      );
    });

    it('should throw error for invalid JSON', async () => {
      await expect(
        manager.importConfig(testSiteId, testSitePath, 'invalid json')
      ).rejects.toThrow('Failed to import config');
    });

    it('should throw error for invalid config format', async () => {
      await expect(
        manager.importConfig(testSiteId, testSitePath, '{"invalid": true}')
      ).rejects.toThrow('Failed to import config');
    });
  });

  // WordPress Plugin Configuration Tests
  describe('loadPlugins', () => {
    it('should return empty array when plugin config does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const plugins = await manager.loadPlugins(testSiteId, testSitePath);

      expect(plugins).toEqual([]);
    });

    it('should load plugins from config file', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [
          { id: 'plugin1', slug: 'my-plugin', status: 'active' },
          { id: 'plugin2', slug: 'other-plugin', status: 'installed' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const plugins = await manager.loadPlugins(testSiteId, testSitePath);

      expect(plugins).toHaveLength(2);
      expect(plugins[0].slug).toBe('my-plugin');
    });
  });

  describe('savePlugins', () => {
    it('should save plugins to config file', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      const plugins = [{ id: 'plugin1', slug: 'my-plugin', status: 'active' }];
      await manager.savePlugins(testSiteId, testSitePath, plugins as any);

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('plugins.json'),
        { siteId: testSiteId, plugins },
        { spaces: 2 }
      );
    });
  });

  describe('getPlugin', () => {
    it('should return plugin when found', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [{ id: 'plugin1', slug: 'my-plugin' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const plugin = await manager.getPlugin(testSiteId, testSitePath, 'plugin1');

      expect(plugin?.slug).toBe('my-plugin');
    });

    it('should return null when plugin not found', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const plugin = await manager.getPlugin(testSiteId, testSitePath, 'nonexistent');

      expect(plugin).toBeNull();
    });
  });

  describe('findPluginBySlug', () => {
    it('should find plugin by slug', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [
          { id: 'plugin1', slug: 'first-plugin' },
          { id: 'plugin2', slug: 'second-plugin' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      const plugin = await manager.findPluginBySlug(testSiteId, testSitePath, 'second-plugin');

      expect(plugin?.id).toBe('plugin2');
    });

    it('should return null when slug not found', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const plugin = await manager.findPluginBySlug(testSiteId, testSitePath, 'nonexistent');

      expect(plugin).toBeNull();
    });
  });

  describe('updatePluginStatus', () => {
    it('should update plugin status', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [{ id: 'plugin1', slug: 'my-plugin', status: 'installed' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      await manager.updatePluginStatus(testSiteId, testSitePath, 'plugin1', 'active');

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            expect.objectContaining({ status: 'active' }),
          ]),
        }),
        { spaces: 2 }
      );
    });
  });

  describe('hasPlugins', () => {
    it('should return true when site has plugins', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [{ id: 'plugin1' }],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);

      expect(await manager.hasPlugins(testSiteId, testSitePath)).toBe(true);
    });

    it('should return false when site has no plugins', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      expect(await manager.hasPlugins(testSiteId, testSitePath)).toBe(false);
    });
  });

  describe('removePlugin', () => {
    it('should remove plugin from config', async () => {
      const mockConfig = {
        siteId: testSiteId,
        plugins: [
          { id: 'plugin1', slug: 'first' },
          { id: 'plugin2', slug: 'second' },
        ],
      };
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockConfig);
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.writeJson.mockResolvedValue(undefined);

      await manager.removePlugin(testSiteId, testSitePath, 'plugin1');

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.any(String),
        { siteId: testSiteId, plugins: [{ id: 'plugin2', slug: 'second' }] },
        { spaces: 2 }
      );
    });
  });
});

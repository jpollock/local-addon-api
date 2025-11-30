/**
 * Tests for WordPressPluginManager module
 */

import { WordPressPluginManager } from '../../../src/wordpress/WordPressPluginManager';
import { GitManager } from '../../../src/node/GitManager';
import { WpCliManager } from '../../../src/wordpress/WpCliManager';
import { createMockSite } from '../../helpers/mockFactory';
import * as fs from 'fs-extra';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    wpPlugin: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

describe('WordPressPluginManager', () => {
  let manager: WordPressPluginManager;
  let mockGitManager: jest.Mocked<GitManager>;
  let mockWpCliManager: jest.Mocked<WpCliManager>;
  const mockSite = createMockSite({
    id: 'test-site',
    name: 'Test Site',
    path: '/Users/test/Local Sites/test-site',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockGitManager = {
      cloneRepository: jest.fn(),
    } as any;

    mockWpCliManager = {
      getPluginStatus: jest.fn(),
      activatePlugin: jest.fn(),
      deactivatePlugin: jest.fn(),
      deletePlugin: jest.fn(),
      isPluginInstalled: jest.fn(),
      runCommand: jest.fn(),
      listPlugins: jest.fn(),
    } as any;

    manager = new WordPressPluginManager(mockGitManager, mockWpCliManager);
  });

  describe('installPlugin', () => {
    describe('validation', () => {
      it('should reject invalid plugin slug', async () => {
        await expect(
          manager.installPlugin(mockSite, {
            source: 'wporg',
            slug: 'invalid slug!',
          })
        ).rejects.toThrow('Invalid plugin slug');
      });

      it('should reject slug with path traversal', async () => {
        await expect(
          manager.installPlugin(mockSite, {
            source: 'wporg',
            slug: '../../../etc/passwd',
          })
        ).rejects.toThrow('Invalid plugin slug');
      });

      it('should accept valid plugin slug', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        await expect(
          manager.installPlugin(mockSite, {
            source: 'wporg',
            slug: 'valid-plugin-slug_123',
          })
        ).resolves.toBeDefined();
      });
    });

    describe('existing plugin handling', () => {
      it('should return existing plugin info if already installed and valid', async () => {
        const pluginPath = '/Users/test/Local Sites/test-site/app/public/wp-content/plugins/my-plugin';
        mockFs.pathExists.mockImplementation(async (p: string) => {
          if (p === pluginPath) return true;
          if (p.endsWith('my-plugin.php')) return true;
          return false;
        });
        mockFs.readFile.mockResolvedValue('<?php\n/**\n* Plugin Name: My Plugin\n*/');
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'wporg',
          slug: 'my-plugin',
        });

        expect(result.slug).toBe('my-plugin');
        expect(result.status).toBe('active');
      });
    });

    describe('wporg source', () => {
      it('should install plugin from WordPress.org', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'wporg',
          slug: 'woocommerce',
        });

        expect(result.source).toBe('wporg');
        expect(result.slug).toBe('woocommerce');
        expect(mockWpCliManager.runCommand).toHaveBeenCalledWith(
          mockSite,
          'plugin install woocommerce'
        );
      });

      it('should install specific version from WordPress.org', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '8.0.0' });

        await manager.installPlugin(mockSite, {
          source: 'wporg',
          slug: 'woocommerce',
          version: '8.0.0',
        });

        expect(mockWpCliManager.runCommand).toHaveBeenCalledWith(
          mockSite,
          'plugin install woocommerce --version=8.0.0'
        );
      });

      it('should handle WordPress.org install failure', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({
          success: false,
          error: 'Plugin not found',
        });

        await expect(
          manager.installPlugin(mockSite, {
            source: 'wporg',
            slug: 'nonexistent-plugin',
          })
        ).rejects.toThrow('Plugin not found');
      });
    });

    describe('bundled source', () => {
      it('should install bundled plugin', async () => {
        const sourcePath = '/path/to/bundled/plugin';
        mockFs.pathExists.mockImplementation(async (p: string) => {
          if (p === sourcePath) return true;
          if (p.endsWith('.php')) return true;
          return false;
        });
        mockFs.readFile.mockResolvedValue('<?php\n/**\n* Plugin Name: Bundled Plugin\n*/');
        mockFs.copy.mockResolvedValue(undefined);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'bundled',
          slug: 'bundled-plugin',
          path: sourcePath,
        });

        expect(result.source).toBe('bundled');
        expect(result.bundledPath).toBe(sourcePath);
      });

      it('should fail when bundled path not found', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);

        await expect(
          manager.installPlugin(mockSite, {
            source: 'bundled',
            slug: 'missing-plugin',
            path: '/nonexistent/path',
          })
        ).rejects.toThrow('Bundled plugin path not found');
      });
    });

    describe('git source', () => {
      it('should install plugin from git repository', async () => {
        mockFs.pathExists.mockImplementation(async (p: string) => {
          if (p.includes('.temp')) return true;
          if (p.endsWith('.php')) return true;
          return false;
        });
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockFs.copy.mockResolvedValue(undefined);
        mockFs.remove.mockResolvedValue(undefined);
        mockFs.readFile.mockResolvedValue('<?php\n/**\n* Plugin Name: Git Plugin\n*/');
        mockGitManager.cloneRepository.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'git',
          slug: 'git-plugin',
          url: 'https://github.com/user/repo.git',
          branch: 'main',
        });

        expect(result.source).toBe('git');
        expect(result.gitUrl).toBe('https://github.com/user/repo.git');
        expect(mockGitManager.cloneRepository).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://github.com/user/repo.git',
            branch: 'main',
            requirePackageJson: false,
          })
        );
      });

      it('should handle git clone failure', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockGitManager.cloneRepository.mockResolvedValue({
          success: false,
          error: 'Clone failed',
        });

        await expect(
          manager.installPlugin(mockSite, {
            source: 'git',
            slug: 'git-plugin',
            url: 'https://github.com/user/repo.git',
          })
        ).rejects.toThrow('Clone failed');
      });
    });

    describe('activation', () => {
      it('should activate plugin when autoActivate is true (default)', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'wporg',
          slug: 'test-plugin',
        });

        expect(mockWpCliManager.activatePlugin).toHaveBeenCalledWith(mockSite, 'test-plugin');
        expect(result.status).toBe('active');
      });

      it('should not activate when autoActivate is false', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'inactive', version: '1.0.0' });

        const result = await manager.installPlugin(mockSite, {
          source: 'wporg',
          slug: 'test-plugin',
          autoActivate: false,
        });

        expect(mockWpCliManager.activatePlugin).not.toHaveBeenCalled();
        expect(result.status).toBe('installed');
      });

      it('should skip activation when skipActivation option is true', async () => {
        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'inactive', version: '1.0.0' });

        const result = await manager.installPlugin(
          mockSite,
          { source: 'wporg', slug: 'test-plugin' },
          undefined,
          { skipActivation: true }
        );

        expect(mockWpCliManager.activatePlugin).not.toHaveBeenCalled();
        expect(result.status).toBe('installed');
      });
    });

    describe('tilde expansion', () => {
      it('should expand tilde in site path', async () => {
        const siteWithTilde = createMockSite({
          path: '~/Local Sites/test-site',
        });

        mockFs.pathExists.mockResolvedValue(false);
        mockFs.ensureDir.mockResolvedValue(undefined);
        mockWpCliManager.runCommand.mockResolvedValue({ success: true });
        mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });
        mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0.0' });

        await manager.installPlugin(siteWithTilde, {
          source: 'wporg',
          slug: 'test-plugin',
        });

        // ensureDir should be called with expanded path
        expect(mockFs.ensureDir).toHaveBeenCalledWith(
          expect.stringContaining('Local Sites/test-site/app/public/wp-content/plugins')
        );
      });
    });
  });

  describe('activatePlugin', () => {
    it('should delegate to WpCliManager', async () => {
      mockWpCliManager.activatePlugin.mockResolvedValue({ success: true });

      await manager.activatePlugin(mockSite, 'my-plugin');

      expect(mockWpCliManager.activatePlugin).toHaveBeenCalledWith(mockSite, 'my-plugin');
    });
  });

  describe('deactivatePlugin', () => {
    it('should delegate to WpCliManager', async () => {
      mockWpCliManager.deactivatePlugin.mockResolvedValue({ success: true });

      await manager.deactivatePlugin(mockSite, 'my-plugin');

      expect(mockWpCliManager.deactivatePlugin).toHaveBeenCalledWith(mockSite, 'my-plugin');
    });
  });

  describe('getPluginStatus', () => {
    it('should return active when plugin is active', async () => {
      mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0' });

      const status = await manager.getPluginStatus(mockSite, 'my-plugin');

      expect(status).toBe('active');
    });

    it('should return not-installed when plugin not found', async () => {
      mockWpCliManager.getPluginStatus.mockResolvedValue(null);

      const status = await manager.getPluginStatus(mockSite, 'nonexistent');

      expect(status).toBe('not-installed');
    });
  });

  describe('removePlugin', () => {
    it('should deactivate and delete plugin', async () => {
      mockWpCliManager.isPluginInstalled.mockResolvedValue(true);
      mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'active', version: '1.0' });
      mockWpCliManager.deactivatePlugin.mockResolvedValue({ success: true });
      mockWpCliManager.deletePlugin.mockResolvedValue({ success: true });

      const result = await manager.removePlugin(mockSite, 'my-plugin');

      expect(result.success).toBe(true);
      expect(mockWpCliManager.deactivatePlugin).toHaveBeenCalledWith(mockSite, 'my-plugin');
      expect(mockWpCliManager.deletePlugin).toHaveBeenCalledWith(mockSite, 'my-plugin');
    });

    it('should skip deactivation for inactive plugins', async () => {
      mockWpCliManager.isPluginInstalled.mockResolvedValue(true);
      mockWpCliManager.getPluginStatus.mockResolvedValue({ status: 'inactive', version: '1.0' });
      mockWpCliManager.deletePlugin.mockResolvedValue({ success: true });

      const result = await manager.removePlugin(mockSite, 'my-plugin');

      expect(result.success).toBe(true);
      expect(mockWpCliManager.deactivatePlugin).not.toHaveBeenCalled();
    });

    it('should return error for non-installed plugin', async () => {
      mockWpCliManager.isPluginInstalled.mockResolvedValue(false);

      const result = await manager.removePlugin(mockSite, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Plugin is not installed');
    });
  });

  describe('listPlugins', () => {
    it('should delegate to WpCliManager', async () => {
      const mockPluginList = [
        { name: 'plugin1', status: 'active' },
        { name: 'plugin2', status: 'inactive' },
      ];
      mockWpCliManager.listPlugins.mockResolvedValue(mockPluginList);

      const result = await manager.listPlugins(mockSite);

      expect(result).toBe(mockPluginList);
      expect(mockWpCliManager.listPlugins).toHaveBeenCalledWith(mockSite);
    });
  });
});

/**
 * Tests for BundledPluginDetector module
 */

import { BundledPluginDetector } from '../../../src/wordpress/BundledPluginDetector';
import * as fs from 'fs-extra';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('BundledPluginDetector', () => {
  let detector: BundledPluginDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    detector = new BundledPluginDetector();
  });

  describe('detectPlugins', () => {
    it('should throw error for invalid directory path', async () => {
      mockFs.stat.mockRejectedValue(new Error('ENOENT'));

      await expect(
        detector.detectPlugins('/nonexistent/path')
      ).rejects.toThrow('Invalid repository path');
    });

    it('should throw error when path is not a directory', async () => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => false,
      } as any);

      await expect(
        detector.detectPlugins('/path/to/file')
      ).rejects.toThrow('Invalid repository path');
    });
  });

  describe('config-based detection', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
    });

    it('should parse .nodeorchestrator.json when present', async () => {
      const config = {
        wordpress: {
          plugins: [
            { source: 'bundled', slug: 'my-plugin', path: 'plugins/my-plugin' },
            { source: 'wporg', slug: 'woocommerce' },
          ],
        },
      };

      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return true;
        if (p.includes('plugins/my-plugin')) return true;
        return false;
      });
      mockFs.readFile.mockImplementation(async (p: string) => {
        if (p.toString().endsWith('.nodeorchestrator.json')) {
          return JSON.stringify(config);
        }
        if (p.toString().endsWith('.php')) {
          return '<?php\n/**\n* Plugin Name: My Plugin\n*/';
        }
        return '';
      });
      mockFs.readdir.mockResolvedValue(['my-plugin.php'] as any);
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);

      const result = await detector.detectPlugins('/repo/path');

      expect(result.source).toBe('config');
      expect(result.plugins).toHaveLength(2);
      expect(result.plugins[0].slug).toBe('my-plugin');
      expect(result.plugins[1].slug).toBe('woocommerce');
    });

    it('should throw error for invalid config format', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('{ invalid json }');

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Failed to parse');
    });

    it('should throw error for config validation failures', async () => {
      const invalidConfig = {
        wordpress: {
          plugins: [
            { source: 'invalid', slug: 'test' }, // Invalid source
          ],
        },
      };

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Invalid .nodeorchestrator.json');
    });

    it('should validate bundled plugin paths for path traversal', async () => {
      const config = {
        wordpress: {
          plugins: [
            { source: 'bundled', slug: 'evil-plugin', path: '../../../etc/passwd' },
          ],
        },
      };

      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return true;
        return false;
      });
      mockFs.readFile.mockResolvedValue(JSON.stringify(config));

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Security violation');
    });

    it('should throw error when bundled plugin path not found', async () => {
      const config = {
        wordpress: {
          plugins: [
            { source: 'bundled', slug: 'missing', path: 'plugins/missing' },
          ],
        },
      };

      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return true;
        return false; // Plugin path doesn't exist
      });
      mockFs.readFile.mockResolvedValue(JSON.stringify(config));

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Plugin path not found');
    });

    it('should throw error when bundled plugin path is not a directory', async () => {
      const config = {
        wordpress: {
          plugins: [
            { source: 'bundled', slug: 'file-not-dir', path: 'plugins/file' },
          ],
        },
      };

      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return true;
        if (p.includes('plugins/file')) return true;
        return false;
      });
      mockFs.readFile.mockResolvedValue(JSON.stringify(config));
      mockFs.stat.mockImplementation(async (p: string) => {
        if (p.toString().includes('plugins/file')) {
          return { isDirectory: () => false } as any;
        }
        return { isDirectory: () => true } as any;
      });

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Plugin path is not a directory');
    });

    it('should throw error when bundled path lacks plugin headers', async () => {
      const config = {
        wordpress: {
          plugins: [
            { source: 'bundled', slug: 'no-headers', path: 'plugins/no-headers' },
          ],
        },
      };

      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return true;
        if (p.includes('plugins/no-headers')) return true;
        return false;
      });
      mockFs.readFile.mockImplementation(async (p: string) => {
        if (p.toString().endsWith('.nodeorchestrator.json')) {
          return JSON.stringify(config);
        }
        return '<?php // No plugin headers';
      });
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readdir.mockResolvedValue(['index.php'] as any);

      await expect(
        detector.detectPlugins('/repo/path')
      ).rejects.toThrow('Invalid WordPress plugin');
    });
  });

  describe('convention-based detection', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockFs.pathExists.mockImplementation(async (p: string) => {
        // No config file
        if (p.endsWith('.nodeorchestrator.json')) return false;
        return true;
      });
    });

    it('should scan conventional paths when no config present', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['my-plugin.php'] as any);
      mockFs.readFile.mockResolvedValue(
        '<?php\n/**\n * Plugin Name: My Plugin\n */'
      );

      const result = await detector.detectPlugins('/repo/path');

      expect(result.source).toBe('convention');
      expect(result.scannedPaths).toBeDefined();
      expect(result.plugins).toHaveLength(1);
      expect(result.plugins[0].slug).toBe('wp-plugin');
    });

    it('should return empty array when no plugins found', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const result = await detector.detectPlugins('/repo/path');

      expect(result.source).toBe('convention');
      expect(result.plugins).toHaveLength(0);
      expect(result.scannedPaths).toBeDefined();
    });

    it('should detect plugins in multiple conventional paths', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        if (p.includes('/plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['plugin.php'] as any);
      mockFs.readFile.mockResolvedValue(
        '<?php\n/**\n * Plugin Name: Plugin\n */'
      );

      const result = await detector.detectPlugins('/repo/path');

      expect(result.source).toBe('convention');
      expect(result.plugins.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip paths that are not directories', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.stat.mockImplementation(async (p: string) => {
        if (p.toString().includes('/wp-plugin')) {
          return { isDirectory: () => false } as any; // wp-plugin is a file
        }
        return { isDirectory: () => true } as any;
      });

      const result = await detector.detectPlugins('/repo/path');

      expect(result.plugins).toHaveLength(0);
    });

    it('should skip directories without plugin headers', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['index.php'] as any);
      mockFs.readFile.mockResolvedValue('<?php // Not a plugin');

      const result = await detector.detectPlugins('/repo/path');

      expect(result.plugins).toHaveLength(0);
    });

    it('should set autoActivate to true by default for convention plugins', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['plugin.php'] as any);
      mockFs.readFile.mockResolvedValue(
        '<?php\n/**\n * Plugin Name: Plugin\n */'
      );

      const result = await detector.detectPlugins('/repo/path');

      expect(result.plugins[0].autoActivate).toBe(true);
    });
  });

  describe('plugin header detection', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        return true;
      });
    });

    it('should detect standard plugin header format', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['plugin.php'] as any);
      mockFs.readFile.mockResolvedValue(`<?php
/**
 * Plugin Name: My Awesome Plugin
 * Description: A really cool plugin
 * Version: 1.0.0
 */`);

      const result = await detector.detectPlugins('/repo/path');
      expect(result.plugins).toHaveLength(1);
    });

    it('should detect single-line plugin header', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['plugin.php'] as any);
      mockFs.readFile.mockResolvedValue('<?php /** Plugin Name: Simple */ ?>');

      const result = await detector.detectPlugins('/repo/path');
      expect(result.plugins).toHaveLength(1);
    });

    it('should not detect files without Plugin Name header', async () => {
      mockFs.pathExists.mockImplementation(async (p: string) => {
        if (p.endsWith('.nodeorchestrator.json')) return false;
        if (p.includes('/wp-plugin')) return true;
        return false;
      });
      mockFs.readdir.mockResolvedValue(['plugin.php'] as any);
      mockFs.readFile.mockResolvedValue(`<?php
/**
 * Description: Just a description without Plugin Name
 */`);

      const result = await detector.detectPlugins('/repo/path');
      expect(result.plugins).toHaveLength(0);
    });
  });
});

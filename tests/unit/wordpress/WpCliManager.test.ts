/**
 * Tests for WpCliManager
 * Security-critical: Tests command whitelist, argument validation, and shell metacharacter prevention
 */

import { WpCliManager } from '../../../src/wordpress/WpCliManager';
import { createMockSite } from '../../__mocks__/local';

describe('WpCliManager', () => {
  let wpCliManager: WpCliManager;
  let mockWpCli: { run: jest.Mock };
  const mockSite = createMockSite();

  beforeEach(() => {
    mockWpCli = {
      run: jest.fn().mockResolvedValue({ stdout: '', stderr: '' })
    };
    wpCliManager = new WpCliManager(mockWpCli);
  });

  describe('command whitelist validation', () => {
    describe('allowed commands', () => {
      it('should allow plugin command', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['list']);
        expect(result.success).toBe(true);
        expect(mockWpCli.run).toHaveBeenCalled();
      });

      it('should allow option command', async () => {
        const result = await wpCliManager.execute(mockSite, 'option', ['get', 'siteurl']);
        expect(result.success).toBe(true);
      });

      it('should allow user command', async () => {
        const result = await wpCliManager.execute(mockSite, 'user', ['list']);
        expect(result.success).toBe(true);
      });

      it('should allow post command', async () => {
        const result = await wpCliManager.execute(mockSite, 'post', ['list']);
        expect(result.success).toBe(true);
      });

      it('should allow db command', async () => {
        const result = await wpCliManager.execute(mockSite, 'db', ['check']);
        expect(result.success).toBe(true);
      });

      it('should allow cache command', async () => {
        const result = await wpCliManager.execute(mockSite, 'cache', ['flush']);
        expect(result.success).toBe(true);
      });

      it('should allow rewrite command', async () => {
        const result = await wpCliManager.execute(mockSite, 'rewrite', ['flush']);
        expect(result.success).toBe(true);
      });

      it('should allow theme command', async () => {
        const result = await wpCliManager.execute(mockSite, 'theme', ['list']);
        expect(result.success).toBe(true);
      });
    });

    describe('blocked commands (security)', () => {
      it('should reject eval command', async () => {
        const result = await wpCliManager.execute(mockSite, 'eval', ['echo "test"']);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
        expect(mockWpCli.run).not.toHaveBeenCalled();
      });

      it('should reject shell command', async () => {
        const result = await wpCliManager.execute(mockSite, 'shell', []);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
      });

      it('should reject config command', async () => {
        const result = await wpCliManager.execute(mockSite, 'config', ['edit']);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
      });

      it('should reject core command', async () => {
        const result = await wpCliManager.execute(mockSite, 'core', ['download']);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
      });

      it('should reject arbitrary commands', async () => {
        const result = await wpCliManager.execute(mockSite, 'custom-command', []);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });
  });

  describe('plugin subcommand validation', () => {
    describe('allowed subcommands', () => {
      it('should allow plugin list', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['list']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin activate', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin deactivate', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['deactivate', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin delete', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['delete', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin install', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['install', 'woocommerce']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin update', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['update', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin get', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['get', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin is-installed', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['is-installed', 'my-plugin']);
        expect(result.success).toBe(true);
      });

      it('should allow plugin status', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['status', 'my-plugin']);
        expect(result.success).toBe(true);
      });
    });

    describe('blocked subcommands (security)', () => {
      it('should reject plugin exec subcommand', async () => {
        const result = await wpCliManager.execute(mockSite, 'plugin', ['exec', 'evil-code']);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });
  });

  describe('shell metacharacter prevention (security)', () => {
    it('should reject arguments with semicolon', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin; rm -rf /']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with ampersand', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin && evil']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with pipe', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin | cat /etc/passwd']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with backtick', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', '`whoami`']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with dollar sign', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', '$HOME']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with parentheses', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', '$(whoami)']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with angle brackets', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin > output.txt']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with backslash', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin\\n']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with single quotes', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', "plugin'test"]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with double quotes', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin"test']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should reject arguments with null bytes', async () => {
      const result = await wpCliManager.execute(mockSite, 'plugin', ['activate', 'plugin\x00']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('activatePlugin', () => {
    it('should activate valid plugin', async () => {
      mockWpCli.run.mockResolvedValueOnce({ stdout: 'Plugin activated', stderr: '' });
      const result = await wpCliManager.activatePlugin(mockSite, 'my-plugin');
      expect(result.success).toBe(true);
      expect(mockWpCli.run).toHaveBeenCalledWith(
        mockSite,
        ['plugin', 'activate', 'my-plugin']
      );
    });

    it('should reject invalid plugin slug (path traversal)', async () => {
      const result = await wpCliManager.activatePlugin(mockSite, '../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid plugin slug');
      expect(mockWpCli.run).not.toHaveBeenCalled();
    });

    it('should reject invalid plugin slug (shell chars)', async () => {
      const result = await wpCliManager.activatePlugin(mockSite, 'plugin; rm -rf /');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid plugin slug');
    });
  });

  describe('deactivatePlugin', () => {
    it('should deactivate valid plugin', async () => {
      mockWpCli.run.mockResolvedValueOnce({ stdout: 'Plugin deactivated', stderr: '' });
      const result = await wpCliManager.deactivatePlugin(mockSite, 'my-plugin');
      expect(result.success).toBe(true);
      expect(mockWpCli.run).toHaveBeenCalledWith(
        mockSite,
        ['plugin', 'deactivate', 'my-plugin']
      );
    });

    it('should reject invalid plugin slug', async () => {
      const result = await wpCliManager.deactivatePlugin(mockSite, '../bad');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid plugin slug');
    });
  });

  describe('deletePlugin', () => {
    it('should delete valid plugin', async () => {
      mockWpCli.run.mockResolvedValueOnce({ stdout: 'Plugin deleted', stderr: '' });
      const result = await wpCliManager.deletePlugin(mockSite, 'my-plugin');
      expect(result.success).toBe(true);
      expect(mockWpCli.run).toHaveBeenCalledWith(
        mockSite,
        ['plugin', 'delete', 'my-plugin']
      );
    });

    it('should reject invalid plugin slug', async () => {
      const result = await wpCliManager.deletePlugin(mockSite, 'plugin<script>');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid plugin slug');
    });
  });

  describe('listPlugins', () => {
    it('should return parsed plugin list', async () => {
      const pluginList = [
        { name: 'akismet', status: 'active', update: 'none', version: '5.0.0', title: 'Akismet' },
        { name: 'hello', status: 'inactive', update: 'available', version: '1.0.0', title: 'Hello Dolly' }
      ];
      mockWpCli.run.mockResolvedValueOnce({ stdout: JSON.stringify(pluginList), stderr: '' });

      const result = await wpCliManager.listPlugins(mockSite);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('akismet');
      expect(result[1].status).toBe('inactive');
    });

    it('should return empty array on failure', async () => {
      mockWpCli.run.mockRejectedValueOnce(new Error('Failed'));
      const result = await wpCliManager.listPlugins(mockSite);
      expect(result).toEqual([]);
    });
  });

  describe('getPluginStatus', () => {
    it('should return plugin info', async () => {
      const pluginInfo = { name: 'akismet', status: 'active', update: 'none', version: '5.0.0' };
      mockWpCli.run.mockResolvedValueOnce({ stdout: JSON.stringify(pluginInfo), stderr: '' });

      const result = await wpCliManager.getPluginStatus(mockSite, 'akismet');
      expect(result?.name).toBe('akismet');
      expect(result?.status).toBe('active');
    });

    it('should return null on failure', async () => {
      mockWpCli.run.mockRejectedValueOnce(new Error('Not found'));
      const result = await wpCliManager.getPluginStatus(mockSite, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('isPluginInstalled', () => {
    it('should return true if plugin is installed', async () => {
      mockWpCli.run.mockResolvedValueOnce({ stdout: 'true', stderr: '' });
      const result = await wpCliManager.isPluginInstalled(mockSite, 'akismet');
      expect(result).toBe(true);
    });

    it('should return false if plugin is not installed', async () => {
      mockWpCli.run.mockRejectedValueOnce(new Error('Not installed'));
      const result = await wpCliManager.isPluginInstalled(mockSite, 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('runCommand', () => {
    it('should parse and execute command string', async () => {
      const result = await wpCliManager.runCommand(mockSite, 'plugin list --format=json');
      expect(result.success).toBe(true);
      expect(mockWpCli.run).toHaveBeenCalledWith(
        mockSite,
        ['plugin', 'list', '--format=json']
      );
    });

    it('should reject empty command string', async () => {
      const result = await wpCliManager.runCommand(mockSite, '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // The command validation rejects empty string as invalid command
    });

    it('should trim whitespace', async () => {
      const result = await wpCliManager.runCommand(mockSite, '  plugin   list  ');
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return error from wpCli stderr', async () => {
      mockWpCli.run.mockRejectedValueOnce({ stderr: 'Plugin not found' });
      const result = await wpCliManager.execute(mockSite, 'plugin', ['get', 'nonexistent']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Plugin not found');
    });

    it('should return error message if no stderr', async () => {
      mockWpCli.run.mockRejectedValueOnce(new Error('Network error'));
      const result = await wpCliManager.execute(mockSite, 'plugin', ['list']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should return default error if no details', async () => {
      mockWpCli.run.mockRejectedValueOnce({});
      const result = await wpCliManager.execute(mockSite, 'plugin', ['list']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('WP-CLI command failed');
    });
  });
});

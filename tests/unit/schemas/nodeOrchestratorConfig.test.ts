/**
 * Tests for Zod schemas
 */

import { PluginConfigSchema, NodeOrchestratorConfigSchema } from '../../../src/schemas';

describe('PluginConfigSchema', () => {
  describe('bundled source', () => {
    it('should accept valid bundled config', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'bundled',
        slug: 'my-plugin',
        path: 'plugins/my-plugin'
      });
      expect(result.success).toBe(true);
    });

    it('should require path for bundled', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'bundled',
        slug: 'my-plugin'
      });
      expect(result.success).toBe(false);
    });

    it('should accept autoActivate option', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'bundled',
        slug: 'my-plugin',
        path: 'plugins/my-plugin',
        autoActivate: true
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoActivate).toBe(true);
      }
    });
  });

  describe('git source', () => {
    it('should accept valid git config', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'git',
        slug: 'my-plugin',
        url: 'https://github.com/user/repo.git',
        branch: 'main'
      });
      expect(result.success).toBe(true);
    });

    it('should require url for git', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'git',
        slug: 'my-plugin',
        branch: 'main'
      });
      expect(result.success).toBe(false);
    });

    it('should default branch to main', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'git',
        slug: 'my-plugin',
        url: 'https://github.com/user/repo.git'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('main');
      }
    });
  });

  describe('zip source', () => {
    it('should accept valid zip config', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'zip',
        slug: 'my-plugin',
        url: 'https://example.com/plugin.zip'
      });
      expect(result.success).toBe(true);
    });

    it('should require url for zip', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'zip',
        slug: 'my-plugin'
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional checksum', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'zip',
        slug: 'my-plugin',
        url: 'https://example.com/plugin.zip',
        checksum: 'sha256:abc123'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('wporg source', () => {
    it('should accept valid wporg config', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'wporg',
        slug: 'woocommerce'
      });
      expect(result.success).toBe(true);
    });

    it('should accept version option', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'wporg',
        slug: 'woocommerce',
        version: '8.0.0'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe('8.0.0');
      }
    });
  });

  describe('validation errors', () => {
    it('should reject unknown source', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'unknown',
        slug: 'my-plugin'
      });
      expect(result.success).toBe(false);
    });

    it('should require slug', () => {
      const result = PluginConfigSchema.safeParse({
        source: 'wporg'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('NodeOrchestratorConfigSchema', () => {
  it('should accept valid full config', () => {
    const config = {
      node: {
        startCommand: 'npm start',
        autoStart: true,
        port: 3000
      },
      wordpress: {
        plugins: [
          {
            source: 'bundled',
            slug: 'my-plugin',
            path: 'plugins/my-plugin',
            autoActivate: true
          }
        ]
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should accept config with only node section', () => {
    const config = {
      node: {
        startCommand: 'npm start'
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should accept config with only wordpress section', () => {
    const config = {
      wordpress: {
        plugins: [
          {
            source: 'wporg',
            slug: 'woocommerce'
          }
        ]
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should apply default autoStart value', () => {
    const config = {
      node: {
        startCommand: 'npm start'
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.node?.autoStart).toBe(false);
    }
  });

  it('should apply default plugins array', () => {
    const config = {
      wordpress: {}
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wordpress?.plugins).toEqual([]);
    }
  });

  it('should reject invalid plugin config', () => {
    const config = {
      wordpress: {
        plugins: [
          {
            source: 'git',
            slug: 'my-plugin'
            // Missing required url
          }
        ]
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should accept empty config', () => {
    const result = NodeOrchestratorConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept $schema property', () => {
    const config = {
      $schema: 'https://example.com/schema.json',
      node: {
        startCommand: 'npm start'
      }
    };

    const result = NodeOrchestratorConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

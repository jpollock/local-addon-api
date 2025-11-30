/**
 * Tests for WordPressEnvManager module
 */

import { WordPressEnvManager } from '../../../src/wordpress/WordPressEnvManager';
import { createMockSite } from '../../helpers/mockFactory';

describe('WordPressEnvManager', () => {
  describe('extractWordPressEnv', () => {
    it('should extract all WordPress environment variables', () => {
      const site = createMockSite({
        domain: 'mysite.local',
        path: '/Users/test/Local Sites/mysite/app/public',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'secret',
          host: 'localhost',
          port: 3306,
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_DB_HOST).toBe('localhost');
      expect(env.WP_DB_NAME).toBe('local');
      expect(env.WP_DB_USER).toBe('root');
      expect(env.WP_DB_PASSWORD).toBe('secret');
      expect(env.WP_SITE_URL).toBe('http://mysite.local');
      expect(env.WP_HOME_URL).toBe('http://mysite.local');
      expect(env.WP_ADMIN_URL).toBe('http://mysite.local/wp-admin');
      expect(env.WP_CONTENT_DIR).toContain('wp-content');
      expect(env.WP_UPLOADS_DIR).toContain('wp-content/uploads');
    });

    it('should include DATABASE_URL when all credentials present', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'testdb',
          user: 'testuser',
          password: 'testpass',
          host: 'localhost',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.DATABASE_URL).toBeDefined();
      expect(env.DATABASE_URL).toContain('mysql://');
      expect(env.DATABASE_URL).toContain('testuser');
      expect(env.DATABASE_URL).toContain('testdb');
    });

    it('should include port in DB host when non-standard', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
          host: 'localhost',
          port: 10003,
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_DB_HOST).toBe('localhost:10003');
    });

    it('should not include port when standard 3306', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
          host: 'localhost',
          port: 3306,
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_DB_HOST).toBe('localhost');
    });

    it('should handle domain with protocol already present', () => {
      const site = createMockSite({
        domain: 'https://secure.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_SITE_URL).toBe('https://secure.local');
    });

    it('should throw error for invalid site object', () => {
      expect(() => {
        WordPressEnvManager.extractWordPressEnv(null as any);
      }).toThrow('Invalid site object');
    });

    it('should throw error when domain is missing', () => {
      const site = createMockSite({
        domain: '',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
        },
      });

      expect(() => {
        WordPressEnvManager.extractWordPressEnv(site);
      }).toThrow('Unable to extract site URL');
    });

    it('should throw error when web root is missing', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
        },
      });

      expect(() => {
        WordPressEnvManager.extractWordPressEnv(site);
      }).toThrow('Unable to extract web root');
    });

    it('should use default values when mysql properties missing', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {},
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_DB_HOST).toBe('localhost');
      expect(env.WP_DB_USER).toBe('root');
      expect(env.WP_DB_PASSWORD).toBe('root');
      expect(env.WP_DB_NAME).toBe('local');
    });

    it('should URL-encode special characters in DATABASE_URL', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'mydb',
          user: 'user@domain',
          password: 'pass#word!',
          host: 'localhost',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.DATABASE_URL).toContain('user%40domain');
      expect(env.DATABASE_URL).toContain('pass%23word!');
    });

    it('should extract from services.mysql when mysql not present', () => {
      const site = {
        id: 'test',
        name: 'Test',
        domain: 'test.local',
        path: '/path/to/site',
        services: {
          mysql: {
            database: 'servicedb',
            user: 'serviceuser',
            password: 'servicepass',
            host: '127.0.0.1',
            port: 10004,
          },
        },
      } as any;

      const env = WordPressEnvManager.extractWordPressEnv(site);

      expect(env.WP_DB_NAME).toBe('servicedb');
      expect(env.WP_DB_USER).toBe('serviceuser');
      expect(env.WP_DB_HOST).toBe('127.0.0.1:10004');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should redact password', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'supersecret',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);
      const sanitized = WordPressEnvManager.sanitizeForLogging(env);

      expect(sanitized.WP_DB_PASSWORD).toBe('***REDACTED***');
      expect(sanitized.DATABASE_URL).toBe('mysql://***REDACTED***');
    });

    it('should preserve non-sensitive fields', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'secret',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);
      const sanitized = WordPressEnvManager.sanitizeForLogging(env);

      expect(sanitized.WP_DB_HOST).toBe(env.WP_DB_HOST);
      expect(sanitized.WP_DB_NAME).toBe(env.WP_DB_NAME);
      expect(sanitized.WP_DB_USER).toBe(env.WP_DB_USER);
      expect(sanitized.WP_SITE_URL).toBe(env.WP_SITE_URL);
    });

    it('should redact DATABASE_URL when present', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
        },
      });

      const env = WordPressEnvManager.extractWordPressEnv(site);
      const sanitized = WordPressEnvManager.sanitizeForLogging(env);

      // DATABASE_URL is always present when defaults are used
      expect(sanitized.DATABASE_URL).toBe('mysql://***REDACTED***');
    });
  });

  describe('canExtractWordPressEnv', () => {
    it('should return true for valid site', () => {
      const site = createMockSite({
        domain: 'test.local',
        path: '/path/to/site',
        mysql: {
          database: 'local',
          user: 'root',
          password: 'root',
        },
      });

      expect(WordPressEnvManager.canExtractWordPressEnv(site)).toBe(true);
    });

    it('should return false for invalid site', () => {
      const invalidSite = {
        id: 'test',
        name: 'Test',
        // Missing required fields
      } as any;

      expect(WordPressEnvManager.canExtractWordPressEnv(invalidSite)).toBe(false);
    });

    it('should return false for null', () => {
      expect(WordPressEnvManager.canExtractWordPressEnv(null as any)).toBe(false);
    });
  });
});

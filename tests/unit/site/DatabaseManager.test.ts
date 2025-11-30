/**
 * Tests for DatabaseManager module
 */

import { DatabaseManager } from '../../../src/site/DatabaseManager';
import { createMockSite } from '../../helpers/mockFactory';

// Mock the ServiceContainer
const mockGetServices = jest.fn();
jest.mock('../../../src/core/ServiceContainer', () => ({
  getServices: () => mockGetServices(),
}));

describe('DatabaseManager', () => {
  let manager: DatabaseManager;
  let mockSiteDatabase: {
    waitForDB: jest.Mock;
    runQuery: jest.Mock;
  };
  const mockSite = createMockSite();

  beforeEach(() => {
    mockSiteDatabase = {
      waitForDB: jest.fn(),
      runQuery: jest.fn(),
    };

    mockGetServices.mockReturnValue({
      siteDatabase: mockSiteDatabase,
    });

    manager = new DatabaseManager(mockSite);
  });

  describe('waitForReady', () => {
    it('should wait for database to be ready', async () => {
      mockSiteDatabase.waitForDB.mockResolvedValue(true);

      const result = await manager.waitForReady();

      expect(result).toBe(true);
      expect(mockSiteDatabase.waitForDB).toHaveBeenCalledWith(mockSite);
    });

    it('should return false when database is not ready', async () => {
      mockSiteDatabase.waitForDB.mockResolvedValue(false);

      const result = await manager.waitForReady();

      expect(result).toBe(false);
    });
  });

  describe('query', () => {
    it('should execute raw SQL query', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('Query result');

      const result = await manager.query('SELECT * FROM wp_posts');

      expect(result).toBe('Query result');
      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(mockSite, 'SELECT * FROM wp_posts');
    });

    it('should throw error when runQuery not available', async () => {
      mockGetServices.mockReturnValue({
        siteDatabase: {
          waitForDB: jest.fn(),
          // runQuery not available
        },
      });

      const managerNoQuery = new DatabaseManager(mockSite);

      await expect(managerNoQuery.query('SELECT 1')).rejects.toThrow(
        'Database queries are not supported in this version of Local'
      );
    });
  });

  describe('getOption', () => {
    it('should get WordPress option value', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('http://mysite.local');

      const result = await manager.getOption('siteurl');

      expect(result).toBe('http://mysite.local');
      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
        mockSite,
        "SELECT option_value FROM wp_options WHERE option_name = 'siteurl'"
      );
    });

    it('should return null when option not found', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      const result = await manager.getOption('nonexistent');

      expect(result).toBeNull();
    });

    it('should escape single quotes in option name', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      await manager.getOption("option'name");

      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
        mockSite,
        "SELECT option_value FROM wp_options WHERE option_name = 'option''name'"
      );
    });
  });

  describe('setOption', () => {
    it('should set WordPress option value', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      await manager.setOption('blogname', 'My Site');

      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
        mockSite,
        "UPDATE wp_options SET option_value = 'My Site' WHERE option_name = 'blogname'"
      );
    });

    it('should escape special characters', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      await manager.setOption('option', "value'with\\special");

      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
        mockSite,
        "UPDATE wp_options SET option_value = 'value''with\\\\special' WHERE option_name = 'option'"
      );
    });
  });

  describe('getSiteUrl', () => {
    it('should get siteurl option', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('http://mysite.local');

      const result = await manager.getSiteUrl();

      expect(result).toBe('http://mysite.local');
    });
  });

  describe('getHomeUrl', () => {
    it('should get home option', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('http://mysite.local');

      const result = await manager.getHomeUrl();

      expect(result).toBe('http://mysite.local');
    });
  });

  describe('getBlogName', () => {
    it('should get blogname option', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('My Blog');

      const result = await manager.getBlogName();

      expect(result).toBe('My Blog');
    });
  });

  describe('getPostCount', () => {
    it('should get count of published posts', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('42');

      const result = await manager.getPostCount();

      expect(result).toBe(42);
    });

    it('should return 0 for empty result', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      const result = await manager.getPostCount();

      expect(result).toBe(0);
    });

    it('should return 0 for non-numeric result', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('not a number');

      const result = await manager.getPostCount();

      expect(result).toBe(0);
    });
  });

  describe('getUserCount', () => {
    it('should get count of users', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('5');

      const result = await manager.getUserCount();

      expect(result).toBe(5);
    });
  });

  describe('tableExists', () => {
    it('should return true when table exists', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('wp_posts');

      const result = await manager.tableExists('wp_posts');

      expect(result).toBe(true);
    });

    it('should return false when table does not exist', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      const result = await manager.tableExists('nonexistent');

      expect(result).toBe(false);
    });

    it('should escape table name', async () => {
      mockSiteDatabase.runQuery.mockResolvedValue('');

      await manager.tableExists("table'name");

      expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
        mockSite,
        "SHOW TABLES LIKE 'table''name'"
      );
    });
  });
});

describe('SQL escaping', () => {
  const mockSite = createMockSite();
  let manager: DatabaseManager;
  let mockSiteDatabase: { runQuery: jest.Mock; waitForDB: jest.Mock };

  beforeEach(() => {
    mockSiteDatabase = {
      runQuery: jest.fn().mockResolvedValue(''),
      waitForDB: jest.fn(),
    };
    mockGetServices.mockReturnValue({ siteDatabase: mockSiteDatabase });
    manager = new DatabaseManager(mockSite);
  });

  it('should escape single quotes', async () => {
    await manager.setOption('test', "O'Brien");
    expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
      mockSite,
      "UPDATE wp_options SET option_value = 'O''Brien' WHERE option_name = 'test'"
    );
  });

  it('should escape backslashes', async () => {
    await manager.setOption('test', 'path\\to\\file');
    expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
      mockSite,
      "UPDATE wp_options SET option_value = 'path\\\\to\\\\file' WHERE option_name = 'test'"
    );
  });

  it('should escape multiple special characters', async () => {
    await manager.setOption('test', "It's a \\test\\");
    expect(mockSiteDatabase.runQuery).toHaveBeenCalledWith(
      mockSite,
      "UPDATE wp_options SET option_value = 'It''s a \\\\test\\\\' WHERE option_name = 'test'"
    );
  });
});

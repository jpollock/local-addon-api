/**
 * Tests for SiteManager module
 */

import { SiteManager, siteManager } from '../../../src/site/SiteManager';
import { createMockSite } from '../../helpers/mockFactory';

// Mock the ServiceContainer
const mockGetServices = jest.fn();
jest.mock('../../../src/core/ServiceContainer', () => ({
  getServices: () => mockGetServices(),
}));

describe('SiteManager', () => {
  let manager: SiteManager;
  let mockSiteData: {
    getSite: jest.Mock;
    getSites: jest.Mock;
  };
  let mockSiteProcessManager: {
    getSiteStatus: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
  };

  beforeEach(() => {
    mockSiteData = {
      getSite: jest.fn(),
      getSites: jest.fn(),
    };
    mockSiteProcessManager = {
      getSiteStatus: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockGetServices.mockReturnValue({
      siteData: mockSiteData,
      siteProcessManager: mockSiteProcessManager,
    });

    manager = new SiteManager();
  });

  describe('getSite', () => {
    it('should return site when found', () => {
      const mockSite = createMockSite({ id: 'site-123', name: 'Test Site' });
      mockSiteData.getSite.mockReturnValue(mockSite);

      const result = manager.getSite('site-123');

      expect(result).toBe(mockSite);
      expect(mockSiteData.getSite).toHaveBeenCalledWith('site-123');
    });

    it('should return undefined when site not found', () => {
      mockSiteData.getSite.mockReturnValue(undefined);

      const result = manager.getSite('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getSites', () => {
    it('should return all sites', () => {
      const mockSites = [
        createMockSite({ id: 'site-1' }),
        createMockSite({ id: 'site-2' }),
      ];
      mockSiteData.getSites.mockReturnValue(mockSites);

      const result = manager.getSites();

      expect(result).toBe(mockSites);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no sites', () => {
      mockSiteData.getSites.mockReturnValue([]);

      const result = manager.getSites();

      expect(result).toEqual([]);
    });
  });

  describe('getStatus', () => {
    it('should return site status', () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.getSiteStatus.mockReturnValue('running');

      const result = manager.getStatus(mockSite);

      expect(result).toBe('running');
      expect(mockSiteProcessManager.getSiteStatus).toHaveBeenCalledWith(mockSite);
    });
  });

  describe('isRunning', () => {
    it('should return true when site is running', () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.getSiteStatus.mockReturnValue('running');

      expect(manager.isRunning(mockSite)).toBe(true);
    });

    it('should return false when site is stopped', () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.getSiteStatus.mockReturnValue('stopped');

      expect(manager.isRunning(mockSite)).toBe(false);
    });
  });

  describe('isStopped', () => {
    it('should return true when site is stopped', () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.getSiteStatus.mockReturnValue('stopped');

      expect(manager.isStopped(mockSite)).toBe(true);
    });

    it('should return false when site is running', () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.getSiteStatus.mockReturnValue('running');

      expect(manager.isStopped(mockSite)).toBe(false);
    });
  });

  describe('start', () => {
    it('should start the site', async () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.start.mockResolvedValue(undefined);

      await manager.start(mockSite);

      expect(mockSiteProcessManager.start).toHaveBeenCalledWith(mockSite);
    });
  });

  describe('stop', () => {
    it('should stop the site', async () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.stop.mockResolvedValue(undefined);

      await manager.stop(mockSite);

      expect(mockSiteProcessManager.stop).toHaveBeenCalledWith(mockSite, undefined);
    });

    it('should stop the site with options', async () => {
      const mockSite = createMockSite();
      mockSiteProcessManager.stop.mockResolvedValue(undefined);

      await manager.stop(mockSite, { dumpDatabase: true });

      expect(mockSiteProcessManager.stop).toHaveBeenCalledWith(mockSite, { dumpDatabase: true });
    });
  });

  describe('getSitePath', () => {
    it('should return site path', () => {
      const mockSite = createMockSite({ path: '/Users/test/sites/mysite' });

      expect(manager.getSitePath(mockSite)).toBe('/Users/test/sites/mysite');
    });

    it('should expand tilde in path', () => {
      const originalHome = process.env.HOME;
      process.env.HOME = '/Users/testuser';

      const mockSite = createMockSite({ path: '~/Local Sites/mysite' });

      expect(manager.getSitePath(mockSite)).toBe('/Users/testuser/Local Sites/mysite');

      process.env.HOME = originalHome;
    });

    it('should use USERPROFILE when HOME not set', () => {
      const originalHome = process.env.HOME;
      const originalUserProfile = process.env.USERPROFILE;

      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\testuser';

      const mockSite = createMockSite({ path: '~/Local Sites/mysite' });

      expect(manager.getSitePath(mockSite)).toBe('C:\\Users\\testuser/Local Sites/mysite');

      process.env.HOME = originalHome;
      process.env.USERPROFILE = originalUserProfile;
    });

    it('should handle empty path', () => {
      const mockSite = createMockSite({ path: '' });

      expect(manager.getSitePath(mockSite)).toBe('');
    });
  });

  describe('getWpContentPath', () => {
    it('should return wp-content path', () => {
      const mockSite = createMockSite({ path: '/Users/test/sites/mysite' });

      expect(manager.getWpContentPath(mockSite)).toBe(
        '/Users/test/sites/mysite/app/public/wp-content'
      );
    });
  });

  describe('getPluginsPath', () => {
    it('should return plugins path', () => {
      const mockSite = createMockSite({ path: '/Users/test/sites/mysite' });

      expect(manager.getPluginsPath(mockSite)).toBe(
        '/Users/test/sites/mysite/app/public/wp-content/plugins'
      );
    });
  });

  describe('getDomain', () => {
    it('should return site domain', () => {
      const mockSite = createMockSite({ domain: 'mysite.local' });

      expect(manager.getDomain(mockSite)).toBe('mysite.local');
    });

    it('should return localhost when domain not set', () => {
      const mockSite = createMockSite({ domain: '' });

      expect(manager.getDomain(mockSite)).toBe('localhost');
    });
  });

  describe('getUrl', () => {
    it('should return site URL', () => {
      const mockSite = createMockSite({ domain: 'mysite.local' });

      expect(manager.getUrl(mockSite)).toBe('http://mysite.local');
    });
  });
});

describe('siteManager singleton', () => {
  it('should be a SiteManager instance', () => {
    expect(siteManager).toBeInstanceOf(SiteManager);
  });
});

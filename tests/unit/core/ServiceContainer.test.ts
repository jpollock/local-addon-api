/**
 * Tests for ServiceContainer module
 */

import { ServiceContainer, getServices } from '../../../src/core/ServiceContainer';

// Mock the local-main module
jest.mock('@getflywheel/local/main', () => ({
  getServiceContainer: jest.fn(() => ({
    cradle: {
      localLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      siteData: {
        getSite: jest.fn(),
        getSites: jest.fn(),
      },
      siteProcessManager: {
        getSiteStatus: jest.fn(),
        startSite: jest.fn(),
        stopSite: jest.fn(),
      },
      siteDatabase: {
        exec: jest.fn(),
      },
      ports: {
        getAvailablePort: jest.fn(),
      },
      wpCli: {
        run: jest.fn(),
      },
    },
  })),
}));

describe('getServices', () => {
  it('should return services from Local service container', () => {
    const services = getServices();

    expect(services).toBeDefined();
    expect(services.localLogger).toBeDefined();
    expect(services.siteData).toBeDefined();
    expect(services.siteProcessManager).toBeDefined();
    expect(services.siteDatabase).toBeDefined();
    expect(services.ports).toBeDefined();
    expect(services.wpCli).toBeDefined();
  });
});

describe('ServiceContainer', () => {
  beforeEach(() => {
    // Reset the singleton between tests
    const container = ServiceContainer.getInstance();
    container.reset();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ServiceContainer.getInstance();
      const instance2 = ServiceContainer.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return ServiceContainer instance', () => {
      const instance = ServiceContainer.getInstance();

      expect(instance).toBeInstanceOf(ServiceContainer);
    });
  });

  describe('logger', () => {
    it('should return logger service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.logger).toBeDefined();
      expect(container.logger.info).toBeDefined();
      expect(container.logger.warn).toBeDefined();
      expect(container.logger.error).toBeDefined();
    });
  });

  describe('siteData', () => {
    it('should return site data service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.siteData).toBeDefined();
      expect(container.siteData.getSite).toBeDefined();
      expect(container.siteData.getSites).toBeDefined();
    });
  });

  describe('processManager', () => {
    it('should return process manager service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.processManager).toBeDefined();
      expect(container.processManager.getSiteStatus).toBeDefined();
      expect(container.processManager.startSite).toBeDefined();
      expect(container.processManager.stopSite).toBeDefined();
    });
  });

  describe('database', () => {
    it('should return database service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.database).toBeDefined();
      expect(container.database.exec).toBeDefined();
    });
  });

  describe('ports', () => {
    it('should return ports service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.ports).toBeDefined();
      expect(container.ports.getAvailablePort).toBeDefined();
    });
  });

  describe('wpCli', () => {
    it('should return WP-CLI service', () => {
      const container = ServiceContainer.getInstance();

      expect(container.wpCli).toBeDefined();
      expect(container.wpCli.run).toBeDefined();
    });
  });

  describe('lazy initialization', () => {
    it('should cache services after first access', () => {
      const container = ServiceContainer.getInstance();

      // Access services multiple times
      const logger1 = container.logger;
      const logger2 = container.logger;

      // Should be the same cached reference
      expect(logger1).toBe(logger2);
    });
  });

  describe('reset', () => {
    it('should clear cached services', () => {
      const container = ServiceContainer.getInstance();

      // Access services to initialize cache
      container.logger;

      // Reset
      container.reset();

      // Services should be re-fetched
      const LocalMain = require('@getflywheel/local/main');
      const callCountBefore = LocalMain.getServiceContainer.mock.calls.length;

      // Access again
      container.logger;

      const callCountAfter = LocalMain.getServiceContainer.mock.calls.length;
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    });
  });
});

/**
 * Mock for @getflywheel/local/main
 * Provides mock service container and addon context
 */

export const getServiceContainer = jest.fn();
export const addIpcAsyncListener = jest.fn();

export interface AddonMainContext {
  hooks: {
    addAction: jest.Mock;
    addFilter: jest.Mock;
  };
}

// Mock services that match the LocalServices interface
export const mockServices = {
  localLogger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  siteData: {
    getSite: jest.fn(),
    getSites: jest.fn(() => []),
    updateSite: jest.fn()
  },
  siteProcessManager: {
    getSiteProcess: jest.fn(),
    getSiteStatus: jest.fn(() => 'stopped'),
    startSite: jest.fn(),
    stopSite: jest.fn()
  },
  siteDatabase: {
    getConnection: jest.fn()
  },
  ports: {
    getAvailablePort: jest.fn(() => Promise.resolve(3000)),
    releasePort: jest.fn()
  },
  wpCli: {
    run: jest.fn(() => Promise.resolve({ stdout: '', stderr: '' }))
  }
};

// Create mock addon context
export const createMockContext = (): AddonMainContext => ({
  hooks: {
    addAction: jest.fn(),
    addFilter: jest.fn()
  }
});

// Reset all mocks to default state
export const resetAllMocks = () => {
  jest.clearAllMocks();
  getServiceContainer.mockReturnValue({
    cradle: mockServices
  });

  // Reset individual service mocks to default values
  mockServices.siteData.getSites.mockReturnValue([]);
  mockServices.siteProcessManager.getSiteStatus.mockReturnValue('stopped');
  mockServices.ports.getAvailablePort.mockResolvedValue(3000);
  mockServices.wpCli.run.mockResolvedValue({ stdout: '', stderr: '' });
};

export default {
  getServiceContainer,
  addIpcAsyncListener,
  mockServices,
  createMockContext,
  resetAllMocks
};

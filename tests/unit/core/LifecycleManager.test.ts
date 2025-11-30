/**
 * Tests for LifecycleManager module
 */

import {
  LifecycleManager,
  onSiteStarted,
  onSiteStopped,
  onSiteAdded,
  onSiteDeleted,
  AddonMainContext,
} from '../../../src/core/LifecycleManager';

// Mock the ServiceContainer
jest.mock('../../../src/core/ServiceContainer', () => ({
  getServices: jest.fn(() => ({
    localLogger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    siteData: {
      getSite: jest.fn((id: string) => ({ id, name: 'Test Site' })),
    },
  })),
}));

describe('LifecycleManager', () => {
  let mockContext: AddonMainContext;
  let mockHooksAddAction: jest.Mock;
  let mockIpcMainOn: jest.Mock;

  beforeEach(() => {
    mockHooksAddAction = jest.fn();
    mockIpcMainOn = jest.fn();

    mockContext = {
      hooks: {
        addAction: mockHooksAddAction,
      },
      electron: {
        ipcMain: {
          handle: jest.fn(),
          on: mockIpcMainOn,
        },
      },
    };
  });

  describe('onSiteStarted', () => {
    it('should register siteStarted hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteStarted(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteStarted', expect.any(Function));
    });

    it('should call callback when hook triggers', async () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();
      const mockSite = { id: 'test-id', name: 'Test Site' };

      manager.onSiteStarted(callback);

      // Get the wrapped handler and call it
      const wrappedHandler = mockHooksAddAction.mock.calls[0][1];
      await wrappedHandler(mockSite);

      expect(callback).toHaveBeenCalledWith(mockSite);
    });

    it('should handle callback errors without throwing', async () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn().mockRejectedValue(new Error('Callback error'));
      const mockSite = { id: 'test-id', name: 'Test Site' };

      manager.onSiteStarted(callback);

      const wrappedHandler = mockHooksAddAction.mock.calls[0][1];

      // Should not throw
      await expect(wrappedHandler(mockSite)).resolves.not.toThrow();
    });
  });

  describe('onSiteStopped', () => {
    it('should register siteStopped hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteStopped(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteStopped', expect.any(Function));
    });
  });

  describe('onSiteStopping', () => {
    it('should register siteStopping hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteStopping(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteStopping', expect.any(Function));
    });
  });

  describe('onSiteAdded', () => {
    it('should register both hook action and IPC listener', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteAdded(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteAdded', expect.any(Function));
      expect(mockIpcMainOn).toHaveBeenCalledWith('siteAdded', expect.any(Function));
    });

    it('should call callback when hook triggers', async () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();
      const mockSite = { id: 'test-id', name: 'Test Site' };

      manager.onSiteAdded(callback);

      const wrappedHandler = mockHooksAddAction.mock.calls[0][1];
      await wrappedHandler(mockSite);

      expect(callback).toHaveBeenCalledWith(mockSite);
    });

    it('should call callback when IPC event triggers', async () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteAdded(callback);

      // Get the IPC handler
      const ipcHandler = mockIpcMainOn.mock.calls[0][1];

      // Simulate IPC event
      ipcHandler({}, { id: 'test-id' });

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-id' }));
    });

    it('should handle IPC callback errors without throwing', async () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn().mockRejectedValue(new Error('IPC callback error'));

      manager.onSiteAdded(callback);

      const ipcHandler = mockIpcMainOn.mock.calls[0][1];

      // Should not throw
      expect(() => ipcHandler({}, { id: 'test-id' })).not.toThrow();
    });
  });

  describe('onSiteDeleted', () => {
    it('should register siteDeleted hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteDeleted(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteDeleted', expect.any(Function));
    });
  });

  describe('onSiteDeleting', () => {
    it('should register siteDeleting hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteDeleting(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteDeleting', expect.any(Function));
    });
  });

  describe('onSiteUpdated', () => {
    it('should register siteUpdated hook', () => {
      const manager = new LifecycleManager(mockContext);
      const callback = jest.fn();

      manager.onSiteUpdated(callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteUpdated', expect.any(Function));
    });
  });
});

// Test convenience functions
describe('Convenience functions', () => {
  let mockContext: AddonMainContext;
  let mockHooksAddAction: jest.Mock;

  beforeEach(() => {
    mockHooksAddAction = jest.fn();

    mockContext = {
      hooks: {
        addAction: mockHooksAddAction,
      },
      electron: {
        ipcMain: {
          handle: jest.fn(),
          on: jest.fn(),
        },
      },
    };
  });

  describe('onSiteStarted', () => {
    it('should register siteStarted hook via convenience function', () => {
      const callback = jest.fn();
      onSiteStarted(mockContext, callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteStarted', expect.any(Function));
    });
  });

  describe('onSiteStopped', () => {
    it('should register siteStopped hook via convenience function', () => {
      const callback = jest.fn();
      onSiteStopped(mockContext, callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteStopped', expect.any(Function));
    });
  });

  describe('onSiteAdded', () => {
    it('should register siteAdded hook via convenience function', () => {
      const callback = jest.fn();
      onSiteAdded(mockContext, callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteAdded', expect.any(Function));
    });
  });

  describe('onSiteDeleted', () => {
    it('should register siteDeleted hook via convenience function', () => {
      const callback = jest.fn();
      onSiteDeleted(mockContext, callback);

      expect(mockHooksAddAction).toHaveBeenCalledWith('siteDeleted', expect.any(Function));
    });
  });
});

describe('Error handling', () => {
  let mockContext: AddonMainContext;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockContext = {
      hooks: {
        addAction: jest.fn(),
      },
      electron: {
        ipcMain: {
          handle: jest.fn(),
          on: jest.fn(),
        },
      },
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should log errors to console when logger is unavailable', async () => {
    // Override getServices to throw
    const ServiceContainer = require('../../../src/core/ServiceContainer');
    ServiceContainer.getServices.mockImplementationOnce(() => {
      throw new Error('Logger not available');
    });

    const manager = new LifecycleManager(mockContext);
    const callback = jest.fn().mockRejectedValue(new Error('Test error'));

    manager.onSiteStarted(callback);

    const wrappedHandler = (mockContext.hooks.addAction as jest.Mock).mock.calls[0][1];
    await wrappedHandler({ id: 'test' });

    // Should fall back to console.error
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

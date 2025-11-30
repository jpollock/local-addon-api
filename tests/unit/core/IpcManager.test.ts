/**
 * Tests for IpcManager module
 */

import {
  createIpcHandler,
  createSimpleIpcHandler,
  removeIpcHandler,
  IpcManager,
} from '../../../src/core/IpcManager';

// Mock the ServiceContainer
jest.mock('../../../src/core/ServiceContainer', () => ({
  getServices: jest.fn(() => ({
    localLogger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  })),
}));

describe('createIpcHandler', () => {
  let mockIpcMain: {
    handle: jest.Mock;
    on: jest.Mock;
    removeHandler: jest.Mock;
  };

  beforeEach(() => {
    mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
      removeHandler: jest.fn(),
    };
  });

  it('should register a handler on the channel', () => {
    createIpcHandler(mockIpcMain, 'test:channel', async () => ({ success: true, data: 'ok' }));

    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:channel', expect.any(Function));
  });

  it('should return success response when handler succeeds', async () => {
    createIpcHandler(mockIpcMain, 'test:channel', async () => ({ success: true, data: 'result' }));

    // Get the registered handler
    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: true, data: 'result' });
  });

  it('should return error response when handler returns error', async () => {
    createIpcHandler(mockIpcMain, 'test:channel', async () => ({ success: false, error: 'Something went wrong' }));

    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: false, error: 'Something went wrong' });
  });

  it('should catch and return error when handler throws', async () => {
    createIpcHandler(mockIpcMain, 'test:channel', async () => {
      throw new Error('Handler crashed');
    });

    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: false, error: 'Handler crashed' });
  });

  it('should return Unknown error for non-Error throws', async () => {
    createIpcHandler(mockIpcMain, 'test:channel', async () => {
      throw 'string error';
    });

    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: false, error: 'Unknown error occurred' });
  });

  describe('with validator', () => {
    it('should pass validated request to handler', async () => {
      const handler = jest.fn(async () => ({ success: true, data: 'ok' }));
      const validator = jest.fn((req) => req.valid ? req : null);

      createIpcHandler(mockIpcMain, 'test:channel', handler, validator);

      const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
      await registeredHandler({}, { valid: true, id: 123 });

      expect(validator).toHaveBeenCalledWith({ valid: true, id: 123 });
      expect(handler).toHaveBeenCalledWith({ valid: true, id: 123 });
    });

    it('should return error for invalid request', async () => {
      const handler = jest.fn(async () => ({ success: true, data: 'ok' }));
      const validator = jest.fn(() => null);

      createIpcHandler(mockIpcMain, 'test:channel', handler, validator);

      const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
      const result = await registeredHandler({}, { invalid: true });

      expect(result).toEqual({ success: false, error: 'Invalid request format' });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('createSimpleIpcHandler', () => {
  let mockIpcMain: {
    handle: jest.Mock;
    on: jest.Mock;
    removeHandler: jest.Mock;
  };

  beforeEach(() => {
    mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
      removeHandler: jest.fn(),
    };
  });

  it('should register a handler on the channel', () => {
    createSimpleIpcHandler(mockIpcMain, 'test:channel', async () => ({ data: 'result' }));

    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:channel', expect.any(Function));
  });

  it('should wrap result in success response', async () => {
    createSimpleIpcHandler(mockIpcMain, 'test:channel', async () => ({ foo: 'bar' }));

    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('should catch and return error when handler throws', async () => {
    createSimpleIpcHandler(mockIpcMain, 'test:channel', async () => {
      throw new Error('Simple handler crashed');
    });

    const registeredHandler = mockIpcMain.handle.mock.calls[0][1];
    const result = await registeredHandler({}, { param: 'value' });

    expect(result).toEqual({ success: false, error: 'Simple handler crashed' });
  });
});

describe('removeIpcHandler', () => {
  it('should call removeHandler on ipcMain', () => {
    const mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
      removeHandler: jest.fn(),
    };

    removeIpcHandler(mockIpcMain, 'test:channel');

    expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('test:channel');
  });

  it('should handle ipcMain without removeHandler method', () => {
    const mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
    };

    // Should not throw
    expect(() => removeIpcHandler(mockIpcMain, 'test:channel')).not.toThrow();
  });
});

describe('IpcManager class', () => {
  let mockIpcMain: {
    handle: jest.Mock;
    on: jest.Mock;
    removeHandler: jest.Mock;
  };
  let manager: IpcManager;

  beforeEach(() => {
    mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
      removeHandler: jest.fn(),
    };
    manager = new IpcManager(mockIpcMain);
  });

  describe('handle', () => {
    it('should register handler and track channel', () => {
      manager.handle('test:channel', async () => ({ success: true, data: 'ok' }));

      expect(mockIpcMain.handle).toHaveBeenCalledWith('test:channel', expect.any(Function));
      expect(manager.getRegisteredChannels()).toContain('test:channel');
    });

    it('should support validator parameter', () => {
      const validator = jest.fn((req) => req);
      manager.handle('test:channel', async () => ({ success: true, data: 'ok' }), validator);

      expect(mockIpcMain.handle).toHaveBeenCalled();
    });
  });

  describe('handleSimple', () => {
    it('should register simple handler and track channel', () => {
      manager.handleSimple('test:simple', async () => ({ foo: 'bar' }));

      expect(mockIpcMain.handle).toHaveBeenCalledWith('test:simple', expect.any(Function));
      expect(manager.getRegisteredChannels()).toContain('test:simple');
    });
  });

  describe('remove', () => {
    it('should remove handler and untrack channel', () => {
      manager.handle('test:channel', async () => ({ success: true, data: 'ok' }));
      manager.remove('test:channel');

      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('test:channel');
      expect(manager.getRegisteredChannels()).not.toContain('test:channel');
    });
  });

  describe('removeAll', () => {
    it('should remove all registered handlers', () => {
      manager.handle('channel1', async () => ({ success: true, data: 'ok' }));
      manager.handle('channel2', async () => ({ success: true, data: 'ok' }));
      manager.handleSimple('channel3', async () => ({}));

      manager.removeAll();

      expect(mockIpcMain.removeHandler).toHaveBeenCalledTimes(3);
      expect(manager.getRegisteredChannels()).toHaveLength(0);
    });
  });

  describe('getRegisteredChannels', () => {
    it('should return all registered channel names', () => {
      manager.handle('channel1', async () => ({ success: true, data: 'ok' }));
      manager.handleSimple('channel2', async () => ({}));

      const channels = manager.getRegisteredChannels();

      expect(channels).toContain('channel1');
      expect(channels).toContain('channel2');
      expect(channels).toHaveLength(2);
    });

    it('should return empty array when no handlers registered', () => {
      expect(manager.getRegisteredChannels()).toEqual([]);
    });
  });
});

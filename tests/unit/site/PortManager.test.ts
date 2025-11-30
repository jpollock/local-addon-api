/**
 * Tests for PortManager module
 */

import { PortManager, portManager } from '../../../src/site/PortManager';

// Mock the ServiceContainer
const mockGetServices = jest.fn();
jest.mock('../../../src/core/ServiceContainer', () => ({
  getServices: () => mockGetServices(),
}));

describe('PortManager', () => {
  let manager: PortManager;
  let mockPorts: {
    getAvailablePort: jest.Mock;
  };

  beforeEach(() => {
    mockPorts = {
      getAvailablePort: jest.fn(),
    };

    mockGetServices.mockReturnValue({
      ports: mockPorts,
    });

    manager = new PortManager();
  });

  describe('getAvailablePort', () => {
    it('should get an available port from Local', async () => {
      mockPorts.getAvailablePort.mockResolvedValue(3000);

      const port = await manager.getAvailablePort();

      expect(port).toBe(3000);
      expect(mockPorts.getAvailablePort).toHaveBeenCalled();
    });

    it('should track allocated ports', async () => {
      mockPorts.getAvailablePort.mockResolvedValue(3000);

      await manager.getAvailablePort();

      expect(manager.isAllocated(3000)).toBe(true);
      expect(manager.getAllocatedPorts()).toContain(3000);
    });

    it('should track multiple allocated ports', async () => {
      mockPorts.getAvailablePort
        .mockResolvedValueOnce(3000)
        .mockResolvedValueOnce(3001)
        .mockResolvedValueOnce(3002);

      await manager.getAvailablePort();
      await manager.getAvailablePort();
      await manager.getAvailablePort();

      expect(manager.getAllocatedPorts()).toContain(3000);
      expect(manager.getAllocatedPorts()).toContain(3001);
      expect(manager.getAllocatedPorts()).toContain(3002);
      expect(manager.getAllocatedPorts()).toHaveLength(3);
    });
  });

  describe('releasePort', () => {
    it('should remove port from tracking', async () => {
      mockPorts.getAvailablePort.mockResolvedValue(3000);

      await manager.getAvailablePort();
      expect(manager.isAllocated(3000)).toBe(true);

      manager.releasePort(3000);
      expect(manager.isAllocated(3000)).toBe(false);
    });

    it('should handle releasing non-allocated port', () => {
      // Should not throw
      expect(() => manager.releasePort(9999)).not.toThrow();
    });
  });

  describe('getAllocatedPorts', () => {
    it('should return empty array when no ports allocated', () => {
      expect(manager.getAllocatedPorts()).toEqual([]);
    });

    it('should return all allocated ports', async () => {
      mockPorts.getAvailablePort
        .mockResolvedValueOnce(3000)
        .mockResolvedValueOnce(3001);

      await manager.getAvailablePort();
      await manager.getAvailablePort();

      const ports = manager.getAllocatedPorts();
      expect(ports).toHaveLength(2);
      expect(ports).toContain(3000);
      expect(ports).toContain(3001);
    });
  });

  describe('isAllocated', () => {
    it('should return false for non-allocated port', () => {
      expect(manager.isAllocated(3000)).toBe(false);
    });

    it('should return true for allocated port', async () => {
      mockPorts.getAvailablePort.mockResolvedValue(3000);
      await manager.getAvailablePort();

      expect(manager.isAllocated(3000)).toBe(true);
    });
  });

  describe('clearAllocations', () => {
    it('should clear all tracked allocations', async () => {
      mockPorts.getAvailablePort
        .mockResolvedValueOnce(3000)
        .mockResolvedValueOnce(3001);

      await manager.getAvailablePort();
      await manager.getAvailablePort();
      expect(manager.getAllocatedPorts()).toHaveLength(2);

      manager.clearAllocations();
      expect(manager.getAllocatedPorts()).toHaveLength(0);
    });
  });
});

describe('portManager singleton', () => {
  it('should be a PortManager instance', () => {
    expect(portManager).toBeInstanceOf(PortManager);
  });
});

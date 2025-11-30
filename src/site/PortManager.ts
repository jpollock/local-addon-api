/**
 * PortManager - Port allocation utilities
 *
 * Provides methods for allocating available ports for Node.js apps.
 */

import { getServices } from '../core/ServiceContainer';

/**
 * PortManager - Manages port allocation
 *
 * @example
 * ```typescript
 * const portManager = new PortManager();
 * const port = await portManager.getAvailablePort();
 * console.log(`Using port: ${port}`);
 * ```
 */
export class PortManager {
  private allocatedPorts: Set<number> = new Set();

  /**
   * Get an available port from Local's port service
   */
  async getAvailablePort(): Promise<number> {
    const { ports } = getServices();
    const port = await ports.getAvailablePort();
    this.allocatedPorts.add(port);
    return port;
  }

  /**
   * Release a previously allocated port
   *
   * Note: This only removes it from our internal tracking.
   * The port may still be in use by a running process.
   */
  releasePort(port: number): void {
    this.allocatedPorts.delete(port);
  }

  /**
   * Get all ports that have been allocated
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.allocatedPorts);
  }

  /**
   * Check if a port was allocated by this manager
   */
  isAllocated(port: number): boolean {
    return this.allocatedPorts.has(port);
  }

  /**
   * Clear all tracked allocations
   */
  clearAllocations(): void {
    this.allocatedPorts.clear();
  }
}

// Default instance
export const portManager = new PortManager();

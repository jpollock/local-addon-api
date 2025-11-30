/**
 * IpcManager - Standardized IPC handler creation for Local addons
 *
 * Provides utilities for creating type-safe IPC handlers with automatic
 * error handling and request validation.
 */

import type { Result, IpcResponse } from '../types';
import { getServices } from './ServiceContainer';

/**
 * IPC handler function type
 */
export type IpcHandler<TReq, TRes> = (request: TReq) => Promise<Result<TRes>>;

/**
 * Request validator function type
 */
export type RequestValidator<TReq> = (request: unknown) => TReq | null;

/**
 * Electron IpcMain interface
 */
interface IpcMain {
  handle(channel: string, handler: (event: unknown, ...args: unknown[]) => unknown): void;
  on(channel: string, handler: (event: unknown, ...args: unknown[]) => void): void;
  removeHandler?(channel: string): void;
}

/**
 * Create a standardized IPC handler with automatic error handling
 *
 * @param ipcMain - Electron's ipcMain instance
 * @param channel - IPC channel name
 * @param handler - Handler function that returns a Result
 * @param validator - Optional request validator
 *
 * @example
 * ```typescript
 * createIpcHandler(
 *   ipcMain,
 *   'my-addon:get-data',
 *   async (request: GetDataRequest) => {
 *     const data = await fetchData(request.id);
 *     return { success: true, data };
 *   },
 *   (req) => GetDataRequestSchema.safeParse(req).success ? req : null
 * );
 * ```
 */
export function createIpcHandler<TReq, TRes>(
  ipcMain: IpcMain,
  channel: string,
  handler: IpcHandler<TReq, TRes>,
  validator?: RequestValidator<TReq>
): void {
  ipcMain.handle(channel, async (_event: unknown, request: unknown): Promise<IpcResponse<TRes>> => {
    try {
      // Validate request if validator provided
      let validatedRequest: TReq;
      if (validator) {
        const validated = validator(request);
        if (validated === null) {
          return { success: false, error: 'Invalid request format' };
        }
        validatedRequest = validated;
      } else {
        validatedRequest = request as TReq;
      }

      // Execute handler
      const result = await handler(validatedRequest);

      // Convert Result to IpcResponse
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Log error
      try {
        const { localLogger } = getServices();
        localLogger.error(`[IpcManager] Error in handler for ${channel}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      } catch {
        console.error(`[IpcManager] Error in handler for ${channel}:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });
}

/**
 * Create a simple IPC handler that doesn't use the Result pattern
 *
 * @param ipcMain - Electron's ipcMain instance
 * @param channel - IPC channel name
 * @param handler - Handler function that returns data directly
 *
 * @example
 * ```typescript
 * createSimpleIpcHandler(
 *   ipcMain,
 *   'my-addon:ping',
 *   async () => ({ timestamp: Date.now() })
 * );
 * ```
 */
export function createSimpleIpcHandler<TReq, TRes>(
  ipcMain: IpcMain,
  channel: string,
  handler: (request: TReq) => Promise<TRes>
): void {
  ipcMain.handle(channel, async (_event: unknown, request: unknown): Promise<IpcResponse<TRes>> => {
    try {
      const data = await handler(request as TReq);
      return { success: true, data };
    } catch (error) {
      try {
        const { localLogger } = getServices();
        localLogger.error(`[IpcManager] Error in simple handler for ${channel}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      } catch {
        console.error(`[IpcManager] Error in simple handler for ${channel}:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });
}

/**
 * Remove an IPC handler
 *
 * @param ipcMain - Electron's ipcMain instance
 * @param channel - IPC channel name to remove
 */
export function removeIpcHandler(ipcMain: IpcMain, channel: string): void {
  if (ipcMain.removeHandler) {
    ipcMain.removeHandler(channel);
  }
}

/**
 * IpcManager class for managing multiple handlers
 *
 * @example
 * ```typescript
 * const ipc = new IpcManager(ipcMain);
 *
 * ipc.handle('my-addon:get-data', async (req) => {
 *   return { success: true, data: await getData(req.id) };
 * });
 *
 * ipc.handleSimple('my-addon:ping', async () => ({
 *   timestamp: Date.now()
 * }));
 * ```
 */
export class IpcManager {
  private ipcMain: IpcMain;
  private registeredChannels: Set<string> = new Set();

  constructor(ipcMain: IpcMain) {
    this.ipcMain = ipcMain;
  }

  /**
   * Register a handler with Result pattern
   */
  handle<TReq, TRes>(
    channel: string,
    handler: IpcHandler<TReq, TRes>,
    validator?: RequestValidator<TReq>
  ): void {
    createIpcHandler(this.ipcMain, channel, handler, validator);
    this.registeredChannels.add(channel);
  }

  /**
   * Register a simple handler
   */
  handleSimple<TReq, TRes>(
    channel: string,
    handler: (request: TReq) => Promise<TRes>
  ): void {
    createSimpleIpcHandler(this.ipcMain, channel, handler);
    this.registeredChannels.add(channel);
  }

  /**
   * Remove a handler
   */
  remove(channel: string): void {
    removeIpcHandler(this.ipcMain, channel);
    this.registeredChannels.delete(channel);
  }

  /**
   * Remove all registered handlers
   */
  removeAll(): void {
    for (const channel of this.registeredChannels) {
      removeIpcHandler(this.ipcMain, channel);
    }
    this.registeredChannels.clear();
  }

  /**
   * Get all registered channel names
   */
  getRegisteredChannels(): string[] {
    return Array.from(this.registeredChannels);
  }
}

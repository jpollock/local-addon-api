/**
 * Renderer context type definitions
 */

import type * as Local from '@getflywheel/local';
import type React from 'react';

/**
 * Local's hook registration interface for renderer plugins
 */
export interface LocalHooks {
  addContent(hookName: string, component: React.ComponentType<LocalSiteProps>): void;
  addFilter?(filterName: string, callback: (value: unknown) => unknown): void;
  getContentAreas?(): string[];
}

/**
 * Props passed to components registered with Local hooks
 */
export interface LocalSiteProps {
  site: Local.Site;
}

/**
 * Electron IPC interface available in renderer
 */
export interface LocalElectron {
  ipcRenderer: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    on(channel: string, listener: (...args: unknown[]) => void): void;
    send(channel: string, ...args: unknown[]): void;
  };
}

/**
 * Context object passed to renderer addon entry point
 */
export interface RendererContext {
  React: typeof React;
  hooks: LocalHooks;
  electron?: LocalElectron;
}

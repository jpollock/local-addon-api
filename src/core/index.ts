/**
 * Core module exports
 */

// Service container
export { ServiceContainer, getServices } from './ServiceContainer';

// Lifecycle management
export {
  LifecycleManager,
  onSiteStarted,
  onSiteStopped,
  onSiteAdded,
  onSiteDeleted,
} from './LifecycleManager';
export type { HookCallback, AddonMainContext } from './LifecycleManager';

// IPC management
export {
  IpcManager,
  createIpcHandler,
  createSimpleIpcHandler,
  removeIpcHandler,
} from './IpcManager';
export type { IpcHandler, RequestValidator } from './IpcManager';

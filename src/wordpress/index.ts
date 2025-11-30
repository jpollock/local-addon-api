/**
 * WordPress integration module
 *
 * Provides APIs for managing WordPress plugins within Local sites:
 * - WordPressPluginManager - Multi-source plugin installation
 * - WpCliManager - WP-CLI command execution
 * - WordPressEnvManager - WordPress environment variable extraction
 * - ZipPluginInstaller - Zip file handling for plugin installation
 * - BundledPluginDetector - Detection of bundled plugins in repos
 */

export { WordPressPluginManager } from './WordPressPluginManager';
export type {
  PluginInstallProgress,
} from './WordPressPluginManager';

export { WpCliManager } from './WpCliManager';
export type {
  WpCliResult,
  PluginInfo,
} from './WpCliManager';

export { WordPressEnvManager } from './WordPressEnvManager';
export type {
  WordPressEnv,
} from './WordPressEnvManager';

export { ZipPluginInstaller } from './ZipPluginInstaller';
export type {
  ZipDownloadProgress,
  ZipInstallResult,
} from './ZipPluginInstaller';

export { BundledPluginDetector } from './BundledPluginDetector';
export type {
  DetectionResult,
} from './BundledPluginDetector';

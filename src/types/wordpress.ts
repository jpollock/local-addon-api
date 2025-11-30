/**
 * WordPress integration type definitions
 */

/**
 * WordPress environment variables
 */
export interface WordPressEnv {
  WP_DB_HOST: string;
  WP_DB_NAME: string;
  WP_DB_USER: string;
  WP_DB_PASSWORD: string;
  WP_SITE_URL: string;
  WP_HOME_URL: string;
  WP_ADMIN_URL: string;
  WP_CONTENT_DIR: string;
  WP_UPLOADS_DIR: string;
  DATABASE_URL?: string;
}

/**
 * Plugin installation source types
 */
export type PluginSource = 'git' | 'bundled' | 'zip' | 'wporg';

/**
 * WordPress plugin definition
 */
export interface WordPressPlugin {
  id: string;
  name: string;
  slug: string;           // Directory name in wp-content/plugins
  source: PluginSource;   // Installation source
  status: 'installing' | 'installed' | 'active' | 'inactive' | 'error';
  installedPath: string;
  version?: string;
  error?: string;
  autoActivate?: boolean; // Whether to auto-activate on site start
  createdAt: Date;
  updatedAt?: Date;

  // Source-specific fields (optional based on source type)
  gitUrl?: string;        // For git and bundled sources
  branch?: string;        // For git source
  zipUrl?: string;        // For zip source
  bundledPath?: string;   // For bundled source (path within node app repo)
}

/**
 * Site WordPress plugins container
 */
export interface SiteWordPressPlugins {
  siteId: string;
  plugins: WordPressPlugin[];
}

/**
 * Plugin config input type - allows optional autoActivate
 * This is more flexible than the strict PluginConfig for function parameters
 */
export type PluginConfigInput = {
  slug: string;
  autoActivate?: boolean;
  name?: string;
} & (
  | { source: 'bundled'; path: string }
  | { source: 'git'; url: string; branch?: string }
  | { source: 'zip'; url: string; checksum?: string }
  | { source: 'wporg'; version?: string }
);

/**
 * Bundled plugin configuration (path within repository)
 */
export interface BundledPluginConfig {
  source: 'bundled';
  slug: string;
  path: string;
  autoActivate?: boolean;
}

/**
 * Git-based plugin configuration
 */
export interface GitPluginConfig {
  source: 'git';
  slug: string;
  url: string;
  branch: string;
  autoActivate?: boolean;
}

/**
 * Zip file plugin configuration
 */
export interface ZipPluginConfig {
  source: 'zip';
  slug: string;
  url: string;
  checksum?: string;
  autoActivate?: boolean;
}

/**
 * WordPress.org plugin configuration
 */
export interface WpOrgPluginConfig {
  source: 'wporg';
  slug: string;
  version?: string;
  autoActivate?: boolean;
}

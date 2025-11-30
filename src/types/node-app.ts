/**
 * Node.js application type definitions
 */

/**
 * Node app status
 */
export type NodeAppStatus =
  | 'stopped'
  | 'cloning'
  | 'installing'
  | 'building'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error'
  | 'restarting';

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  endpoint: string;     // /health
  interval: number;     // milliseconds
  timeout: number;      // milliseconds
  retries: number;
}

/**
 * Node.js application definition
 */
export interface NodeApp {
  id: string;
  name: string;
  gitUrl: string;
  branch: string;
  path?: string;                // Where it's cloned (alias for localPath)
  localPath?: string;           // Where it's cloned (deprecated, use path)
  installCommand: string;       // npm install, yarn, pnpm install
  buildCommand?: string;        // npm run build
  startCommand: string;         // npm start, node index.js
  port?: number;                // Allocated port
  nodeVersion: string;          // 18.x, 20.x, etc.
  env: Record<string, string>;
  status: NodeAppStatus;
  autoStart: boolean;
  injectWpEnv: boolean;         // Auto-inject WordPress environment variables
  lastError?: string;
  pid?: number;
  startedAt?: Date;
  createdAt?: Date;             // When the app was added
  updatedAt?: Date;             // When the app was last updated
  bundledPlugins?: string[];    // IDs of WordPress plugins bundled with this app
  healthCheck?: HealthCheckConfig;
  logs?: string[];
}

/**
 * Site Node apps container
 */
export interface SiteNodeApps {
  siteId: string;
  apps: NodeApp[];
}

/**
 * Node app configuration
 */
export interface NodeAppConfig {
  defaultNodeVersion: string;
  defaultInstallCommand: string;
  defaultStartCommand: string;
  defaultBranch: string;
  healthCheckInterval: number;
  maxRestarts: number;
  restartDelay: number;
  logMaxLines: number;
  nodeBinPaths: Record<string, string>; // version -> path
}

/**
 * Git configuration
 */
export interface GitConfig {
  url: string;
  branch: string;
  auth?: {
    type: 'ssh' | 'https' | 'token';
    token?: string;
    sshKey?: string;
  };
}

/**
 * Process information
 */
export interface ProcessInfo {
  pid: number;
  status: 'running' | 'stopped';
  cpu: number;
  memory: number;
  uptime: number;
}

# @local-labs/local-addon-api

Comprehensive addon development toolkit for Local by Flywheel. Provides APIs for Node.js app orchestration, WordPress plugin management, site lifecycle management, and shared utilities.

## Installation

```bash
npm install @local-labs/local-addon-api
```

## Quick Start

```typescript
import {
  ServiceContainer,
  LifecycleManager,
  onSiteStarted,
  createIpcHandler,
  SiteManager,
  WordPressPluginManager,
  GitManager,
  ok, err
} from '@local-labs/local-addon-api';

// Initialize service container (main process)
const services = ServiceContainer.initialize(context);

// Register lifecycle hooks
onSiteStarted(async (site) => {
  console.log(`Site ${site.name} started`);
});

// Create IPC handlers
createIpcHandler('my-addon:getData', async (request) => {
  return ok({ data: 'Hello from addon' });
});
```

## Modules

### Core Module

Service container, lifecycle management, and IPC handling.

```typescript
import {
  ServiceContainer,
  getServices,
  LifecycleManager,
  onSiteStarted,
  onSiteStopped,
  IpcManager,
  createIpcHandler,
  createSimpleIpcHandler
} from '@local-labs/local-addon-api';
```

### Site Module

Site data access, database operations, and port management.

```typescript
import {
  SiteManager,
  siteManager,
  DatabaseManager,
  PortManager,
  portManager
} from '@local-labs/local-addon-api';

// Get site information
const site = siteManager.getSite(siteId);
const isRunning = siteManager.isSiteRunning(siteId);
```

### WordPress Module

WordPress plugin installation and WP-CLI integration.

```typescript
import {
  WordPressPluginManager,
  WpCliManager,
  WordPressEnvManager,
  ZipPluginInstaller,
  BundledPluginDetector
} from '@local-labs/local-addon-api';

// Install a plugin from various sources
const pluginManager = new WordPressPluginManager(services);

// From bundled (local path)
await pluginManager.installPlugin(site, {
  source: 'bundled',
  slug: 'my-plugin',
  path: 'plugins/my-plugin'
});

// From git
await pluginManager.installPlugin(site, {
  source: 'git',
  slug: 'my-plugin',
  url: 'https://github.com/user/repo.git',
  branch: 'main'
});

// From WordPress.org
await pluginManager.installPlugin(site, {
  source: 'wporg',
  slug: 'woocommerce'
});

// From zip URL
await pluginManager.installPlugin(site, {
  source: 'zip',
  slug: 'my-plugin',
  url: 'https://example.com/plugin.zip'
});
```

### Node Module

Git repository management, npm/yarn/pnpm detection, and configuration persistence.

```typescript
import {
  GitManager,
  NpmManager,
  ConfigManager
} from '@local-labs/local-addon-api';

// Clone a repository
const gitManager = new GitManager();
const result = await gitManager.cloneRepository({
  url: 'https://github.com/user/repo.git',
  branch: 'main',
  targetPath: '/path/to/target'
});

// Detect and run npm commands
const npmManager = new NpmManager();
const info = await npmManager.getNpmInfo();
await npmManager.runCommand(['install'], { cwd: '/path/to/project' });
```

### Utils Module

Validation, logging, error handling, and constants.

```typescript
import {
  validateCommand,
  validatePath,
  isValidPluginSlug,
  isValidGitUrl,
  getErrorMessage,
  logger,
  TIMEOUTS,
  LIMITS
} from '@local-labs/local-addon-api';

// Validate commands to prevent injection
const result = validateCommand('npm start');
if (!result.valid) {
  console.error(result.error);
}

// Validate plugin slugs
if (isValidPluginSlug('my-plugin')) {
  // Safe to use
}
```

### Types Module

TypeScript type definitions and Result pattern helpers.

```typescript
import type {
  NodeApp,
  WordPressPlugin,
  LocalServices,
  Result
} from '@local-labs/local-addon-api';

import { ok, err } from '@local-labs/local-addon-api';

// Use Result pattern for explicit error handling
function divide(a: number, b: number): Result<number> {
  if (b === 0) return err('Division by zero');
  return ok(a / b);
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.data); // 5
} else {
  console.error(result.error);
}
```

### Schemas Module

Zod schemas for configuration validation.

```typescript
import {
  PluginConfigSchema,
  NodeOrchestratorConfigSchema
} from '@local-labs/local-addon-api';

// Validate configuration file
const config = NodeOrchestratorConfigSchema.safeParse(jsonData);
if (config.success) {
  // config.data is typed
}
```

## Security

This library includes built-in security validation to prevent:

- **Command Injection**: `validateCommand()` blocks dangerous executables and shell metacharacters
- **Path Traversal**: `validatePath()`, `validateAppPath()` prevent directory escape attacks
- **Git URL Injection**: `isValidGitUrl()` validates URL schemes and blocks malicious patterns
- **WP-CLI Injection**: Command whitelisting prevents arbitrary WP-CLI execution
- **Zip Slip**: `ZipPluginInstaller` validates extraction paths

```typescript
import {
  validateCommand,
  validatePath,
  isValidPluginSlug,
  isValidGitUrl,
  isValidBranchName
} from '@local-labs/local-addon-api';

// Always validate user input
const cmdResult = validateCommand(userInput);
if (!cmdResult.valid) {
  throw new Error(cmdResult.error);
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run security-critical tests only
npm run test:security

# Generate API documentation
npm run docs
```

## License

MIT

# Example Local Addon

This example demonstrates how to build a Local addon using the `@local-labs/local-addon-api` library.

## Features Demonstrated

### Main Process (`src/main.ts`)

- **LifecycleManager**: Register callbacks for site lifecycle events
  - `onSiteStarted` - Called when a site starts
  - `onSiteStopped` - Called when a site stops
  - `onSiteAdded` - Called when a new site is created
  - `onSiteDeleted` - Called when a site is deleted

- **IpcManager**: Create type-safe IPC handlers
  - `handle()` - Create handlers using the Result pattern
  - `handleSimple()` - Create handlers that return data directly
  - Request validation support

- **SiteManager**: Access site information
  - Get site by ID
  - Check if site is running
  - Get WordPress paths (plugins, wp-content)

- **WordPressPluginManager**: Manage WordPress plugins
  - Install from WordPress.org
  - Install from Git repositories
  - Install bundled plugins
  - Activate/deactivate plugins

- **WpCliManager**: Run WP-CLI commands securely
  - Command validation
  - Whitelisted commands only

- **PortManager**: Allocate ports for Node.js apps
  - Get available ports
  - Track allocations

- **ConfigManager**: Persist addon configuration
  - Per-site configuration storage
  - Cache management

### Renderer Process (`src/renderer.tsx`)

- React component for the addon UI
- IPC communication with main process
- Site information display
- WP-CLI command execution
- Plugin installation UI
- Plugin list display

## Installation

```bash
# From the example directory
npm install
npm run build
```

## Development

```bash
# Watch for changes and rebuild
npm run watch
```

## Project Structure

```
local-addon-example/
├── package.json
├── tsconfig.json
├── .nodeorchestrator.json   # Example config for Node orchestrator
├── src/
│   ├── main.ts              # Main process entry point
│   └── renderer.tsx         # Renderer process component
└── lib/                     # Compiled output
    ├── main.js
    └── renderer.js
```

## Configuration File

The `.nodeorchestrator.json` file demonstrates the configuration format for:

- Node.js app settings (start command, port, auto-start)
- WordPress plugin configurations (bundled, wporg, git sources)

```json
{
  "node": {
    "startCommand": "npm start",
    "autoStart": true,
    "port": 3000
  },
  "wordpress": {
    "plugins": [
      {
        "source": "bundled",
        "slug": "my-plugin",
        "path": "wp-plugin"
      }
    ]
  }
}
```

## IPC Channels

| Channel | Description | Request | Response |
|---------|-------------|---------|----------|
| `example-addon:get-site-info` | Get site information | `{ siteId }` | Site info object |
| `example-addon:install-plugin` | Install a WordPress plugin | `{ siteId, pluginSlug, source }` | Plugin info |
| `example-addon:run-wp-cli` | Run WP-CLI command | `{ siteId, command }` | `{ output }` |
| `example-addon:get-port` | Get allocated port | `{ siteId }` | `{ port }` |
| `example-addon:list-plugins` | List installed plugins | `{ siteId }` | `{ plugins }` |

## Security Notes

- All WP-CLI commands are validated before execution
- Plugin slugs are validated to prevent injection
- Git URLs are validated for allowed protocols
- Path traversal is prevented in bundled plugin paths

## Learn More

- [local-addon-api Documentation](../../README.md)
- [Local Addon Development](https://localwp.com/help-docs/advanced/how-to-create-a-local-add-on/)

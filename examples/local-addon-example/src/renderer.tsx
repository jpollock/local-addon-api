/**
 * Example Local Addon - Renderer Process
 *
 * Demonstrates UI components and IPC communication with the main process.
 * This file runs in the renderer (browser) process.
 */

import * as React from 'react';

// Local provides these through the renderer context
const { ipcRenderer } = require('electron');

// ============================================================================
// Types
// ============================================================================

interface Site {
  id: string;
  name: string;
  path: string;
  domain: string;
}

interface SiteInfo {
  id: string;
  name: string;
  isRunning: boolean;
  pluginsPath: string;
  siteUrl: string;
}

interface Plugin {
  name: string;
  status: string;
  version?: string;
}

interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// IPC Helpers
// ============================================================================

async function invoke<T>(channel: string, data?: any): Promise<T> {
  const response: IpcResponse<T> = await ipcRenderer.invoke(channel, data);
  if (response.success) {
    return response.data as T;
  }
  throw new Error(response.error || 'Unknown error');
}

// ============================================================================
// Main Component
// ============================================================================

interface ExampleAddonProps {
  site: Site;
}

interface ExampleAddonState {
  loading: boolean;
  error: string | null;
  siteInfo: SiteInfo | null;
  plugins: Plugin[];
  wpCliOutput: string;
  wpCliCommand: string;
  pluginSlug: string;
}

/**
 * Example Addon Component
 */
class ExampleAddon extends React.Component<ExampleAddonProps, ExampleAddonState> {
  private siteStatusListener: ((event: any, siteId: string, status: string) => void) | null = null;

  constructor(props: ExampleAddonProps) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      siteInfo: null,
      plugins: [],
      wpCliOutput: '',
      wpCliCommand: 'option get blogname',
      pluginSlug: 'hello-dolly',
    };
  }

  componentDidMount(): void {
    this.loadSiteInfo();

    // Listen for site status changes from Local
    this.siteStatusListener = (_event: any, siteId: string, status: string) => {
      if (siteId === this.props.site?.id) {
        console.log('[ExampleAddon] Site status changed:', status);
        this.loadSiteInfo();
      }
    };

    // Local broadcasts these events when sites start/stop
    ipcRenderer.on('site-status-changed', this.siteStatusListener);
  }

  componentWillUnmount(): void {
    if (this.siteStatusListener) {
      ipcRenderer.removeListener('site-status-changed', this.siteStatusListener);
    }
  }

  componentDidUpdate(prevProps: ExampleAddonProps): void {
    if (prevProps.site?.id !== this.props.site?.id) {
      this.loadSiteInfo();
    }
  }

  async loadSiteInfo(): Promise<void> {
    if (!this.props.site?.id) return;

    this.setState({ loading: true, error: null });

    try {
      const siteInfo = await invoke<SiteInfo>('example-addon:get-site-info', {
        siteId: this.props.site.id,
      });

      this.setState({ siteInfo, loading: false });

      if (siteInfo.isRunning) {
        await this.loadPlugins();
      }
    } catch (err: any) {
      this.setState({
        error: err.message || 'Failed to load site info',
        loading: false,
      });
    }
  }

  async loadPlugins(): Promise<void> {
    try {
      const result = await invoke<{ plugins: Plugin[] }>('example-addon:list-plugins', {
        siteId: this.props.site.id,
      });
      this.setState({ plugins: result.plugins || [] });
    } catch (err: any) {
      console.error('Failed to load plugins:', err);
    }
  }

  async runWpCli(): Promise<void> {
    const { wpCliCommand } = this.state;
    if (!wpCliCommand.trim()) return;

    this.setState({ loading: true, error: null, wpCliOutput: '' });

    try {
      const result = await invoke<{ output: string }>('example-addon:run-wp-cli', {
        siteId: this.props.site.id,
        command: wpCliCommand,
      });
      this.setState({ wpCliOutput: result.output, loading: false });
    } catch (err: any) {
      this.setState({
        error: err.message || 'WP-CLI command failed',
        loading: false,
      });
    }
  }

  async installPlugin(): Promise<void> {
    const { pluginSlug } = this.state;
    if (!pluginSlug.trim()) return;

    this.setState({ loading: true, error: null });

    try {
      await invoke('example-addon:install-plugin', {
        siteId: this.props.site.id,
        pluginSlug: pluginSlug,
        source: 'wporg',
      });

      this.setState({ loading: false });
      await this.loadPlugins();
    } catch (err: any) {
      this.setState({
        error: err.message || 'Failed to install plugin',
        loading: false,
      });
    }
  }

  render(): React.ReactNode {
    const { loading, error, siteInfo, plugins, wpCliOutput, wpCliCommand, pluginSlug } = this.state;

    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Example Addon</h2>
        <p style={{ color: '#666' }}>
          Demonstrates @local-labs/local-addon-api features.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Site Info */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0 }}>
            Site Information
            <button
              onClick={() => this.loadSiteInfo()}
              disabled={loading}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#e0e0e0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </h3>
          {siteInfo ? (
            <div>
              <div><strong>Name:</strong> {siteInfo.name}</div>
              <div><strong>Status:</strong> {siteInfo.isRunning ? '🟢 Running' : '🔴 Stopped'}</div>
              <div><strong>URL:</strong> {siteInfo.siteUrl}</div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* WP-CLI */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0 }}>WP-CLI Command</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={wpCliCommand}
              onChange={(e) => this.setState({ wpCliCommand: e.target.value })}
              placeholder="e.g., option get blogname"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              disabled={loading || !siteInfo?.isRunning}
            />
            <button
              onClick={() => this.runWpCli()}
              disabled={loading || !siteInfo?.isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: (loading || !siteInfo?.isRunning) ? 0.5 : 1
              }}
            >
              Run
            </button>
          </div>
          {!siteInfo?.isRunning && (
            <p style={{ color: '#f57c00', fontSize: '12px', margin: 0 }}>
              Start the site to run WP-CLI commands
            </p>
          )}
          {wpCliOutput && (
            <pre style={{
              backgroundColor: '#263238',
              color: '#aed581',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '150px',
              marginTop: '8px'
            }}>
              {wpCliOutput}
            </pre>
          )}
        </div>

        {/* Install Plugin */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0 }}>Install Plugin</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={pluginSlug}
              onChange={(e) => this.setState({ pluginSlug: e.target.value })}
              placeholder="Plugin slug (e.g., hello-dolly)"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              disabled={loading || !siteInfo?.isRunning}
            />
            <button
              onClick={() => this.installPlugin()}
              disabled={loading || !siteInfo?.isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: (loading || !siteInfo?.isRunning) ? 0.5 : 1
              }}
            >
              Install
            </button>
          </div>
        </div>

        {/* Plugins List */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>
            Installed Plugins ({plugins.length})
            <button
              onClick={() => this.loadPlugins()}
              disabled={loading || !siteInfo?.isRunning}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#e0e0e0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </h3>
          {plugins.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {plugins.map((plugin, i) => (
                <li key={i}>
                  {plugin.name}
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    backgroundColor: plugin.status === 'active' ? '#4caf50' : '#9e9e9e',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '10px'
                  }}>
                    {plugin.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666', margin: 0 }}>
              {siteInfo?.isRunning ? 'No plugins found' : 'Start site to view plugins'}
            </p>
          )}
        </div>
      </div>
    );
  }
}

// ============================================================================
// Export for Local's addon system
// ============================================================================

export default function (context: any): void {
  const { hooks } = context;

  // Register the addon component in the site overview section
  // Available hooks: 'SiteInfoOverview', 'siteInfoUtilities', 'stylesheets'
  hooks.addContent('SiteInfoOverview', (site: Site) => (
    <ExampleAddon key="example-addon" site={site} />
  ));
}

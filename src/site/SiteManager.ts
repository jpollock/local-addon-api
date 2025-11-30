/**
 * SiteManager - Wrapper around Local's site data service
 *
 * Provides convenient access to site information and status.
 */

import type * as Local from '@getflywheel/local';
import type { SiteStatus } from '../types';
import { getServices } from '../core/ServiceContainer';

/**
 * SiteManager - Manages site data access
 *
 * @example
 * ```typescript
 * const siteManager = new SiteManager();
 * const site = siteManager.getSite(siteId);
 * if (site && siteManager.isRunning(site)) {
 *   console.log('Site is running');
 * }
 * ```
 */
export class SiteManager {
  /**
   * Get a site by ID
   */
  getSite(siteId: string): Local.Site | undefined {
    const { siteData } = getServices();
    return siteData.getSite(siteId);
  }

  /**
   * Get all sites
   */
  getSites(): Local.Site[] {
    const { siteData } = getServices();
    return siteData.getSites();
  }

  /**
   * Get site status
   */
  getStatus(site: Local.Site): SiteStatus {
    const { siteProcessManager } = getServices();
    return siteProcessManager.getSiteStatus(site);
  }

  /**
   * Check if site is running
   */
  isRunning(site: Local.Site): boolean {
    return this.getStatus(site) === 'running';
  }

  /**
   * Check if site is stopped
   */
  isStopped(site: Local.Site): boolean {
    return this.getStatus(site) === 'stopped';
  }

  /**
   * Start a site
   */
  async start(site: Local.Site): Promise<void> {
    const { siteProcessManager } = getServices();
    await siteProcessManager.start(site);
  }

  /**
   * Stop a site
   */
  async stop(site: Local.Site, options?: { dumpDatabase?: boolean }): Promise<void> {
    const { siteProcessManager } = getServices();
    await siteProcessManager.stop(site, options);
  }

  /**
   * Get the WordPress content directory path
   */
  getWpContentPath(site: Local.Site): string {
    return `${this.getSitePath(site)}/app/public/wp-content`;
  }

  /**
   * Get the WordPress plugins directory path
   */
  getPluginsPath(site: Local.Site): string {
    return `${this.getWpContentPath(site)}/plugins`;
  }

  /**
   * Get the site path (expanded if contains ~)
   */
  getSitePath(site: Local.Site): string {
    const sitePath = site.path || '';
    // Expand tilde if present
    if (sitePath.startsWith('~/')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      return sitePath.replace('~', homeDir);
    }
    return sitePath;
  }

  /**
   * Get site domain
   */
  getDomain(site: Local.Site): string {
    return site.domain || 'localhost';
  }

  /**
   * Get site URL
   */
  getUrl(site: Local.Site): string {
    const domain = this.getDomain(site);
    return `http://${domain}`;
  }
}

// Default instance
export const siteManager = new SiteManager();

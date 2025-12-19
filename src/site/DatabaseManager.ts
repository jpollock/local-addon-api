/**
 * DatabaseManager - Database query utilities for Local sites
 *
 * Provides convenient methods for querying WordPress databases.
 */

import type * as Local from '@getflywheel/local';
import { getServices } from '../core/ServiceContainer';

/**
 * DatabaseManager - Manages database queries for a site
 *
 * @example
 * ```typescript
 * const db = new DatabaseManager(site);
 *
 * // Get a WordPress option
 * const siteUrl = await db.getOption('siteurl');
 *
 * // Run a raw query
 * const result = await db.query('SELECT COUNT(*) FROM wp_posts');
 * ```
 */
export class DatabaseManager {
  private site: Local.Site;

  constructor(site: Local.Site) {
    this.site = site;
  }

  /**
   * Wait for the database to be ready
   */
  async waitForReady(): Promise<boolean> {
    const { siteDatabase } = getServices();
    return siteDatabase.waitForDB(this.site);
  }

  /**
   * Run a raw SQL query
   *
   * Note: The result is returned as a string (raw MySQL CLI output).
   * You may need to parse it depending on your query.
   *
   * @param sql - SQL query to execute
   * @returns Query result as string
   */
  async query(sql: string): Promise<string> {
    const { siteDatabase } = getServices();

    // Check if runQuery is available (may not be in all Local versions)
    if (!siteDatabase.runQuery) {
      throw new Error('Database queries are not supported in this version of Local');
    }

    return siteDatabase.runQuery(this.site, sql);
  }

  /**
   * Get a WordPress option value
   *
   * @param name - Option name
   * @returns Option value or null if not found
   */
  async getOption(name: string): Promise<string | null> {
    const escapedName = this.escape(name);
    const result = await this.query(
      `SELECT option_value FROM wp_options WHERE option_name = '${escapedName}'`
    );
    const trimmed = result.trim();
    return trimmed || null;
  }

  /**
   * Set a WordPress option value
   *
   * @param name - Option name
   * @param value - Option value
   */
  async setOption(name: string, value: string): Promise<void> {
    const escapedName = this.escape(name);
    const escapedValue = this.escape(value);
    await this.query(
      `UPDATE wp_options SET option_value = '${escapedValue}' WHERE option_name = '${escapedName}'`
    );
  }

  /**
   * Get the site URL from the database
   */
  async getSiteUrl(): Promise<string | null> {
    return this.getOption('siteurl');
  }

  /**
   * Get the home URL from the database
   */
  async getHomeUrl(): Promise<string | null> {
    return this.getOption('home');
  }

  /**
   * Get the blog name from the database
   */
  async getBlogName(): Promise<string | null> {
    return this.getOption('blogname');
  }

  /**
   * Get the count of published posts
   */
  async getPostCount(): Promise<number> {
    const result = await this.query(
      "SELECT COUNT(*) as count FROM wp_posts WHERE post_status = 'publish' AND post_type = 'post'"
    );
    return parseInt(result.trim(), 10) || 0;
  }

  /**
   * Get the count of users
   */
  async getUserCount(): Promise<number> {
    const result = await this.query('SELECT COUNT(*) as count FROM wp_users');
    return parseInt(result.trim(), 10) || 0;
  }

  /**
   * Check if a table exists
   *
   * @param tableName - Table name to check
   */
  async tableExists(tableName: string): Promise<boolean> {
    const escapedTable = this.escape(tableName);
    const result = await this.query(`SHOW TABLES LIKE '${escapedTable}'`);
    return result.trim().length > 0;
  }

  /**
   * Escape a string for use in SQL queries
   *
   * Handles:
   * - Null bytes (removed to prevent string truncation)
   * - Backslashes (escaped first to avoid double-escaping)
   * - Single quotes (SQL standard escaping)
   * - Control characters (newlines, carriage returns, tabs)
   *
   * Note: For complex queries, consider using parameterized queries if available.
   */
  private escape(value: string): string {
    return value
      .replace(/\0/g, '')           // Remove null bytes (can truncate strings in MySQL)
      .replace(/\\/g, '\\\\')       // Escape backslashes first
      .replace(/'/g, "''")          // SQL single quote escaping
      .replace(/\n/g, '\\n')        // Newlines
      .replace(/\r/g, '\\r')        // Carriage returns
      .replace(/\t/g, '\\t');       // Tabs
  }
}

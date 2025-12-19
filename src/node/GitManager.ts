/**
 * GitManager - Secure Git repository operations
 * Handles cloning, updating, and validating Git repositories
 */

import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs-extra';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorUtils';
import { isValidGitUrl, isValidBranchName } from '../utils/validation';

export interface GitCloneOptions {
  url: string;
  branch: string;
  targetPath: string;
  requirePackageJson?: boolean; // Default true for Node.js apps, false for WordPress plugins
  onProgress?: (event: GitProgressEvent) => void;
}

export interface GitProgressEvent {
  phase: 'cloning' | 'resolving' | 'receiving' | 'checking-out' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface GitCloneResult {
  success: boolean;
  path: string;
  error?: string;
}

export class GitManager {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Clone a Git repository with security validation
   *
   * @param options - Clone options with URL, branch, and target path
   * @returns Promise resolving to clone result
   */
  async cloneRepository(options: GitCloneOptions): Promise<GitCloneResult> {
    const { url, branch, targetPath, onProgress } = options;

    try {
      // Validate Git URL using centralized validator
      if (!isValidGitUrl(url)) {
        return {
          success: false,
          path: '',
          error: 'Invalid Git URL format. Must be https://, git@, or ssh://'
        };
      }

      // Validate branch name using centralized validator
      if (!isValidBranchName(branch)) {
        return {
          success: false,
          path: '',
          error: 'Invalid branch name. Cannot contain special characters that could enable shell injection'
        };
      }

      // Ensure target directory doesn't exist
      if (await fs.pathExists(targetPath)) {
        return {
          success: false,
          path: '',
          error: 'Target directory already exists'
        };
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(targetPath);
      await fs.ensureDir(parentDir);

      // Report initial progress
      if (onProgress) {
        onProgress({
          phase: 'cloning',
          progress: 0,
          message: 'Starting clone operation...'
        });
      }

      // Clone the repository
      // Note: simple-git doesn't provide easy progress tracking in v3.x
      // We'll just report start and completion
      await this.git.clone(
        url,
        targetPath,
        [
          '--branch', branch,
          '--single-branch',
          '--depth', '1' // Shallow clone for faster operations
        ]
      );

      // Verify package.json exists at repository root (only for Node.js apps)
      // WordPress plugins don't need package.json
      const requirePackageJson = options.requirePackageJson ?? true; // Default to true for backward compatibility
      if (requirePackageJson) {
        const packageJsonPath = path.join(targetPath, 'package.json');
        if (!await fs.pathExists(packageJsonPath)) {
          // Clean up the cloned directory
          await fs.remove(targetPath);
          return {
            success: false,
            path: '',
            error: 'No package.json found in repository root'
          };
        }
      }

      // Report completion
      if (onProgress) {
        onProgress({
          phase: 'complete',
          progress: 100,
          message: 'Clone complete'
        });
      }

      return {
        success: true,
        path: targetPath
      };

    } catch (error: unknown) {
      // Clean up on error
      try {
        if (await fs.pathExists(targetPath)) {
          await fs.remove(targetPath);
        }
      } catch (cleanupError: unknown) {
        logger.git.warn('Cleanup failed after git clone error', { targetPath, error: getErrorMessage(cleanupError) });
      }

      return {
        success: false,
        path: '',
        error: this.sanitizeGitError(error)
      };
    }
  }

  /**
   * Sanitize Git error messages to remove sensitive information
   */
  private sanitizeGitError(error: unknown): string {
    if (!error) {
      return 'Unknown Git error occurred';
    }

    let message = error instanceof Error ? error.message : String(error);

    // Remove user paths
    message = message.replace(/\/Users\/[^/\s]+/g, '[USER]');
    message = message.replace(/\/home\/[^/\s]+/g, '[USER]');
    message = message.replace(/C:\\Users\\[^\\s]+/g, '[USER]');

    // Remove credentials if accidentally included
    message = message.replace(/:[^:@]+@/g, ':[REDACTED]@');
    message = message.replace(/token=[^&\s]+/g, 'token=[REDACTED]');

    // Common Git error messages to user-friendly messages
    if (message.includes('not found') || message.includes('Could not resolve host')) {
      return 'Repository not found or network error';
    }

    if (message.includes('authentication') || message.includes('Permission denied')) {
      return 'Authentication failed. Check credentials or use HTTPS URL';
    }

    if (message.includes('already exists')) {
      return 'Target directory already exists';
    }

    // Return sanitized message
    return `Git operation failed: ${message}`;
  }

  /**
   * Get the current branch of a repository
   */
  async getCurrentBranch(repoPath: string): Promise<string | null> {
    try {
      const git = simpleGit(repoPath);
      const branch = await git.branch();
      return branch.current;
    } catch (error) {
      return null;
    }
  }

  /**
   * Pull latest changes from remote
   */
  async pullLatest(repoPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const git = simpleGit(repoPath);
      await git.pull();
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: this.sanitizeGitError(error)
      };
    }
  }

  /**
   * Check if path is a Git repository
   */
  async isGitRepository(repoPath: string): Promise<boolean> {
    try {
      const git = simpleGit(repoPath);
      await git.status();
      return true;
    } catch (error) {
      return false;
    }
  }
}

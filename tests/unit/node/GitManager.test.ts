/**
 * Tests for GitManager
 * Security-critical: Tests URL validation, branch name validation, and error sanitization
 */

import { GitManager } from '../../../src/node/GitManager';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock simple-git
const mockGitInstance = {
  clone: jest.fn().mockResolvedValue(undefined),
  branch: jest.fn().mockResolvedValue({ current: 'main' }),
  pull: jest.fn().mockResolvedValue(undefined),
  status: jest.fn().mockResolvedValue({ isClean: () => true })
};

jest.mock('simple-git', () => {
  return jest.fn(() => mockGitInstance);
});

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined)
}));

const mockFsExtra = fs as jest.Mocked<typeof fs>;

describe('GitManager', () => {
  let gitManager: GitManager;

  beforeEach(() => {
    gitManager = new GitManager();
    jest.clearAllMocks();
    // Default: target doesn't exist, package.json exists (for Node.js app validation)
    mockFsExtra.pathExists.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.endsWith('package.json')) {
        return Promise.resolve(true) as any;
      }
      return Promise.resolve(false) as any;
    });
  });

  describe('cloneRepository - URL validation', () => {
    it('should accept valid HTTPS URL with .git', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid HTTPS URL without .git', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid SSH URL (git@)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'git@github.com:user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid ssh:// URL', async () => {
      const result = await gitManager.cloneRepository({
        url: 'ssh://git@github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should reject file:// protocol (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'file:///etc/passwd',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject javascript: protocol (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'javascript:alert(1)',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject data: protocol (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'data:text/plain,hello',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject absolute paths (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: '/etc/passwd',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject relative paths with traversal (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: '../../../etc/passwd',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject URLs with shell metacharacters (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git; rm -rf /',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject URLs with backticks (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/`whoami`/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject URLs with $() (security)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/$(whoami)/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject empty URL', async () => {
      const result = await gitManager.cloneRepository({
        url: '',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });

    it('should reject http:// (insecure protocol)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'http://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Git URL');
    });
  });

  describe('cloneRepository - branch validation', () => {
    it('should accept valid branch name: main', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid branch name: feature/add-tests', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'feature/add-tests',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid branch name: v1.0.0', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'v1.0.0',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(true);
    });

    it('should reject branch with shell metacharacters (;)', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main; rm -rf /',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });

    it('should reject branch with backticks', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: '`whoami`',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });

    it('should reject branch with $() syntax', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: '$(whoami)',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });

    it('should reject branch starting with dot', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: '.hidden',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });

    it('should reject branch starting with hyphen', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: '-bad-branch',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });

    it('should reject empty branch name', async () => {
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: '',
        targetPath: '/tmp/test-repo'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch');
    });
  });

  describe('cloneRepository - directory checks', () => {
    it('should fail if target directory already exists', async () => {
      mockFsExtra.pathExists.mockResolvedValue(true as never);

      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/existing-repo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('cloneRepository - package.json requirement', () => {
    it('should fail if package.json not found (default behavior)', async () => {
      mockFsExtra.pathExists.mockImplementation((p: fs.PathLike) => {
        // All paths don't exist (including package.json)
        return Promise.resolve(false) as any;
      });

      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('package.json');
    });

    it('should succeed without package.json when requirePackageJson is false', async () => {
      mockFsExtra.pathExists.mockResolvedValue(false as never);

      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo',
        requirePackageJson: false
      });

      expect(result.success).toBe(true);
    });
  });

  describe('cloneRepository - progress callback', () => {
    it('should call onProgress with cloning and complete phases', async () => {
      mockFsExtra.pathExists.mockResolvedValue(false as never);

      const onProgress = jest.fn();
      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo',
        requirePackageJson: false,
        onProgress
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'cloning', progress: 0 })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'complete', progress: 100 })
      );
    });
  });

  describe('error sanitization', () => {
    it('should sanitize user paths in error messages', async () => {
      mockGitInstance.clone.mockRejectedValueOnce(new Error('Error at /Users/secretuser/path'));
      mockFsExtra.pathExists.mockResolvedValue(false as never);

      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo',
        requirePackageJson: false
      });

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('secretuser');
      expect(result.error).toContain('[USER]');
    });

    it('should sanitize credentials in error messages', async () => {
      mockGitInstance.clone.mockRejectedValueOnce(new Error('Failed: https://token:secret@github.com'));
      mockFsExtra.pathExists.mockResolvedValue(false as never);

      const result = await gitManager.cloneRepository({
        url: 'https://github.com/user/repo.git',
        branch: 'main',
        targetPath: '/tmp/test-repo',
        requirePackageJson: false
      });

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('secret');
      expect(result.error).toContain('[REDACTED]');
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branch = await gitManager.getCurrentBranch('/tmp/test-repo');
      expect(branch).toBe('main');
    });
  });

  describe('pullLatest', () => {
    it('should pull latest changes', async () => {
      const result = await gitManager.pullLatest('/tmp/test-repo');
      expect(result.success).toBe(true);
    });
  });

  describe('isGitRepository', () => {
    it('should return true for valid git repo', async () => {
      const result = await gitManager.isGitRepository('/tmp/test-repo');
      expect(result).toBe(true);
    });
  });
});

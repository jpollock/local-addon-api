/**
 * Tests for security validation module
 * Critical: These tests verify command injection and path traversal prevention
 */

import {
  validateCommand,
  validateStartCommand,
  validateInstallCommand,
  validateBuildCommand,
  validateAppId,
  validatePath,
  validateAppPath,
  isValidPluginSlug,
  isValidGitUrl,
  isValidBranchName
} from '../../../src/utils/validation';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('validateCommand', () => {
  describe('valid commands', () => {
    it('should accept npm start', () => {
      const result = validateCommand('npm start');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['npm', 'start']);
    });

    it('should accept npm run dev', () => {
      const result = validateCommand('npm run dev');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['npm', 'run', 'dev']);
    });

    it('should accept yarn install', () => {
      const result = validateCommand('yarn install');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['yarn', 'install']);
    });

    it('should accept pnpm build', () => {
      const result = validateCommand('pnpm build');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['pnpm', 'build']);
    });

    it('should accept bun dev', () => {
      const result = validateCommand('bun dev');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['bun', 'dev']);
    });

    it('should accept node with script path', () => {
      const result = validateCommand('node index.js');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['node', 'index.js']);
    });

    it('should accept npm ci', () => {
      const result = validateCommand('npm ci');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['npm', 'ci']);
    });

    it('should trim whitespace', () => {
      const result = validateCommand('  npm start  ');
      expect(result.valid).toBe(true);
      expect(result.sanitizedCommand).toEqual(['npm', 'start']);
    });
  });

  describe('blocked executables', () => {
    it('should reject curl', () => {
      const result = validateCommand('curl http://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject wget', () => {
      const result = validateCommand('wget http://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject bash', () => {
      const result = validateCommand('bash script.sh');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject sh', () => {
      const result = validateCommand('sh script.sh');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject rm', () => {
      const result = validateCommand('rm -rf /');
      expect(result.valid).toBe(false);
    });

    it('should reject python', () => {
      const result = validateCommand('python script.py');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('dangerous characters (command injection)', () => {
    it('should reject semicolon (;)', () => {
      const result = validateCommand('npm start; rm -rf /');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject ampersand (&)', () => {
      const result = validateCommand('npm start && curl evil.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject pipe (|)', () => {
      const result = validateCommand('npm start | cat /etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject backtick (`)', () => {
      const result = validateCommand('npm start `whoami`');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject dollar sign ($)', () => {
      const result = validateCommand('npm start $USER');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject parentheses', () => {
      const result = validateCommand('npm start $(whoami)');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject angle brackets', () => {
      const result = validateCommand('npm start > output.txt');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject backslash', () => {
      const result = validateCommand('npm start \\n');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject single quotes', () => {
      const result = validateCommand("npm start 'test'");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject double quotes', () => {
      const result = validateCommand('npm start "test"');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });
  });

  describe('node command security', () => {
    it('should reject path traversal in node scripts', () => {
      const result = validateCommand('node ../../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('path traversal');
    });

    it('should reject absolute paths for node scripts', () => {
      const result = validateCommand('node /etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('relative path');
    });

    it('should accept relative paths for node scripts', () => {
      const result = validateCommand('node scripts/start.js');
      expect(result.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should reject empty string', () => {
      const result = validateCommand('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('should reject null', () => {
      const result = validateCommand(null as unknown as string);
      expect(result.valid).toBe(false);
    });

    it('should reject undefined', () => {
      const result = validateCommand(undefined as unknown as string);
      expect(result.valid).toBe(false);
    });

    it('should reject whitespace only', () => {
      const result = validateCommand('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should require subcommand for npm', () => {
      const result = validateCommand('npm');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('subcommand');
    });

    it('should reject invalid npm subcommand', () => {
      const result = validateCommand('npm exec');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });
});

describe('validateInstallCommand', () => {
  it('should accept npm install', () => {
    const result = validateInstallCommand('npm install');
    expect(result.valid).toBe(true);
  });

  it('should accept npm ci', () => {
    const result = validateInstallCommand('npm ci');
    expect(result.valid).toBe(true);
  });

  it('should accept yarn install', () => {
    const result = validateInstallCommand('yarn install');
    expect(result.valid).toBe(true);
  });

  it('should reject npm start as install command', () => {
    const result = validateInstallCommand('npm start');
    expect(result.valid).toBe(false);
    expect(result.error).toContain("'install' or 'ci'");
  });

  it('should reject node as install command', () => {
    const result = validateInstallCommand('node install.js');
    expect(result.valid).toBe(false);
  });
});

describe('validateBuildCommand', () => {
  it('should accept empty build command (optional)', () => {
    const result = validateBuildCommand('');
    expect(result.valid).toBe(true);
    expect(result.sanitizedCommand).toEqual([]);
  });

  it('should accept npm run build', () => {
    const result = validateBuildCommand('npm run build');
    expect(result.valid).toBe(true);
  });

  it('should accept npm build', () => {
    const result = validateBuildCommand('npm build');
    expect(result.valid).toBe(true);
  });

  it('should reject npm start as build command', () => {
    const result = validateBuildCommand('npm start');
    expect(result.valid).toBe(false);
    expect(result.error).toContain("'run' or 'build'");
  });
});

describe('validateAppId', () => {
  it('should accept valid UUID-like IDs', () => {
    const result = validateAppId('abc123-def456');
    expect(result.valid).toBe(true);
  });

  it('should accept alphanumeric with hyphens and underscores', () => {
    const result = validateAppId('my_app-v2');
    expect(result.valid).toBe(true);
  });

  it('should reject path traversal (..)', () => {
    const result = validateAppId('../parent');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('path traversal');
  });

  it('should reject forward slash', () => {
    const result = validateAppId('app/subdir');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('path separators');
  });

  it('should reject backslash', () => {
    const result = validateAppId('app\\subdir');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('path separators');
  });

  it('should reject absolute paths', () => {
    const result = validateAppId('/etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('should reject Windows absolute paths', () => {
    const result = validateAppId('C:Windows');
    expect(result.valid).toBe(false);
  });

  it('should reject special characters', () => {
    const result = validateAppId('app<script>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid characters');
  });

  it('should reject empty string', () => {
    const result = validateAppId('');
    expect(result.valid).toBe(false);
  });

  it('should reject null', () => {
    const result = validateAppId(null as unknown as string);
    expect(result.valid).toBe(false);
  });
});

describe('validatePath', () => {
  const tempDir = os.tmpdir();
  const testBase = path.join(tempDir, 'test-validate-path');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testBase)) {
      fs.mkdirSync(testBase, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up
    if (fs.existsSync(testBase)) {
      fs.rmSync(testBase, { recursive: true, force: true });
    }
  });

  it('should accept valid relative path', () => {
    const result = validatePath(testBase, 'subdir/file.txt', 'test file');
    expect(result.valid).toBe(true);
    expect(result.sanitizedPath).toBeDefined();
  });

  it('should reject path traversal with ..', () => {
    const result = validatePath(testBase, '../outside', 'test');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('escapes the base directory');
  });

  it('should reject null bytes', () => {
    const result = validatePath(testBase, 'file\0.txt', 'test');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('null bytes');
  });

  it('should reject empty target path', () => {
    const result = validatePath(testBase, '', 'test');
    expect(result.valid).toBe(false);
  });

  it('should reject null target path', () => {
    const result = validatePath(testBase, null as unknown as string, 'test');
    expect(result.valid).toBe(false);
  });

  it('should reject empty base path', () => {
    const result = validatePath('', 'file.txt', 'test');
    expect(result.valid).toBe(false);
  });
});

describe('validateAppPath', () => {
  const tempDir = os.tmpdir();
  const testBase = path.join(tempDir, 'test-app-path');

  beforeAll(() => {
    if (!fs.existsSync(testBase)) {
      fs.mkdirSync(testBase, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testBase)) {
      fs.rmSync(testBase, { recursive: true, force: true });
    }
  });

  it('should accept valid app ID', () => {
    const result = validateAppPath(testBase, 'my-app-123');
    expect(result.valid).toBe(true);
  });

  it('should reject path traversal in app ID', () => {
    const result = validateAppPath(testBase, '../escape');
    expect(result.valid).toBe(false);
  });
});

describe('isValidPluginSlug', () => {
  describe('valid slugs', () => {
    it('should accept lowercase slug', () => {
      expect(isValidPluginSlug('my-plugin')).toBe(true);
    });

    it('should accept slug with underscore', () => {
      expect(isValidPluginSlug('my_plugin')).toBe(true);
    });

    it('should accept slug with numbers', () => {
      expect(isValidPluginSlug('plugin123')).toBe(true);
    });

    it('should accept uppercase slug (case-insensitive)', () => {
      expect(isValidPluginSlug('MyPlugin')).toBe(true);
    });

    it('should accept mixed case with hyphens', () => {
      expect(isValidPluginSlug('My-Plugin-v2')).toBe(true);
    });
  });

  describe('invalid slugs', () => {
    it('should reject empty string', () => {
      expect(isValidPluginSlug('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidPluginSlug(null as unknown as string)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidPluginSlug(undefined as unknown as string)).toBe(false);
    });

    it('should reject path traversal', () => {
      expect(isValidPluginSlug('../../passwd')).toBe(false);
    });

    it('should reject HTML/script tags', () => {
      expect(isValidPluginSlug('plugin<script>')).toBe(false);
    });

    it('should reject shell metacharacters', () => {
      expect(isValidPluginSlug('plugin;rm')).toBe(false);
    });

    it('should reject spaces', () => {
      expect(isValidPluginSlug('my plugin')).toBe(false);
    });

    it('should reject forward slashes', () => {
      expect(isValidPluginSlug('my/plugin')).toBe(false);
    });

    it('should reject very long slugs (>200 chars)', () => {
      const longSlug = 'a'.repeat(201);
      expect(isValidPluginSlug(longSlug)).toBe(false);
    });
  });
});

describe('isValidGitUrl', () => {
  describe('valid URLs', () => {
    it('should accept HTTPS URL with .git', () => {
      expect(isValidGitUrl('https://github.com/user/repo.git')).toBe(true);
    });

    it('should accept HTTPS URL without .git', () => {
      expect(isValidGitUrl('https://github.com/user/repo')).toBe(true);
    });

    it('should accept SSH URL with git@', () => {
      expect(isValidGitUrl('git@github.com:user/repo.git')).toBe(true);
    });

    it('should accept SSH URL without .git', () => {
      expect(isValidGitUrl('git@github.com:user/repo')).toBe(true);
    });

    it('should accept ssh:// protocol', () => {
      expect(isValidGitUrl('ssh://git@github.com/user/repo.git')).toBe(true);
    });
  });

  describe('blocked URLs', () => {
    it('should reject file:// protocol', () => {
      expect(isValidGitUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject javascript: protocol', () => {
      expect(isValidGitUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: protocol', () => {
      expect(isValidGitUrl('data:text/plain,hello')).toBe(false);
    });

    it('should reject absolute paths', () => {
      expect(isValidGitUrl('/etc/passwd')).toBe(false);
    });

    it('should reject relative paths with traversal', () => {
      expect(isValidGitUrl('../../../etc/passwd')).toBe(false);
    });

    it('should reject http (non-secure)', () => {
      expect(isValidGitUrl('http://github.com/user/repo')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidGitUrl('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidGitUrl(null as unknown as string)).toBe(false);
    });
  });
});

describe('isValidBranchName', () => {
  describe('valid branch names', () => {
    it('should accept main', () => {
      expect(isValidBranchName('main')).toBe(true);
    });

    it('should accept develop', () => {
      expect(isValidBranchName('develop')).toBe(true);
    });

    it('should accept feature/add-tests', () => {
      expect(isValidBranchName('feature/add-tests')).toBe(true);
    });

    it('should accept version tags like v1.0.0', () => {
      expect(isValidBranchName('v1.0.0')).toBe(true);
    });

    it('should accept release/2.0', () => {
      expect(isValidBranchName('release/2.0')).toBe(true);
    });
  });

  describe('invalid branch names', () => {
    it('should reject names starting with dot', () => {
      expect(isValidBranchName('.hidden')).toBe(false);
    });

    it('should reject names starting with hyphen', () => {
      expect(isValidBranchName('-branch')).toBe(false);
    });

    it('should reject names containing ..', () => {
      expect(isValidBranchName('feature..test')).toBe(false);
    });

    it('should reject names containing @{', () => {
      expect(isValidBranchName('branch@{yesterday}')).toBe(false);
    });

    it('should reject names containing backslash', () => {
      expect(isValidBranchName('branch\\test')).toBe(false);
    });

    it('should reject names ending with /', () => {
      expect(isValidBranchName('branch/')).toBe(false);
    });

    it('should reject names ending with .lock', () => {
      expect(isValidBranchName('branch.lock')).toBe(false);
    });

    it('should reject control characters', () => {
      expect(isValidBranchName('branch\x00')).toBe(false);
    });

    it('should reject whitespace', () => {
      expect(isValidBranchName('branch name')).toBe(false);
    });

    it('should reject tilde (~)', () => {
      expect(isValidBranchName('branch~1')).toBe(false);
    });

    it('should reject caret (^)', () => {
      expect(isValidBranchName('branch^2')).toBe(false);
    });

    it('should reject colon (:)', () => {
      expect(isValidBranchName('branch:test')).toBe(false);
    });

    it('should reject question mark (?)', () => {
      expect(isValidBranchName('branch?')).toBe(false);
    });

    it('should reject asterisk (*)', () => {
      expect(isValidBranchName('branch*')).toBe(false);
    });

    it('should reject open bracket ([)', () => {
      expect(isValidBranchName('branch[')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidBranchName('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidBranchName(null as unknown as string)).toBe(false);
    });

    it('should reject very long names (>255 chars)', () => {
      const longName = 'a'.repeat(256);
      expect(isValidBranchName(longName)).toBe(false);
    });
  });
});

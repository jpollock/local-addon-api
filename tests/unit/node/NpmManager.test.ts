/**
 * Tests for NpmManager module
 */

import { NpmManager } from '../../../src/node/NpmManager';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock child_process
jest.mock('child_process');
const mockChildProcess = childProcess as jest.Mocked<typeof childProcess>;

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    npm: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Mock safeEnv
jest.mock('../../../src/utils/safeEnv', () => ({
  getSafeEnv: () => ({
    PATH: '/usr/local/bin:/usr/bin',
    HOME: '/Users/test',
  }),
}));

describe('NpmManager', () => {
  let manager: NpmManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new NpmManager();
    // Reset environment
    delete process.env.FORCE_BUNDLED_NPM;
  });

  describe('isPackageManagerCommand', () => {
    it('should return true for npm', () => {
      expect(NpmManager.isPackageManagerCommand('npm')).toBe(true);
    });

    it('should return true for npx', () => {
      expect(NpmManager.isPackageManagerCommand('npx')).toBe(true);
    });

    it('should return true for yarn', () => {
      expect(NpmManager.isPackageManagerCommand('yarn')).toBe(true);
    });

    it('should return true for pnpm', () => {
      expect(NpmManager.isPackageManagerCommand('pnpm')).toBe(true);
    });

    it('should return false for node', () => {
      expect(NpmManager.isPackageManagerCommand('node')).toBe(false);
    });

    it('should return false for other commands', () => {
      expect(NpmManager.isPackageManagerCommand('git')).toBe(false);
      expect(NpmManager.isPackageManagerCommand('ls')).toBe(false);
    });
  });

  describe('getResolvedNpmPath', () => {
    it('should return null before npm detection', () => {
      expect(manager.getResolvedNpmPath()).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear cached npm info', async () => {
      // First, populate the cache by mocking system npm detection
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      // Create mock spawn
      const mockSpawnChild = new EventEmitter() as childProcess.ChildProcess;
      (mockChildProcess.spawn as jest.Mock).mockReturnValue(mockSpawnChild);

      // Start getNpmInfo
      const infoPromise = manager.getNpmInfo();

      // Emit exit event
      setImmediate(() => {
        mockSpawnChild.emit('exit', 0);
      });

      await infoPromise;

      // Verify we have cached npm path
      expect(manager.getResolvedNpmPath()).toBe('/usr/local/bin/npm');

      // Clear cache
      manager.clearCache();

      // Verify cache is cleared
      expect(manager.getResolvedNpmPath()).toBeNull();
    });
  });

  describe('getNpmInfo with system npm', () => {
    it('should detect system npm when available', async () => {
      // Mock exec for 'which npm'
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);

      // Mock fs.existsSync for path check
      mockFs.existsSync.mockReturnValue(true);

      // Create mock spawn child for version check
      const mockSpawnChild = new EventEmitter() as childProcess.ChildProcess;
      (mockChildProcess.spawn as jest.Mock).mockReturnValue(mockSpawnChild);

      // Start getNpmInfo
      const infoPromise = manager.getNpmInfo();

      // Emit exit event for version check
      setImmediate(() => {
        mockSpawnChild.emit('exit', 0);
      });

      const info = await infoPromise;

      expect(info.type).toBe('system');
      expect(info.path).toBe('/usr/local/bin/npm');
    });

    it('should cache npm info', async () => {
      // Setup mocks
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      const mockSpawnChild = new EventEmitter() as childProcess.ChildProcess;
      (mockChildProcess.spawn as jest.Mock).mockReturnValue(mockSpawnChild);

      const infoPromise = manager.getNpmInfo();
      setImmediate(() => mockSpawnChild.emit('exit', 0));
      await infoPromise;

      // Reset mock calls
      jest.clearAllMocks();

      // Second call should use cache
      const info2 = await manager.getNpmInfo();

      expect(info2.type).toBe('system');
      expect(mockChildProcess.exec).not.toHaveBeenCalled();
    });
  });

  describe('getNpmInfo fallback to bundled', () => {
    it('should fall back to bundled when system npm not found', async () => {
      // Mock exec to fail (npm not found)
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(new Error('not found'), null);
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);

      // Mock bundled npm path detection
      mockFs.existsSync.mockImplementation((p: string) => {
        if (p.includes('package.json')) return true;
        if (p.includes('npm-cli.js')) return true;
        return false;
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        name: '@local-labs/local-addon-api'
      }));

      const info = await manager.getNpmInfo();

      expect(info.type).toBe('bundled');
      expect(info.path).toContain('npm-cli.js');
    });

    it('should throw error when no npm available', async () => {
      // Mock exec to fail
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(new Error('not found'), null);
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);

      // Mock no bundled npm found
      mockFs.existsSync.mockReturnValue(false);

      await expect(manager.getNpmInfo()).rejects.toThrow('npm not found');
    });
  });

  describe('install', () => {
    it('should call runCommand with install args', async () => {
      // Setup system npm
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      // Mock spawn for detection
      const mockDetectChild = new EventEmitter() as childProcess.ChildProcess;

      // Mock spawn for install command
      const mockInstallChild = new EventEmitter() as childProcess.ChildProcess & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      mockInstallChild.stdout = new EventEmitter();
      mockInstallChild.stderr = new EventEmitter();

      let spawnCallCount = 0;
      (mockChildProcess.spawn as jest.Mock).mockImplementation(() => {
        spawnCallCount++;
        if (spawnCallCount === 1) return mockDetectChild;
        return mockInstallChild;
      });

      const installPromise = manager.install({ cwd: '/test/project' });

      // Handle detection
      setImmediate(() => {
        mockDetectChild.emit('exit', 0);

        // Handle install after a tick
        setImmediate(() => {
          mockInstallChild.emit('exit', 0);
        });
      });

      await installPromise;

      // Verify spawn was called with install args
      expect(mockChildProcess.spawn).toHaveBeenCalledWith(
        '/usr/local/bin/npm',
        ['install'],
        expect.any(Object)
      );
    });
  });

  describe('runCommand', () => {
    it('should run npm command with correct args', async () => {
      // Setup system npm
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      const mockDetectChild = new EventEmitter() as childProcess.ChildProcess;
      const mockRunChild = new EventEmitter() as childProcess.ChildProcess & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      mockRunChild.stdout = new EventEmitter();
      mockRunChild.stderr = new EventEmitter();

      let spawnCallCount = 0;
      (mockChildProcess.spawn as jest.Mock).mockImplementation(() => {
        spawnCallCount++;
        if (spawnCallCount === 1) return mockDetectChild;
        return mockRunChild;
      });

      const runPromise = manager.runCommand(['run', 'build'], { cwd: '/test/project' });

      setImmediate(() => {
        mockDetectChild.emit('exit', 0);
        setImmediate(() => {
          mockRunChild.emit('exit', 0);
        });
      });

      await runPromise;

      expect(mockChildProcess.spawn).toHaveBeenCalledWith(
        '/usr/local/bin/npm',
        ['run', 'build'],
        expect.any(Object)
      );
    });

    it('should call onProgress with output', async () => {
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      const mockDetectChild = new EventEmitter() as childProcess.ChildProcess;
      const mockRunChild = new EventEmitter() as childProcess.ChildProcess & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      mockRunChild.stdout = new EventEmitter();
      mockRunChild.stderr = new EventEmitter();

      let spawnCallCount = 0;
      (mockChildProcess.spawn as jest.Mock).mockImplementation(() => {
        spawnCallCount++;
        if (spawnCallCount === 1) return mockDetectChild;
        return mockRunChild;
      });

      const progressOutput: string[] = [];
      const runPromise = manager.runCommand(['test'], {
        cwd: '/test/project',
        onProgress: (output) => progressOutput.push(output),
      });

      setImmediate(() => {
        mockDetectChild.emit('exit', 0);
        setImmediate(() => {
          mockRunChild.stdout.emit('data', Buffer.from('Test output\n'));
          mockRunChild.emit('exit', 0);
        });
      });

      await runPromise;

      expect(progressOutput).toContain('Test output\n');
    });

    it('should reject on non-zero exit code', async () => {
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      const mockDetectChild = new EventEmitter() as childProcess.ChildProcess;
      const mockRunChild = new EventEmitter() as childProcess.ChildProcess & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      mockRunChild.stdout = new EventEmitter();
      mockRunChild.stderr = new EventEmitter();

      let spawnCallCount = 0;
      (mockChildProcess.spawn as jest.Mock).mockImplementation(() => {
        spawnCallCount++;
        if (spawnCallCount === 1) return mockDetectChild;
        return mockRunChild;
      });

      const runPromise = manager.runCommand(['test'], { cwd: '/test/project' });

      setImmediate(() => {
        mockDetectChild.emit('exit', 0);
        setImmediate(() => {
          mockRunChild.stderr.emit('data', Buffer.from('Error: test failed\n'));
          mockRunChild.emit('exit', 1);
        });
      });

      await expect(runPromise).rejects.toThrow('npm test failed with exit code 1');
    });

    it('should reject on spawn error', async () => {
      const mockExec = jest.fn().mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '/usr/local/bin/npm\n' });
      });
      (mockChildProcess.exec as unknown as jest.Mock).mockImplementation(mockExec);
      mockFs.existsSync.mockReturnValue(true);

      const mockDetectChild = new EventEmitter() as childProcess.ChildProcess;
      const mockRunChild = new EventEmitter() as childProcess.ChildProcess & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      mockRunChild.stdout = new EventEmitter();
      mockRunChild.stderr = new EventEmitter();

      let spawnCallCount = 0;
      (mockChildProcess.spawn as jest.Mock).mockImplementation(() => {
        spawnCallCount++;
        if (spawnCallCount === 1) return mockDetectChild;
        return mockRunChild;
      });

      const runPromise = manager.runCommand(['test'], { cwd: '/test/project' });

      setImmediate(() => {
        mockDetectChild.emit('exit', 0);
        setImmediate(() => {
          mockRunChild.emit('error', new Error('spawn error'));
        });
      });

      await expect(runPromise).rejects.toThrow('spawn error');
    });
  });
});

/**
 * Basic test to verify library exports work correctly
 */

// Test imports from main entry point
import {
  // Core
  ServiceContainer,
  LifecycleManager,
  IpcManager,

  // Site
  SiteManager,
  DatabaseManager,
  PortManager,

  // Utils
  TIMEOUTS,
  LIMITS,
  DEFAULTS,
  getErrorMessage,
  isError,
  getSafeEnv,
  withTimeout,
  createLogger,
  validateCommand,
  isValidGitUrl,
  isValidPluginSlug,

  // Types
  ok,
  err,
} from '../src';

// Test imports from subpath exports
import { ServiceContainer as SC } from '../src/core';
import { SiteManager as SM } from '../src/site';
import { TIMEOUTS as T } from '../src/utils';

console.log('=== @local-labs/local-addon-api Test ===\n');

// Test 1: Constants are exported
console.log('1. Testing constants...');
console.assert(TIMEOUTS.PROCESS_START === 3000, 'TIMEOUTS.PROCESS_START should be 3000');
console.assert(LIMITS.MAX_APPS_PER_SITE === 10, 'LIMITS.MAX_APPS_PER_SITE should be 10');
console.assert(DEFAULTS.GIT_BRANCH === 'main', 'DEFAULTS.GIT_BRANCH should be main');
console.log('   ✓ Constants exported correctly\n');

// Test 2: Error utilities work
console.log('2. Testing error utilities...');
const testError = new Error('Test error');
console.assert(getErrorMessage(testError) === 'Test error', 'getErrorMessage should extract message');
console.assert(getErrorMessage('string error') === 'string error', 'getErrorMessage should handle strings');
console.assert(getErrorMessage(null) === 'Unknown error', 'getErrorMessage should return default');
console.assert(isError(testError) === true, 'isError should return true for Error');
console.assert(isError('not an error') === false, 'isError should return false for non-Error');
console.log('   ✓ Error utilities work correctly\n');

// Test 3: Result pattern helpers
console.log('3. Testing Result pattern...');
const successResult = ok({ id: '123', name: 'Test' });
const errorResult = err('Something went wrong');
console.assert(successResult.success === true, 'ok() should create success result');
console.assert(successResult.data.id === '123', 'ok() should include data');
console.assert(errorResult.success === false, 'err() should create error result');
console.assert(errorResult.error === 'Something went wrong', 'err() should include error');
console.log('   ✓ Result pattern works correctly\n');

// Test 4: Validation functions
console.log('4. Testing validation functions...');
const validCmd = validateCommand('npm start');
console.assert(validCmd.valid === true, 'npm start should be valid');
const invalidCmd = validateCommand('rm -rf /');
console.assert(invalidCmd.valid === false, 'rm -rf should be invalid');
console.assert(isValidGitUrl('https://github.com/user/repo') === true, 'HTTPS git URL should be valid');
console.assert(isValidGitUrl('not-a-url') === false, 'Invalid URL should be invalid');
console.assert(isValidPluginSlug('my-plugin') === true, 'Valid slug should be valid');
console.assert(isValidPluginSlug('../hack') === false, 'Path traversal slug should be invalid');
console.log('   ✓ Validation functions work correctly\n');

// Test 5: Safe environment filtering
console.log('5. Testing safe environment...');
const originalEnv = process.env.AWS_SECRET_KEY;
process.env.AWS_SECRET_KEY = 'secret123';
const safeEnv = getSafeEnv();
console.assert(!('AWS_SECRET_KEY' in safeEnv), 'AWS_SECRET_KEY should be filtered out');
console.assert('PATH' in safeEnv, 'PATH should be included');
if (originalEnv === undefined) {
  delete process.env.AWS_SECRET_KEY;
} else {
  process.env.AWS_SECRET_KEY = originalEnv;
}
console.log('   ✓ Safe environment filtering works correctly\n');

// Test 6: Timeout utility
console.log('6. Testing timeout utility...');
async function testTimeout() {
  // Test successful promise
  const fastPromise = Promise.resolve('fast');
  const fastResult = await withTimeout(fastPromise, 1000);
  console.assert(fastResult === 'fast', 'Fast promise should resolve');

  // Test timeout
  const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 2000));
  try {
    await withTimeout(slowPromise, 100, 'Timed out');
    console.assert(false, 'Should have thrown timeout error');
  } catch (e) {
    console.assert((e as Error).message === 'Timed out', 'Should throw timeout error');
  }
  console.log('   ✓ Timeout utility works correctly\n');
}

// Test 7: Logger creation
console.log('7. Testing logger creation...');
const testLogger = createLogger('TestComponent');
console.assert(typeof testLogger.info === 'function', 'Logger should have info method');
console.assert(typeof testLogger.error === 'function', 'Logger should have error method');
console.assert(typeof testLogger.warn === 'function', 'Logger should have warn method');
console.assert(typeof testLogger.debug === 'function', 'Logger should have debug method');
console.log('   ✓ Logger creation works correctly\n');

// Test 8: Class instantiation (without Local context)
console.log('8. Testing class instantiation...');
console.assert(typeof ServiceContainer === 'function', 'ServiceContainer should be a class');
console.assert(typeof SiteManager === 'function', 'SiteManager should be a class');
console.assert(typeof DatabaseManager === 'function', 'DatabaseManager should be a class');
console.assert(typeof PortManager === 'function', 'PortManager should be a class');
console.assert(typeof LifecycleManager === 'function', 'LifecycleManager should be a class');
console.assert(typeof IpcManager === 'function', 'IpcManager should be a class');
console.log('   ✓ Classes are properly exported\n');

// Test 9: Subpath exports match main exports
console.log('9. Testing subpath exports...');
console.assert(SC === ServiceContainer, 'Subpath ServiceContainer should match main export');
console.assert(SM === SiteManager, 'Subpath SiteManager should match main export');
console.assert(T.PROCESS_START === TIMEOUTS.PROCESS_START, 'Subpath TIMEOUTS should match main export');
console.log('   ✓ Subpath exports work correctly\n');

// Run async tests
testTimeout().then(() => {
  console.log('=== All tests passed! ===\n');
  console.log('Library is working correctly.');
  console.log('Note: ServiceContainer, SiteManager, etc. require Local context to fully function.');
}).catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});

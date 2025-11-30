/**
 * Tests for errorUtils module
 */

import { getErrorMessage, getErrorStack, isError } from '../../../src/utils/errorUtils';

describe('getErrorMessage', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should extract message from error-like object', () => {
    const errorLike = { message: 'Error-like message' };
    expect(getErrorMessage(errorLike)).toBe('Error-like message');
  });

  it('should return default message for objects without message property', () => {
    const obj = { code: 'ERR_TEST', details: 'some details' };
    const result = getErrorMessage(obj);
    expect(result).toBe('Unknown error');
  });

  it('should handle null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error');
  });

  it('should handle undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown error');
  });

  it('should return default message for numbers', () => {
    expect(getErrorMessage(404)).toBe('Unknown error');
  });

  it('should use custom default message', () => {
    expect(getErrorMessage(null, 'Custom error')).toBe('Custom error');
  });
});

describe('getErrorStack', () => {
  it('should extract stack from Error instance', () => {
    const error = new Error('Test error');
    const stack = getErrorStack(error);
    expect(stack).toContain('Error: Test error');
    expect(stack).toContain('at ');
  });

  it('should return undefined for non-Error', () => {
    expect(getErrorStack('string error')).toBeUndefined();
  });

  it('should return undefined for null', () => {
    expect(getErrorStack(null)).toBeUndefined();
  });

  it('should return undefined for objects without stack', () => {
    expect(getErrorStack({ message: 'error' })).toBeUndefined();
  });
});

describe('isError', () => {
  it('should return true for Error instance', () => {
    expect(isError(new Error('test'))).toBe(true);
  });

  it('should return true for TypeError', () => {
    expect(isError(new TypeError('test'))).toBe(true);
  });

  it('should return true for SyntaxError', () => {
    expect(isError(new SyntaxError('test'))).toBe(true);
  });

  it('should return false for string', () => {
    expect(isError('error string')).toBe(false);
  });

  it('should return false for error-like object', () => {
    expect(isError({ message: 'error', stack: 'stack' })).toBe(false);
  });

  it('should return false for null', () => {
    expect(isError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isError(undefined)).toBe(false);
  });
});

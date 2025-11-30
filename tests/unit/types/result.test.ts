/**
 * Tests for Result type and ok/err helpers
 */

import { ok, err, Result } from '../../../src/types';

describe('ok helper', () => {
  it('should create success result with data', () => {
    const result = ok('test data');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test data');
  });

  it('should create success result with number', () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });

  it('should create success result with object', () => {
    const data = { id: 1, name: 'test' };
    const result = ok(data);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: 'test' });
  });

  it('should create success result with array', () => {
    const result = ok([1, 2, 3]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('should create success result with null', () => {
    const result = ok(null);
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('should create success result with undefined', () => {
    const result = ok(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });
});

describe('err helper', () => {
  it('should create error result with string', () => {
    const result = err('Something went wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });

  it('should create error result with custom error type', () => {
    interface CustomError {
      code: string;
      message: string;
    }
    const result = err<CustomError>({ code: 'ERR_TEST', message: 'Test error' });
    expect(result.success).toBe(false);
    expect(result.error).toEqual({ code: 'ERR_TEST', message: 'Test error' });
  });
});

describe('Result type narrowing', () => {
  it('should narrow type on success check', () => {
    const result: Result<string> = ok('success');

    if (result.success) {
      // TypeScript should know result.data exists here
      expect(result.data).toBe('success');
    } else {
      // This branch should not be reached
      fail('Expected success result');
    }
  });

  it('should narrow type on failure check', () => {
    const result: Result<string> = err('failure');

    if (!result.success) {
      // TypeScript should know result.error exists here
      expect(result.error).toBe('failure');
    } else {
      // This branch should not be reached
      fail('Expected error result');
    }
  });

  it('should work with function returning Result', () => {
    function divide(a: number, b: number): Result<number> {
      if (b === 0) {
        return err('Division by zero');
      }
      return ok(a / b);
    }

    const success = divide(10, 2);
    expect(success.success).toBe(true);
    if (success.success) {
      expect(success.data).toBe(5);
    }

    const failure = divide(10, 0);
    expect(failure.success).toBe(false);
    if (!failure.success) {
      expect(failure.error).toBe('Division by zero');
    }
  });
});

/**
 * Result Type Pattern
 * Standardized return types for operations that can succeed or fail.
 * Provides explicit success/error handling without exceptions.
 */

/**
 * Success result
 */
export interface SuccessResult<T> {
  success: true;
  data: T;
}

/**
 * Error result
 */
export interface ErrorResult<E = string> {
  success: false;
  error: E;
}

/**
 * Result type - discriminated union for explicit error handling
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) return { success: false, error: 'Division by zero' };
 *   return { success: true, data: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.data); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = string> = SuccessResult<T> | ErrorResult<E>;

/**
 * Async result type alias
 */
export type AsyncResult<T, E = string> = Promise<Result<T, E>>;

/**
 * Helper to create a success result
 */
export function ok<T>(data: T): SuccessResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function err<E = string>(error: E): ErrorResult<E> {
  return { success: false, error };
}

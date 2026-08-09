import { writable } from 'svelte/store';
import { toastError } from './toast';

export interface AppError {
  id: string;
  message: string;
  description?: string;
  stack?: string;
  timestamp: number;
  handled: boolean;
}

export const errors = writable<AppError[]>([]);

let counter = 0;

export function reportError(
  error: Error | unknown,
  options: { description?: string; silent?: boolean } = {}
): string {
  const err = error instanceof Error ? error : new Error(String(error));
  const id = `err-${Date.now()}-${++counter}`;

  const appError: AppError = {
    id,
    message: err.message || '未知错误',
    description: options.description,
    stack: err.stack,
    timestamp: Date.now(),
    handled: false
  };

  errors.update((prev) => [appError, ...prev]);

  if (!options.silent) {
    toastError(appError.message, appError.description);
  }

  console.error('[AppError]', appError.message, err);

  return id;
}

export function markErrorHandled(id: string) {
  errors.update((prev) =>
    prev.map((e) => (e.id === id ? { ...e, handled: true } : e))
  );
}

export function clearErrors() {
  errors.set([]);
}

export function getUnhandledCount(): number {
  let count = 0;
  errors.subscribe((prev) => {
    count = prev.filter((e) => !e.handled).length;
  })();
  return count;
}

export function safeExecute<T>(
  fn: () => T,
  errorMessage?: string,
  fallback?: T
): T | undefined {
  try {
    return fn();
  } catch (e) {
    reportError(e, { description: errorMessage });
    return fallback;
  }
}

export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    reportError(e, { description: errorMessage });
    return fallback;
  }
}
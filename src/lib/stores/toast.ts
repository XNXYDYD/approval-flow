import { writable } from 'svelte/store';

export type ToastVariant = 'default' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

export const toasts = writable<Toast[]>([]);

let counter = 0;

export function showToast(
  message: string,
  options: { description?: string; variant?: ToastVariant; duration?: number } = {}
) {
  const id = `toast-${Date.now()}-${++counter}`;
  const toast: Toast = {
    id,
    message,
    description: options.description,
    variant: options.variant ?? 'default',
    duration: options.duration ?? 3000
  };

  toasts.update((t) => [...t, toast]);

  if (toast.duration > 0) {
    setTimeout(() => dismissToast(id), toast.duration);
  }

  return id;
}

export function dismissToast(id: string) {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}

export function toastSuccess(message: string, description?: string) {
  return showToast(message, { description, variant: 'success' });
}

export function toastError(message: string, description?: string) {
  return showToast(message, { description, variant: 'error' });
}
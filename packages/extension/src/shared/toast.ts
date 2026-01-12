/**
 * Toast notification system
 */

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;

/**
 * Create a toast ID
 */
export function createToastId(): string {
  return `toast-${Date.now()}-${toastIdCounter++}`;
}

/**
 * Default toast durations by type
 */
export const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
  warning: 4000,
};

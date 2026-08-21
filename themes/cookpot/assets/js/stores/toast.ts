import { writable } from 'svelte/store';
import type { ActiveToast, ToastOptions } from '../types';
import { generateInstanceId } from '../utils/ids';

export const DEFAULT_ACTION_DURATION = 5000;
export const DEFAULT_INFO_DURATION = 3000;

interface TimerState {
  id: string;
  timeoutId: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  remainingMs: number;
  isPaused: boolean;
  onDismiss?: () => void;
}

let activeTimer: TimerState | null = null;

const store = writable<ActiveToast | null>(null);

function clearActiveTimeout(): void {
  if (activeTimer?.timeoutId !== null && activeTimer?.timeoutId !== undefined) {
    clearTimeout(activeTimer.timeoutId);
    activeTimer.timeoutId = null;
  }
}

export function dismissToast(id?: string): void {
  if (!activeTimer) {
    store.set(null);
    return;
  }

  if (id !== undefined && activeTimer.id !== id) {
    return;
  }

  clearActiveTimeout();
  const dismissCallback = activeTimer.onDismiss;
  activeTimer = null;
  store.set(null);

  if (dismissCallback) {
    dismissCallback();
  }
}

export function pauseToast(): void {
  if (!activeTimer || activeTimer.isPaused) {
    return;
  }

  const elapsed = Date.now() - activeTimer.startedAt;
  activeTimer.remainingMs = Math.max(0, activeTimer.remainingMs - elapsed);
  clearActiveTimeout();
  activeTimer.isPaused = true;
}

export function resumeToast(): void {
  if (!activeTimer || !activeTimer.isPaused) {
    return;
  }

  const targetId = activeTimer.id;
  activeTimer.isPaused = false;
  activeTimer.startedAt = Date.now();
  const waitMs = Math.max(500, activeTimer.remainingMs);

  activeTimer.timeoutId = setTimeout(() => {
    dismissToast(targetId);
  }, waitMs);
}

export function showToast(options: ToastOptions): string {
  const id = options.id || generateInstanceId();
  const variant = options.variant || 'default';
  const duration =
    options.duration ??
    (options.action ? DEFAULT_ACTION_DURATION : DEFAULT_INFO_DURATION);

  clearActiveTimeout();

  activeTimer = {
    id,
    timeoutId: null,
    startedAt: Date.now(),
    remainingMs: duration,
    isPaused: false,
    onDismiss: options.onDismiss,
  };

  const toastItem: ActiveToast = {
    ...options,
    id,
    variant,
  };

  store.set(toastItem);

  if (duration > 0) {
    activeTimer.timeoutId = setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export const toastStore = {
  subscribe: store.subscribe,
  show: showToast,
  dismiss: dismissToast,
  pause: pauseToast,
  resume: resumeToast,
};

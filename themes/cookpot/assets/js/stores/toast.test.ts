import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  toastStore,
  showToast,
  dismissToast,
  pauseToast,
  resumeToast,
  DEFAULT_ACTION_DURATION,
  DEFAULT_INFO_DURATION,
} from './toast';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dismissToast();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows an informational toast and auto-dismisses after DEFAULT_INFO_DURATION', () => {
    const id = showToast({ message: 'Menu copied to clipboard' });
    const current = get(toastStore);

    expect(current).not.toBeNull();
    expect(current?.id).toBe(id);
    expect(current?.message).toBe('Menu copied to clipboard');
    expect(current?.variant).toBe('default');

    vi.advanceTimersByTime(DEFAULT_INFO_DURATION - 100);
    expect(get(toastStore)).not.toBeNull();

    vi.advanceTimersByTime(100);
    expect(get(toastStore)).toBeNull();
  });

  test('shows an actionable toast with longer default duration', () => {
    const handleUndo = vi.fn();
    showToast({
      message: 'Removed recipe from plan',
      action: { label: 'Undo', onClick: handleUndo },
      variant: 'favorite',
    });

    const current = get(toastStore);
    expect(current?.variant).toBe('favorite');
    expect(current?.action?.label).toBe('Undo');

    vi.advanceTimersByTime(DEFAULT_INFO_DURATION);
    expect(get(toastStore)).not.toBeNull();

    vi.advanceTimersByTime(DEFAULT_ACTION_DURATION - DEFAULT_INFO_DURATION);
    expect(get(toastStore)).toBeNull();
  });

  test('new toast immediately replaces previous active toast', () => {
    showToast({ message: 'First toast' });
    expect(get(toastStore)?.message).toBe('First toast');

    showToast({ message: 'Second toast' });
    expect(get(toastStore)?.message).toBe('Second toast');

    vi.advanceTimersByTime(DEFAULT_INFO_DURATION);
    expect(get(toastStore)).toBeNull();
  });

  test('explicit dismissToast clears the active toast and fires onDismiss callback', () => {
    const onDismiss = vi.fn();
    const id = showToast({ message: 'Dismissible toast', onDismiss });

    expect(get(toastStore)).not.toBeNull();
    dismissToast(id);

    expect(get(toastStore)).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('pauseToast and resumeToast properly freeze and resume the countdown timer', () => {
    showToast({ message: 'Pausable toast', duration: 4000 });

    vi.advanceTimersByTime(2000);
    pauseToast();

    // Advancing 3000ms while paused should not dismiss the toast
    vi.advanceTimersByTime(3000);
    expect(get(toastStore)).not.toBeNull();

    resumeToast();

    // Remaining time (~2000ms) needs to pass after resume
    vi.advanceTimersByTime(1900);
    expect(get(toastStore)).not.toBeNull();

    vi.advanceTimersByTime(200);
    expect(get(toastStore)).toBeNull();
  });
});

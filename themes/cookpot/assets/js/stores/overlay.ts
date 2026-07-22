import { writable, derived } from 'svelte/store';
import { ls } from '../utils/storage';

interface OverlayState {
  isMinimized: boolean;
  backHref: string | null;
  hasDashboard: boolean;
}

const MINIMIZED_KEY = 'cooking-dashboard-minimized';

function getInitialMinimized(): boolean {
  return ls.getString(MINIMIZED_KEY) === 'true';
}

const store = writable<OverlayState>({
  isMinimized: getInitialMinimized(),
  backHref: null,
  hasDashboard: false,
});

export const overlayStore = {
  subscribe: store.subscribe,
  setBackHref(href: string | null) {
    store.update((s) => ({ ...s, backHref: href }));
  },
  setHasDashboard(has: boolean) {
    store.update((s) => ({ ...s, hasDashboard: has }));
  },
  minimize() {
    ls.setString(MINIMIZED_KEY, 'true');
    store.update((s) => ({ ...s, isMinimized: true }));
  },
  expand() {
    ls.setString(MINIMIZED_KEY, 'false');
    store.update((s) => ({ ...s, isMinimized: false }));
  },
  toggle() {
    store.update((s) => {
      const next = !s.isMinimized;
      ls.setString(MINIMIZED_KEY, String(next));
      return { ...s, isMinimized: next };
    });
  },
};

/** True when the overlay has any content to display. */
export const overlayVisible = derived(
  store,
  ($s) => $s.hasDashboard || $s.backHref !== null,
);

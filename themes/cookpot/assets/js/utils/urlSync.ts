/**
 * Central Atomic URL Parameter Manager & Popstate Event Bus
 */

type UrlChangeCallback = (params: URLSearchParams) => void;

let listeners: UrlChangeCallback[] = [];
let pendingUpdates: Record<string, string | null> = {};
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let popstateInitialized = false;

function initPopstateListener() {
  if (popstateInitialized || typeof window === 'undefined') {
    return;
  }
  popstateInitialized = true;
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    listeners.forEach((cb) => cb(params));
  });
}

/**
 * Reads current URLSearchParams.
 */
export function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
}

/**
 * Registers a callback to be notified when the URL query parameters change (e.g. popstate).
 */
export function onUrlChange(cb: UrlChangeCallback): () => void {
  initPopstateListener();
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/**
 * Atomically updates URL query parameters without clobbering existing parameters owned by other stores.
 */
export function updateUrlParams(
  updates: Record<string, string | null>,
  mode: 'replace' | 'push' = 'replace',
  debounceMs = 150,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Merge into pending updates
  Object.assign(pendingUpdates, updates);

  const applyUpdates = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    const currentParams = new URLSearchParams(window.location.search);
    let changed = false;

    Object.entries(pendingUpdates).forEach(([key, val]) => {
      const currentVal = currentParams.get(key);
      if (val === null || val === undefined || val === '') {
        if (currentParams.has(key)) {
          currentParams.delete(key);
          changed = true;
        }
      } else if (currentVal !== val) {
        currentParams.set(key, val);
        changed = true;
      }
    });

    pendingUpdates = {};

    if (changed) {
      const searchStr = currentParams.toString();
      const newUrl =
        window.location.pathname +
        (searchStr ? `?${searchStr}` : '') +
        window.location.hash;

      if (mode === 'push') {
        window.history.pushState(null, '', newUrl);
      } else {
        window.history.replaceState(null, '', newUrl);
      }

      // Notify listeners
      listeners.forEach((cb) => cb(currentParams));
    }
  };

  if (debounceMs > 0) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(applyUpdates, debounceMs);
  } else {
    applyUpdates();
  }
}

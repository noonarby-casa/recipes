import type { Writable } from 'svelte/store';
import { getUrlParams, updateUrlParams, onUrlChange } from '../utils/urlSync';

export interface UrlSyncOptions<T> {
  paramKeys: string[];
  serialize: (state: T) => Record<string, string | null>;
  deserialize: (params: URLSearchParams) => Partial<T>;
  mode?: 'replace' | 'push';
  debounceMs?: number;
}

/**
 * Connects a Svelte Writable store bi-directionally to URL query parameters.
 */
export function syncStoreWithUrl<T>(
  store: Writable<T>,
  options: UrlSyncOptions<T>,
): () => void {
  const {
    paramKeys,
    serialize,
    deserialize,
    mode = 'replace',
    debounceMs = 150,
  } = options;

  let isUpdatingFromUrl = false;

  // Hydrate store from initial URL parameters if matching keys are present
  const initialParams = getUrlParams();
  const hasMatchingKeys = paramKeys.some((k) => initialParams.has(k));
  if (hasMatchingKeys) {
    const deserialized = deserialize(initialParams);
    store.update((current) => ({ ...current, ...deserialized }));
  }

  // Subscribe to store updates and update URL
  const unsubscribeStore = store.subscribe(($state) => {
    if (isUpdatingFromUrl) {
      return;
    }
    const updates = serialize($state);
    updateUrlParams(updates, mode, debounceMs);
  });

  // Subscribe to external URL changes (e.g. popstate)
  const unsubscribeUrl = onUrlChange((params) => {
    isUpdatingFromUrl = true;
    try {
      const deserialized = deserialize(params);
      store.update((current) => ({ ...current, ...deserialized }));
    } finally {
      isUpdatingFromUrl = false;
    }
  });

  return () => {
    unsubscribeStore();
    unsubscribeUrl();
  };
}

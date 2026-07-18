/**
 * @fileoverview Manages local favorites storage and API.
 */

const STORAGE_KEY = 'noonarby_favorites';

/**
 * Retrieves the list of favorited recipe shortId strings from localStorage.
 */
export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch (err) {
    console.error('Error parsing favorites storage:', err);
    return [];
  }
}

/**
 * Checks if a recipe shortId is favorited.
 */
export function isFavorite(shortId: string): boolean {
  if (!shortId) {
    return false;
  }
  const favorites = getFavorites();
  return favorites.includes(shortId);
}

/**
 * Adds a recipe shortId to favorites if not already present.
 */
export function addFavorite(shortId: string): void {
  if (!shortId) {
    return;
  }
  const favorites = getFavorites();
  if (!favorites.includes(shortId)) {
    favorites.push(shortId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

/**
 * Removes a recipe shortId from favorites.
 */
export function removeFavorite(shortId: string): void {
  if (!shortId) {
    return;
  }
  const favorites = getFavorites();
  const index = favorites.indexOf(shortId);
  if (index !== -1) {
    favorites.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

/**
 * Toggles a recipe shortId's favorite state. Returns the new state.
 */
export function toggleFavorite(shortId: string): boolean {
  if (!shortId) {
    return false;
  }
  const favorites = getFavorites();
  const index = favorites.indexOf(shortId);
  if (index !== -1) {
    favorites.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return false;
  } else {
    favorites.push(shortId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return true;
  }
}

/**
 * Updates UI favorite states across all elements with `data-short-id` matching the given ID.
 */
export function syncFavoriteUI(shortId: string, isFav: boolean): void {
  const elements = document.querySelectorAll(`[data-short-id="${shortId}"]`);
  elements.forEach((el) => {
    // If it's a toggle button
    if (el.classList.contains('recipe-favorite-btn')) {
      el.classList.toggle('is-favorite', isFav);
      el.setAttribute('aria-pressed', String(isFav));

      // Trigger keyframe micro-animation on heart icon
      const heartIcon = el.querySelector('.heart-icon');
      if (heartIcon) {
        heartIcon.classList.remove('pop-anim');
        // Force reflow to restart animation
        void (heartIcon as HTMLElement).offsetWidth;
        heartIcon.classList.add('pop-anim');
      }
    }
    // If it's a read-only badge overlay (e.g. on thumbnail images)
    if (el.classList.contains('recipe-favorite-badge')) {
      (el as HTMLElement).style.display = isFav ? 'flex' : 'none';
    }
  });
}

/**
 * Initializes favorite UI components on page load.
 */
export function initFavorites(): void {
  // Setup click listeners for any recipe favorite buttons (single page / modal edit details)
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.recipe-favorite-btn') as HTMLElement | null;
    if (!btn) {
      return;
    }
    const shortId = btn.getAttribute('data-short-id');
    if (shortId) {
      const isFav = toggleFavorite(shortId);
      syncFavoriteUI(shortId, isFav);

      // Dispatch a custom event to notify other modules (like Search or Planner)
      const event = new CustomEvent('favoritesChanged', {
        detail: { shortId, isFavorite: isFav },
      });
      document.dispatchEvent(event);
    }
  });

  // Perform initial render of all favorites on load
  const favorites = getFavorites();

  // Set all badges
  const badges = document.querySelectorAll('.recipe-favorite-badge');
  badges.forEach((badge) => {
    const shortId = badge.getAttribute('data-short-id');
    if (shortId) {
      const isFav = favorites.includes(shortId);
      (badge as HTMLElement).style.display = isFav ? 'flex' : 'none';
    }
  });

  // Set all toggle buttons
  const buttons = document.querySelectorAll('.recipe-favorite-btn');
  buttons.forEach((btn) => {
    const shortId = btn.getAttribute('data-short-id');
    if (shortId) {
      const isFav = favorites.includes(shortId);
      btn.classList.toggle('is-favorite', isFav);
      btn.setAttribute('aria-pressed', String(isFav));
    }
  });
}

// removed scaleTextQuantities
import { processShoppingList } from './shopping-list/pipeline';
import { formatCookingNumber } from './units';
import { ShoppingItem, IngredientInput } from './shopping-list/types';
import { initToggleGroup } from './components/toggle';
import { getStoreSection } from './shopping-list/store-sections';
import { OverlayContainer } from './components/overlay-container';

interface Recipe {
  title: string;
  permalink: string;
  shortId?: string;
  date: string;
  times: { step: string; time: string }[];
  recipeSource?: string;
  tags?: string[];
  ingredients: (string | IngredientInput)[];
  servings: number;
  summary: string;
}

interface PlannedRecipe {
  instanceId: string;
  permalink: string;
  scale: number;
  day: string; // 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', or 'supplemental'
}

// Client State
let planState: PlannedRecipe[] = [];
let recipesIndex: Recipe[] = [];
const includedTags: Set<string> = new Set();
const excludedTags: Set<string> = new Set();
const includedSources: Set<string> = new Set();
const excludedSources: Set<string> = new Set();
let searchQuery = '';
const checkedIngredients: Set<string> = new Set();
let staplesExpanded = false;
let keyboardFocusedIndex = -1;

// Overhauled States
let editMode = true; // Edit UX vs. View UX
let workWeekOnly = false; // 5-Day Week vs 7-Day Week
let activeTargetDay: string | null = null; // Target day when opening search modal

// Undo Recovery State
let lastRemovedRecipe: PlannedRecipe | null = null;
let lastRemovedIndex: number | null = null;
let undoToastTimeout: number | null = null;

// Swipe Navigation State
let swipeStartX = 0;
let swipeStartY = 0;
let activeMobileTab = 'view-plan'; // 'edit-plan' | 'view-plan' | 'shopping-list'

const STORAGE_KEY = 'noonarby-meal-plan';
const SETTINGS_KEY = 'noonarby-meal-plan-settings';
const FILTERS_KEY = 'noonarby-meal-plan-filters';

// Constants
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES: Record<string, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

const DAY_CODES: Record<string, string> = {
  sun: '0',
  mon: '1',
  tue: '2',
  wed: '3',
  thu: '4',
  fri: '5',
  sat: '6',
  supplemental: '7',
};

const CODE_TO_DAYS: Record<string, string> = {
  '0': 'sun',
  '1': 'mon',
  '2': 'tue',
  '3': 'wed',
  '4': 'thu',
  '5': 'fri',
  '6': 'sat',
  '7': 'supplemental',
};

/**
 * Normalization helper for checklist indexing key
 */
function getIngredientKey(
  isStaple: boolean,
  unit: string,
  rest: string,
): string {
  const stapleStr = isStaple ? 'staple' : 'buy';
  const normalizedUnit = (unit || '').trim().toLowerCase();
  const normalizedRest = (rest || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${stapleStr}_${normalizedUnit}_${normalizedRest}`;
}

/**
 * Returns base path for URL redirects
 */
function getSiteBasePath(): string {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/recipes/')) {
    return '/recipes/';
  }
  return '/';
}

/**
 * Main Initializer for the Meal Planner Page
 */
export function initMealPlanner(): void {
  const container = document.getElementById('meal-planner');
  if (!container) {
    return;
  } // Only run on planner page

  loadSettings();
  loadFilters();
  setupUIThemeClass();
  setupEventListeners();
  setupMobileSwipeGestures();

  // Load index.json dynamically
  const basePath = getSiteBasePath();
  fetch(`${basePath}index.json`)
    .then((res) => res.json())
    .then((data: Recipe[]) => {
      recipesIndex = data;

      // Load settings (sets workWeekOnly to local setting)
      loadSettings();
      const localWorkWeekOnly = workWeekOnly;

      // Parse shared URL params
      const hasUrlParams = parseUrlParams();
      const urlPlan = [...planState];

      let urlWorkWeekOnly = localWorkWeekOnly;
      if (hasUrlParams) {
        const urlParams = new URLSearchParams(window.location.search);
        urlWorkWeekOnly = (urlParams.get('w') || urlParams.get('week')) === '5';
      }

      const localRaw = localStorage.getItem(STORAGE_KEY);
      const localPlanExists = !!localRaw;
      let localPlan: PlannedRecipe[] = [];
      if (localPlanExists) {
        try {
          localPlan = JSON.parse(localRaw || '[]');
        } catch {
          localPlan = [];
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const rawMode = urlParams.get('m') || urlParams.get('mode');
      const urlMode =
        rawMode === 'e'
          ? 'edit'
          : rawMode === 's'
            ? 'shop'
            : rawMode === 'v'
              ? 'view'
              : rawMode;

      const hasConflict =
        hasUrlParams &&
        localPlanExists &&
        (urlWorkWeekOnly !== localWorkWeekOnly ||
          !arePlansEqual(urlPlan, localPlan));

      if (hasConflict) {
        // Option C Conflict Resolution Banner
        const banner = document.getElementById('plan-conflict-banner');
        if (banner) {
          banner.style.display = 'flex';
        }

        // View shared plan with URL week layout preview
        workWeekOnly = urlWorkWeekOnly;

        // Default to View UX and hide edit triggers
        switchTab('view-plan');
        const modeHeader = document.querySelector(
          '.planner-mode-header',
        ) as HTMLElement;
        if (modeHeader) {
          modeHeader.style.display = 'none';
        }
      } else if (hasUrlParams) {
        // Commit URL plan immediately if local is empty or identical
        planState = urlPlan;
        workWeekOnly = urlWorkWeekOnly;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));
        saveSettings();

        // Navigate to the target mode
        if (urlMode === 'edit') {
          switchTab('edit-plan');
        } else if (urlMode === 'shop') {
          switchTab('shopping-list');
        } else {
          switchTab('view-plan');
        }
      } else {
        // Fallback to local storage and sync URL params to match
        loadStateFromStorage();
        workWeekOnly = localWorkWeekOnly;
        saveStateToStorageAndUrl(true);

        // Navigate to the target mode
        if (urlMode === 'edit') {
          switchTab('edit-plan');
        } else if (urlMode === 'shop') {
          switchTab('shopping-list');
        } else {
          switchTab('view-plan'); // Default to view-plan
        }
      }

      buildTagCloud();
      buildSourceCloud();
      renderUI();
    })
    .catch((err) => console.error('Error loading recipes search index:', err));
}

/**
 * Setup layout class on body
 */
function setupUIThemeClass(): void {
  document.body.classList.add('meal-planner-layout');
}

/**
 * Loads user settings from storage
 */
function loadSettings(): void {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.workWeekOnly !== undefined) {
        workWeekOnly = !!parsed.workWeekOnly;
      }
      if (parsed.chkOmitCompleted !== undefined) {
        const chk = document.getElementById(
          'chk-omit-completed',
        ) as HTMLInputElement;
        if (chk) {
          chk.checked = !!parsed.chkOmitCompleted;
        }
      }
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

/**
 * Saves user settings
 */
function saveSettings(): void {
  const chk = document.getElementById('chk-omit-completed') as HTMLInputElement;
  const settings = {
    workWeekOnly,
    chkOmitCompleted: chk ? chk.checked : false,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Returns the list of recipes matching active tag and source filters
 */
function getFilteredRecipes(): Recipe[] {
  return recipesIndex.filter((r) => {
    let matchesIncludedTags = true;
    for (const tag of includedTags) {
      if (r.tags === undefined || !r.tags.includes(tag)) {
        matchesIncludedTags = false;
        break;
      }
    }

    let matchesExcludedTags = true;
    for (const tag of excludedTags) {
      if (r.tags !== undefined && r.tags.includes(tag)) {
        matchesExcludedTags = false;
        break;
      }
    }

    const matchesIncludedSources =
      includedSources.size === 0 ||
      (r.recipeSource !== undefined && includedSources.has(r.recipeSource));
    const matchesExcludedSources =
      r.recipeSource === undefined || !excludedSources.has(r.recipeSource);

    return (
      matchesIncludedTags &&
      matchesExcludedTags &&
      matchesIncludedSources &&
      matchesExcludedSources
    );
  });
}

/**
 * Loads active tag and source filters from LocalStorage
 */
function loadFilters(): void {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      includedTags.clear();
      excludedTags.clear();
      includedSources.clear();
      excludedSources.clear();

      if (parsed.includedTags) {
        for (const tag of parsed.includedTags) {
          includedTags.add(tag);
        }
      }
      if (parsed.excludedTags) {
        for (const tag of parsed.excludedTags) {
          excludedTags.add(tag);
        }
      }
      if (parsed.includedSources) {
        for (const src of parsed.includedSources) {
          includedSources.add(src);
        }
      }
      if (parsed.excludedSources) {
        for (const src of parsed.excludedSources) {
          excludedSources.add(src);
        }
      }
    }
  } catch (e) {
    console.error('Error loading filters from storage:', e);
  }
}

/**
 * Saves active tag and source filters to LocalStorage
 */
function saveFilters(): void {
  try {
    const data = {
      includedTags: Array.from(includedTags),
      excludedTags: Array.from(excludedTags),
      includedSources: Array.from(includedSources),
      excludedSources: Array.from(excludedSources),
    };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving filters to storage:', e);
  }
}

/**
 * Bind UI interaction triggers
 */
function setupEventListeners(): void {
  // Mode Toggles
  const btnEdit = document.getElementById('mode-edit-btn');
  const btnView = document.getElementById('mode-view-btn');
  const btnShop = document.getElementById('mode-shop-btn');
  if (btnEdit && btnView && btnShop) {
    btnEdit.classList.toggle('active', activeMobileTab === 'edit-plan');
    btnView.classList.toggle('active', activeMobileTab === 'view-plan');
    btnShop.classList.toggle('active', activeMobileTab === 'shopping-list');
  }
  initToggleGroup('.mode-toggle-group', (value) => {
    if (value === 'mode-edit-btn') {
      switchTab('edit-plan');
    } else if (value === 'mode-view-btn') {
      switchTab('view-plan');
    } else if (value === 'mode-shop-btn') {
      switchTab('shopping-list');
    }
  });

  // 5-Day vs 7-Day Toggles
  initToggleGroup('.week-toggle-group', (value) => {
    workWeekOnly = value === 'week-5day-btn';
    saveSettings();
    saveStateToStorageAndUrl(true);
    renderUI();
  });

  // Global Portions Scaler (+/-)
  const btnGlobalDec = document.getElementById('global-dec-btn');
  const btnGlobalInc = document.getElementById('global-inc-btn');
  if (btnGlobalDec && btnGlobalInc) {
    btnGlobalDec.addEventListener('click', () => adjustGlobalPortions(-1));
    btnGlobalInc.addEventListener('click', () => adjustGlobalPortions(1));
  }

  // Action Buttons
  const btnShare = document.getElementById('btn-share-plan');
  const btnClear = document.getElementById('btn-clear-plan');
  const btnGenerate = document.getElementById('btn-generate-plan');
  const btnToggleFilters = document.getElementById('btn-toggle-filters');
  if (btnShare) {
    btnShare.addEventListener('click', sharePlanUrl);
  }
  if (btnClear) {
    btnClear.addEventListener('click', clearPlannerState);
  }
  if (btnGenerate) {
    btnGenerate.addEventListener('click', generateDinnerPlan);
  }
  // Filters Modal
  const filtersModal = document.getElementById('planner-filters-modal');
  const btnCloseFilters = document.getElementById('btn-close-filters-modal');
  const btnClearFilters = document.getElementById('btn-modal-clear-filters');

  if (btnToggleFilters) {
    btnToggleFilters.addEventListener('click', openFiltersModal);
  }
  if (btnCloseFilters) {
    btnCloseFilters.addEventListener('click', closeFiltersModal);
  }
  if (filtersModal) {
    filtersModal.addEventListener('click', (e) => {
      if (e.target === filtersModal) {
        closeFiltersModal();
      }
    });
  }
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      includedTags.clear();
      excludedTags.clear();
      includedSources.clear();
      excludedSources.clear();
      saveFilters();
      buildTagCloud();
      buildSourceCloud();
      renderUI();
      closeFiltersModal();
    });
  }

  // Selector Modal
  const modal = document.getElementById('planner-select-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const searchInput = document.getElementById(
    'planner-search-input',
  ) as HTMLInputElement;

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && modal.style.display === 'flex') {
        closeModal();
      }
      if (filtersModal && filtersModal.style.display === 'flex') {
        closeFiltersModal();
      }
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      keyboardFocusedIndex = -1;
      renderModalBrowseShelf();
    });
    searchInput.addEventListener('keydown', handleModalSearchKeydowns);
  }

  // Drag-to-Trash Zone Bindings
  const trashZone = document.getElementById('planner-trash-zone');
  if (trashZone) {
    trashZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      trashZone.classList.add('drag-over');
    });
    trashZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      trashZone.classList.add('drag-over');
    });
    trashZone.addEventListener('dragleave', () => {
      trashZone.classList.remove('drag-over');
    });
    trashZone.addEventListener('drop', (e) => {
      e.preventDefault();
      trashZone.classList.remove('drag-over');
      const draggedId = e.dataTransfer?.getData('text/plain');
      if (draggedId) {
        removeRecipeWithRecovery(draggedId);
      }
    });
  }

  // Conflict Resolution Banner (Option C compare & actions)
  const bannerCompareShared = document.getElementById('btn-compare-shared');
  const bannerCompareLocal = document.getElementById('btn-compare-local');
  const bannerBtnKeep = document.getElementById('btn-banner-keep');
  const bannerBtnLoad = document.getElementById('btn-banner-load');
  const bannerBtnMerge = document.getElementById('btn-banner-merge');

  if (bannerCompareShared && bannerCompareLocal) {
    bannerCompareShared.addEventListener('click', () => {
      bannerCompareShared.classList.add('active');
      bannerCompareLocal.classList.remove('active');
      const urlParams = new URLSearchParams(window.location.search);
      const urlWeek = (urlParams.get('w') || urlParams.get('week')) === '5';
      workWeekOnly = urlWeek;
      parseUrlParams();
      renderUI();
    });
    bannerCompareLocal.addEventListener('click', () => {
      bannerCompareLocal.classList.add('active');
      bannerCompareShared.classList.remove('active');
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed.workWeekOnly !== undefined) {
            workWeekOnly = !!parsed.workWeekOnly;
          }
        }
      } catch {
        // Ignore settings parse error and keep current state
      }
      loadStateFromStorage();
      renderUI();
    });
  }

  if (bannerBtnKeep) {
    bannerBtnKeep.addEventListener('click', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const rawMode = urlParams.get('m') || urlParams.get('mode');
      const targetMode =
        rawMode === 'e'
          ? 'edit'
          : (rawMode === 's' ? 'shop' : rawMode === 'v' ? 'view' : rawMode) ||
            'view';
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed.workWeekOnly !== undefined) {
            workWeekOnly = !!parsed.workWeekOnly;
          }
        }
      } catch {
        // Ignore settings parse error and keep current state
      }
      loadStateFromStorage();
      hideConflictBanner();
      saveStateToStorageAndUrl(true);
      saveSettings();

      if (targetMode === 'edit') {
        switchTab('edit-plan');
      } else if (targetMode === 'shop') {
        switchTab('shopping-list');
      } else {
        switchTab('view-plan');
      }
    });
  }
  if (bannerBtnLoad) {
    bannerBtnLoad.addEventListener('click', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const rawMode = urlParams.get('m') || urlParams.get('mode');
      const targetMode =
        rawMode === 'e'
          ? 'edit'
          : (rawMode === 's' ? 'shop' : rawMode === 'v' ? 'view' : rawMode) ||
            'view';
      const urlWeek = (urlParams.get('w') || urlParams.get('week')) === '5';
      workWeekOnly = urlWeek;
      parseUrlParams();
      hideConflictBanner();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));
      saveStateToStorageAndUrl(true);
      saveSettings();

      if (targetMode === 'edit') {
        switchTab('edit-plan');
      } else if (targetMode === 'shop') {
        switchTab('shopping-list');
      } else {
        switchTab('view-plan');
      }
    });
  }
  if (bannerBtnMerge) {
    bannerBtnMerge.addEventListener('click', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const rawMode = urlParams.get('m') || urlParams.get('mode');
      const targetMode =
        rawMode === 'e'
          ? 'edit'
          : (rawMode === 's' ? 'shop' : rawMode === 'v' ? 'view' : rawMode) ||
            'view';
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed.workWeekOnly !== undefined) {
            workWeekOnly = !!parsed.workWeekOnly;
          }
        }
      } catch {
        // Ignore settings parse error and keep current state
      }
      const currentLocal = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]',
      ) as PlannedRecipe[];

      parseUrlParams(); // Loads URL planState
      const urlItems = [...planState];

      // Merge collision-free
      planState = mergePlans(currentLocal, urlItems);

      hideConflictBanner();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));
      saveStateToStorageAndUrl(true);
      saveSettings();

      if (targetMode === 'edit') {
        switchTab('edit-plan');
      } else if (targetMode === 'shop') {
        switchTab('shopping-list');
      } else {
        switchTab('view-plan');
      }
    });
  }

  // Shopping list triggers
  const btnResetList = document.getElementById('btn-reset-shopping-list');
  if (btnResetList) {
    btnResetList.addEventListener('click', () => {
      checkedIngredients.clear();
      saveCheckedState();
      renderUI();
    });
  }

  const btnCopyList = document.getElementById('btn-copy-combined-list');
  if (btnCopyList) {
    if (btnCopyList.tagName === 'SELECT') {
      btnCopyList.addEventListener('change', (e) => {
        const select = e.currentTarget as HTMLSelectElement;
        const format = select.value;
        if (format === 'markdown' || format === 'google-keep') {
          copyShoppingListToClipboard(format as 'markdown' | 'google-keep');
        }
      });
    } else {
      btnCopyList.addEventListener('click', () =>
        copyShoppingListToClipboard('markdown'),
      );
    }
  }

  const btnCopyMenu = document.getElementById('btn-copy-menu-text');
  if (btnCopyMenu) {
    btnCopyMenu.addEventListener('click', copyMenuTextToClipboard);
  }

  const chkOmit = document.getElementById(
    'chk-omit-completed',
  ) as HTMLInputElement;
  if (chkOmit) {
    chkOmit.addEventListener('change', () => {
      saveSettings();
      renderUI();
    });
  }

  document.addEventListener('store-layout:change', () => {
    renderUI();
  });

  const btnToggleStaples = document.getElementById('btn-toggle-staples');
  if (btnToggleStaples) {
    btnToggleStaples.addEventListener('click', () => {
      staplesExpanded = !staplesExpanded;
      renderUI();
    });
  }

  // Mobile column tab triggers
}

/**
 * Touch gesture swipe actions for mobile screens
 */
function setupMobileSwipeGestures(): void {
  document.addEventListener(
    'touchstart',
    (e) => {
      if (window.innerWidth >= 768) {
        return;
      } // Desktop uses side-by-side scrolling
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchend',
    (e) => {
      if (window.innerWidth >= 768) {
        return;
      }
      const modal = document.getElementById('planner-select-modal');
      if (modal && modal.style.display === 'flex') {
        return;
      } // Block swiping when modal is active

      const deltaX = e.changedTouches[0].clientX - swipeStartX;
      const deltaY = e.changedTouches[0].clientY - swipeStartY;

      // Detect horizontal swipe with low vertical drift
      if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 50) {
        const tabs = ['edit-plan', 'view-plan', 'shopping-list'];
        let idx = tabs.indexOf(activeMobileTab);
        if (deltaX < 0) {
          // Swipe Left: Next Tab
          idx = Math.min(tabs.length - 1, idx + 1);
        } else {
          // Swipe Right: Prev Tab
          idx = Math.max(0, idx - 1);
        }
        switchTab(tabs[idx]);
      }
    },
    { passive: true },
  );
}

/**
 * Switches the active planner view state (Edit vs View vs Shopping List)
 */
function switchTab(tabId: string): void {
  activeMobileTab = tabId;
  editMode = tabId === 'edit-plan';

  const btnEdit = document.getElementById('mode-edit-btn');
  const btnView = document.getElementById('mode-view-btn');
  const btnShop = document.getElementById('mode-shop-btn');

  if (btnEdit) {
    btnEdit.classList.toggle('active', tabId === 'edit-plan');
  }
  if (btnView) {
    btnView.classList.toggle('active', tabId === 'view-plan');
  }
  if (btnShop) {
    btnShop.classList.toggle('active', tabId === 'shopping-list');
  }

  // Sync mode parameter to the URL (unless in preview conflict mode)
  const banner = document.getElementById('plan-conflict-banner');
  const isConflict = banner && banner.style.display === 'flex';
  if (!isConflict) {
    saveStateToStorageAndUrl(true);
  }

  renderUI();
}

/**
 * Hides conflict resolution overlay and restores mode triggers
 */
function hideConflictBanner(): void {
  const banner = document.getElementById('plan-conflict-banner');
  if (banner) {
    banner.style.display = 'none';
  }

  const modeHeader = document.querySelector(
    '.planner-mode-header',
  ) as HTMLElement;
  if (modeHeader) {
    modeHeader.style.display = 'flex';
  }
}

/**
 * Adjust portions on every card by offset factor (+1 / -1)
 */
function adjustGlobalPortions(offset: number): void {
  planState.forEach((planned) => {
    const rec = recipesIndex.find((r) => r.permalink === planned.permalink);
    if (!rec) {
      return;
    }
    const currentPortions = Math.round(planned.scale * rec.servings);
    const nextPortions = Math.max(1, currentPortions + offset);
    planned.scale = nextPortions / rec.servings;
  });
  saveStateToStorageAndUrl(true);
  renderUI();
}

/**
 * Deletes recipe and saves undo backup state
 */
function removeRecipeWithRecovery(instanceId: string): void {
  const idx = planState.findIndex((p) => p.instanceId === instanceId);
  if (idx === -1) {
    return;
  }

  const target = planState[idx];
  const rec = recipesIndex.find((r) => r.permalink === target.permalink);
  const title = rec ? rec.title : 'Recipe';

  // Cache removal
  lastRemovedRecipe = { ...target };
  lastRemovedIndex = idx;

  // Splice out
  planState.splice(idx, 1);
  saveStateToStorageAndUrl(true);
  renderUI();

  // Show recovery undo toast notification
  showUndoToast(
    `Removed <strong>${title}</strong> from ${DAY_NAMES[target.day]}.`,
  );
}

/**
 * Renders Recovery Toast with Undo trigger
 */
function showUndoToast(message: string): void {
  // Clear any existing toasts and timeouts
  if (undoToastTimeout) {
    clearTimeout(undoToastTimeout);
  }
  const existing = document.querySelector('.plan-toast-notification');
  if (existing) {
    existing.remove();
  }

  const overlay = OverlayContainer.getInstance();
  const toast = document.createElement('div');
  toast.className = 'plan-toast-notification';

  toast.innerHTML = `
    <div class="toast-body">
      <span>${message}</span>
      <button type="button" class="toast-undo-btn" id="btn-undo-remove">Undo</button>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Dismiss toast">✕</button>
  `;

  const undoBtn = toast.querySelector('#btn-undo-remove');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (lastRemovedRecipe !== null && lastRemovedIndex !== null) {
        planState.splice(lastRemovedIndex, 0, lastRemovedRecipe);
        lastRemovedRecipe = null;
        lastRemovedIndex = null;
        saveStateToStorageAndUrl(true);
        renderUI();
        overlay.remove(toast);
      }
    });
  }

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.remove(toast));
  }

  overlay.add(toast);

  // Auto-dismiss after 6 seconds
  undoToastTimeout = window.setTimeout(() => {
    overlay.remove(toast);
  }, 6000);
}

/**
 * Open Modal Dialog
 */
function openModal(day: string): void {
  activeTargetDay = day;
  const modal = document.getElementById('planner-select-modal');
  const title = document.getElementById('modal-title-day');
  const searchInput = document.getElementById(
    'planner-search-input',
  ) as HTMLInputElement;
  const activeTagsNotice = document.getElementById('modal-active-tags-notice');

  if (modal && title && searchInput) {
    title.textContent =
      day === 'supplemental'
        ? 'Add Supplemental Recipe'
        : `Add Recipe to ${DAY_NAMES[day]}`;
    searchInput.value = '';
    searchQuery = '';
    keyboardFocusedIndex = -1;
    modal.style.display = 'flex';

    // Active filters notice
    if (activeTagsNotice) {
      const activeFilters: string[] = [];
      for (const tag of includedTags) {
        activeFilters.push(`+${tag}`);
      }
      for (const tag of excludedTags) {
        activeFilters.push(`-${tag}`);
      }
      for (const src of includedSources) {
        activeFilters.push(`+${src}`);
      }
      for (const src of excludedSources) {
        activeFilters.push(`-${src}`);
      }

      if (activeFilters.length > 0) {
        activeTagsNotice.textContent = `Applying active filters: ${activeFilters.join(', ')}`;
        activeTagsNotice.style.display = 'block';
      } else {
        activeTagsNotice.style.display = 'none';
      }
    }

    renderModalBrowseShelf();
    buildTagCloud(); // Sync tag cloud active state
    buildSourceCloud(); // Sync source cloud active state

    // Focus input cursor
    setTimeout(() => searchInput.focus(), 50);
  }
}

/**
 * Close Modal Dialog
 */
function closeModal(): void {
  const modal = document.getElementById('planner-select-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  activeTargetDay = null;
}

/**
 * Open Filters Modal
 */
function openFiltersModal(): void {
  const modal = document.getElementById('planner-filters-modal');
  if (modal) {
    modal.style.display = 'flex';
    buildTagCloud();
  }
}

/**
 * Close Filters Modal
 */
function closeFiltersModal(): void {
  const modal = document.getElementById('planner-filters-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Adds recipe selection to slot
 */
function addRecipeToDay(
  day: string,
  permalink: string,
  flashId?: string,
): void {
  const instanceId =
    flashId || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  planState.push({
    instanceId,
    permalink,
    scale: 1.0,
    day,
  });

  saveStateToStorageAndUrl(true);
  renderUI(instanceId);
}

/**
 * Swaps a planned recipe card with a random candidate recipe
 */
function swapRecipe(instanceId: string): void {
  const idx = planState.findIndex((p) => p.instanceId === instanceId);
  if (idx === -1) {
    return;
  }
  const item = planState[idx];

  const dayMeals = planState.filter((p) => p.day === item.day);
  const isDinnerSlot =
    item.day !== 'supplemental' && dayMeals.indexOf(item) === 0;

  // Build pool of candidate recipes
  let pool = getFilteredRecipes();
  if (isDinnerSlot) {
    pool = pool.filter(
      (r) => r.tags && r.tags.some((t) => t.toLowerCase() === 'dinner'),
    );
  }

  // Filter out already planned recipes to avoid duplicates
  const plannedPermalinks = new Set(planState.map((p) => p.permalink));
  let candidates = pool.filter((r) => !plannedPermalinks.has(r.permalink));

  // Fallback to pool minus current item if everything is planned
  if (candidates.length === 0) {
    candidates = pool.filter((r) => r.permalink !== item.permalink);
  }
  if (candidates.length === 0) {
    candidates = pool;
  }

  if (candidates.length === 0) {
    return;
  }

  const randomRec = candidates[Math.floor(Math.random() * candidates.length)];
  item.permalink = randomRec.permalink;

  saveStateToStorageAndUrl(true);
  renderUI(instanceId);
}

/**
 * Automatically populates empty dinner slots for active days with random dinner recipes
 */
function generateDinnerPlan(): void {
  if (recipesIndex.length === 0) {
    return;
  }

  const activeDays = workWeekOnly ? DAYS.slice(1, 6) : DAYS;

  // Find all dinner recipes
  const dinnerPool = getFilteredRecipes().filter(
    (r) => r.tags && r.tags.some((t) => t.toLowerCase() === 'dinner'),
  );
  if (dinnerPool.length === 0) {
    return;
  }

  let planChanged = false;

  activeDays.forEach((day) => {
    // Check if the day has any recipe (first item is dinner)
    const hasDinner = planState.some((p) => p.day === day);
    if (!hasDinner) {
      // Find all dinner recipes not currently planned anywhere
      const plannedPermalinks = new Set(planState.map((p) => p.permalink));
      let candidates = dinnerPool.filter(
        (r) => !plannedPermalinks.has(r.permalink),
      );

      // Fallback to all dinner recipes if all are already planned
      if (candidates.length === 0) {
        candidates = dinnerPool;
      }

      const randomRec =
        candidates[Math.floor(Math.random() * candidates.length)];
      planState.push({
        instanceId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        permalink: randomRec.permalink,
        scale: 1.0,
        day,
      });
      planChanged = true;
    }
  });

  if (planChanged) {
    saveStateToStorageAndUrl(true);
    renderUI();
  }
}

/**
 * Autocomplete selector arrow key navigation
 */
function handleModalSearchKeydowns(e: KeyboardEvent): void {
  const cards = document.querySelectorAll(
    '#planner-browse-shelf .browse-card',
  ) as NodeListOf<HTMLElement>;
  if (cards.length === 0) {
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    keyboardFocusedIndex = (keyboardFocusedIndex + 1) % cards.length;
    updateKeyboardFocusedCard(cards);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    keyboardFocusedIndex =
      (keyboardFocusedIndex - 1 + cards.length) % cards.length;
    updateKeyboardFocusedCard(cards);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (keyboardFocusedIndex >= 0 && keyboardFocusedIndex < cards.length) {
      cards[keyboardFocusedIndex].click();
    } else {
      // Add first card
      cards[0].click();
    }
  }
}

/**
 * Cycles keyboard highlights in modal shelf
 */
function updateKeyboardFocusedCard(cards: NodeListOf<HTMLElement>): void {
  cards.forEach((card, idx) => {
    if (idx === keyboardFocusedIndex) {
      card.classList.add('keyboard-focused');
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      card.classList.remove('keyboard-focused');
    }
  });
}

/**
 * Render items inside the Modal Browse Suggestion Shelf
 */
function renderModalBrowseShelf(): void {
  const shelf = document.getElementById('planner-browse-shelf');
  if (!shelf) {
    return;
  }

  // Filter recipes index by persistent tag/source filters and text input queries
  let matches = getFilteredRecipes();

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    matches = matches.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }

  if (matches.length === 0) {
    shelf.innerHTML = `<div class="planner-empty-state">No matching recipes found</div>`;
    return;
  }

  const plannedSet = new Set(planState.map((p) => p.permalink));
  const basePath = getSiteBasePath();

  shelf.innerHTML = matches
    .map((r) => {
      const isPlanned = plannedSet.has(r.permalink);
      const plannedBadge = isPlanned
        ? `<span class="browse-badge">Planned</span>`
        : '';
      const plannedClass = isPlanned ? 'planned' : '';

      // Extract first segment of title for image naming fallback
      const slug =
        r.permalink.split('/').filter(Boolean).pop() || 'placeholder';

      return `
        <div class="browse-card ${plannedClass}" data-permalink="${r.permalink}">
          <div class="browse-info">
            <img class="browse-img" src="${basePath}${slug}/featured-image.webp" alt="${r.title}" onerror="this.src='${basePath}icon-72.png';" />
            <div class="browse-title-wrapper">
              <h4 class="browse-title">${r.title}</h4>
              ${plannedBadge}
            </div>
          </div>
          <button type="button" class="browse-add-btn" aria-label="Add to plan">+</button>
        </div>
      `;
    })
    .join('');

  // Add click handlers
  shelf.querySelectorAll('.browse-card').forEach((card) => {
    card.addEventListener('click', () => {
      const permalink = card.getAttribute('data-permalink');
      if (permalink && activeTargetDay) {
        addRecipeToDay(activeTargetDay, permalink);
        closeModal();
      }
    });
  });
}

/**
 * Renders Tag Filter Pill Row
 */
function buildTagCloud(): void {
  const bar = document.getElementById('planner-tag-filters');
  if (!bar) {
    return;
  }

  const matches = getFilteredRecipes();

  // Compute counts for all tags on the CURRENTLY matched subset
  const tallies: Record<string, number> = {};
  for (const r of matches) {
    if (r.tags) {
      for (const tag of r.tags) {
        tallies[tag] = (tallies[tag] || 0) + 1;
      }
    }
  }

  const uniqueTags = Array.from(
    new Set(recipesIndex.flatMap((r) => r.tags || [])),
  ).sort();

  bar.innerHTML = '';
  for (const tag of uniqueTags) {
    const count = tallies[tag] || 0;

    let state: 'include' | 'exclude' | 'neutral' = 'neutral';
    if (includedTags.has(tag)) {
      state = 'include';
    } else if (excludedTags.has(tag)) {
      state = 'exclude';
    }

    const isDimmed = count === 0 && state === 'neutral';

    const btn = document.createElement('button');
    btn.type = 'button';

    let btnClass = 'tag-filter-pill';
    if (state === 'include') {
      btnClass += ' include';
    } else if (state === 'exclude') {
      btnClass += ' exclude';
    }
    if (isDimmed) {
      btnClass += ' dimmed';
    }
    btn.className = btnClass;

    btn.dataset.tag = tag;

    let displayLabel = tag;
    if (state === 'include') {
      displayLabel = `✓ ${tag}`;
    } else if (state === 'exclude') {
      displayLabel = `✕ ${tag}`;
    }

    btn.innerHTML = `${displayLabel} <span class="tag-count">${count}</span>`;

    if (!isDimmed) {
      btn.addEventListener('click', () => {
        if (state === 'neutral') {
          includedTags.add(tag);
        } else if (state === 'include') {
          includedTags.delete(tag);
          excludedTags.add(tag);
        } else {
          excludedTags.delete(tag);
        }

        saveFilters();
        buildTagCloud();
        buildSourceCloud();
        renderUI();
      });
    } else {
      btn.setAttribute('disabled', 'true');
    }

    bar.appendChild(btn);
  }
}

/**
 * Renders Recipe Source Filter Pill Row
 */
function buildSourceCloud(): void {
  const bar = document.getElementById('planner-source-filters');
  if (!bar) {
    return;
  }

  const matches = getFilteredRecipes();

  // Compute counts for all sources on the CURRENTLY matched subset
  const tallies: Record<string, number> = {};
  for (const r of matches) {
    if (r.recipeSource) {
      tallies[r.recipeSource] = (tallies[r.recipeSource] || 0) + 1;
    }
  }

  const uniqueSources = Array.from(
    new Set(
      recipesIndex.map((r) => r.recipeSource).filter(Boolean) as string[],
    ),
  ).sort();

  bar.innerHTML = '';
  for (const src of uniqueSources) {
    const count = tallies[src] || 0;

    let state: 'include' | 'exclude' | 'neutral' = 'neutral';
    if (includedSources.has(src)) {
      state = 'include';
    } else if (excludedSources.has(src)) {
      state = 'exclude';
    }

    const btn = document.createElement('button');
    btn.type = 'button';

    let btnClass = 'tag-filter-pill';
    if (state === 'include') {
      btnClass += ' include';
    } else if (state === 'exclude') {
      btnClass += ' exclude';
    }
    btn.className = btnClass;

    btn.dataset.source = src;

    let displayLabel = src;
    if (state === 'include') {
      displayLabel = `✓ ${src}`;
    } else if (state === 'exclude') {
      displayLabel = `✕ ${src}`;
    }

    btn.innerHTML = `${displayLabel} <span class="tag-count">${count}</span>`;

    btn.addEventListener('click', () => {
      if (state === 'neutral') {
        includedSources.add(src);
      } else if (state === 'include') {
        includedSources.delete(src);
        excludedSources.add(src);
      } else {
        excludedSources.delete(src);
      }

      saveFilters();
      buildTagCloud();
      buildSourceCloud();
      renderUI();
    });

    bar.appendChild(btn);
  }
}

/**
 * Splicing / Drag reordering state updater
 */
function handleCardDrop(
  draggedId: string,
  targetDay: string,
  targetInstanceId?: string,
): void {
  const draggedIdx = planState.findIndex((p) => p.instanceId === draggedId);
  if (draggedIdx === -1) {
    return;
  }

  const [item] = planState.splice(draggedIdx, 1);
  item.day = targetDay;

  if (targetInstanceId) {
    // Dropped directly on another card, insert before it in planState
    const targetIdx = planState.findIndex(
      (p) => p.instanceId === targetInstanceId,
    );
    if (targetIdx !== -1) {
      planState.splice(targetIdx, 0, item);
    } else {
      planState.push(item);
    }
  } else {
    // Dropped on empty slot box: append to the end of targetDay's list
    let insertIdx = -1;
    for (let i = planState.length - 1; i >= 0; i--) {
      if (planState[i].day === targetDay) {
        insertIdx = i + 1;
        break;
      }
    }
    if (insertIdx !== -1) {
      planState.splice(insertIdx, 0, item);
    } else {
      planState.push(item);
    }
  }

  saveStateToStorageAndUrl(true);
  renderUI();
}

/**
 * Maps a recipe permalink to its shortId front matter value
 */
function permalinkToCode(permalink: string): string {
  const rec = recipesIndex.find((r) => r.permalink === permalink);
  return rec && rec.shortId ? rec.shortId : permalink;
}

/**
 * Maps a shortId back to its recipe permalink
 */
function codeToPermalink(code: string): string {
  const rec = recipesIndex.find((r) => r.shortId === code);
  if (rec) {
    return rec.permalink;
  }
  return `/recipes/${code}/`;
}

/**
 * Checks if two meal plans are identical in terms of recipes, scales, days, and slots
 */
function arePlansEqual(
  planA: PlannedRecipe[],
  planB: PlannedRecipe[],
): boolean {
  if (planA.length !== planB.length) {
    return false;
  }

  return planA.every((itemA, idx) => {
    const itemB = planB[idx];
    return (
      itemA.permalink === itemB.permalink &&
      itemA.scale === itemB.scale &&
      itemA.day === itemB.day
    );
  });
}

/**
 * Merges a shared plan into a local plan
 */
function mergePlans(
  local: PlannedRecipe[],
  shared: PlannedRecipe[],
): PlannedRecipe[] {
  const merged = [...local];

  shared.forEach((item) => {
    merged.push({
      ...item,
      instanceId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    });
  });

  return merged;
}

/**
 * Shows a toast/notification warning the user that a recipe code from the shared link was not found.
 */
function showUnknownRecipeWarning(code: string): void {
  const existingWarning = document.querySelector(`.toast-warning-${code}`);
  if (existingWarning) {
    return;
  }

  const message = `Shared recipe with code "<strong>${code}</strong>" could not be found. It may have been renamed or removed.`;
  const overlay = OverlayContainer.getInstance();
  const toast = document.createElement('div');
  toast.className = `plan-toast-notification warning toast-warning-${code}`;

  toast.innerHTML = `
    <div class="toast-body">
      <span>${message}</span>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Dismiss toast">✕</button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.remove(toast));
  }

  overlay.add(toast);

  window.setTimeout(() => {
    overlay.remove(toast);
  }, 8000);
}

/**
 * Serialization state updates
 */
function saveStateToStorageAndUrl(writeHistory = false): void {
  // Commit to LocalStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));

  // Serialize to unescaped URL parameter keys
  const params = new URLSearchParams();

  const entries: string[] = [];

  planState.forEach((item) => {
    const rec = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!rec) {
      return;
    }
    const code = permalinkToCode(item.permalink);
    const dayCode = DAY_CODES[item.day];
    if (!dayCode) {
      return;
    } // Ignore invalid day

    const portions = Math.round(item.scale * rec.servings);
    const hasCustomPortions = portions !== rec.servings;

    let val = `${dayCode}${code}`;
    if (hasCustomPortions) {
      val += portions.toString();
    }
    entries.push(val);
  });

  const pVal = ['1', ...entries].join('.');
  params.set('p', pVal);

  if (workWeekOnly) {
    params.set('w', '5');
  }

  if (activeMobileTab === 'edit-plan') {
    params.set('m', 'e');
  } else if (activeMobileTab === 'shopping-list') {
    params.set('m', 's');
  }

  const query = params.toString();
  const path = window.location.pathname;

  if (writeHistory) {
    window.history.replaceState({}, '', query ? `${path}?${query}` : path);
  }
}

/**
 * Load LocalStorage values
 */
function loadStateFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      planState = JSON.parse(raw);
    } else {
      planState = [];
    }
  } catch (e) {
    console.error('Error reading LocalStorage planner state:', e);
    planState = [];
  }
}

/**
 * Parses Multi-Parameter query string parameters
 */
function parseUrlParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  let hasValidParams = false;
  const newPlan: PlannedRecipe[] = [];

  // Check if new single-param 'p' is present
  if (params.has('p')) {
    const pVal = params.get('p') || '';
    const parts = pVal.split('.');
    const version = parts[0];

    if (version === '1') {
      hasValidParams = true;
      const entries = parts.slice(1);
      entries.forEach((entry) => {
        if (!entry) {
          return;
        }

        // dayCode is 1 char: '0'..'7'
        const dayCode = entry.charAt(0);
        const day = CODE_TO_DAYS[dayCode];
        if (!day) {
          console.warn(`[URL Parser] Invalid day code: ${dayCode}`);
          return;
        }

        const rest = entry.slice(1);
        if (!rest) {
          return;
        }

        // Parse shortId (lowercase letters) and portions (digits)
        let digitIndex = -1;
        for (let i = 0; i < rest.length; i++) {
          const char = rest.charAt(i);
          if (char >= '0' && char <= '9') {
            digitIndex = i;
            break;
          }
        }

        let code = rest;
        let portions: number | null = null;
        if (digitIndex !== -1) {
          code = rest.slice(0, digitIndex);
          portions = parseInt(rest.slice(digitIndex), 10);
        }

        const permalink = codeToPermalink(code);
        const rec = recipesIndex.find((r) => r.permalink === permalink);
        if (!rec) {
          showUnknownRecipeWarning(code);
        }

        const defaultServings = rec ? rec.servings : 4;
        let scale = 1.0;
        if (portions !== null && !isNaN(portions)) {
          scale = portions / defaultServings;
        }

        newPlan.push({
          instanceId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          permalink,
          scale,
          day,
        });
      });
    } else {
      console.warn(`[URL Parser] Unsupported plan version: ${version}`);
    }
  } else {
    // Legacy fallback
    const allKeys = [...DAYS, 'supplemental'];
    allKeys.forEach((day) => {
      const values = params.getAll(day);
      if (values.length > 0) {
        hasValidParams = true;
        values.forEach((val) => {
          let code = val;
          let scale = 1.0;

          if (val.includes('-')) {
            const parts = val.split('-');
            code = parts[0];
            scale = parseFloat(parts[1]) || 1.0;
          }

          const permalink = codeToPermalink(code);
          const rec = recipesIndex.find((r) => r.permalink === permalink);
          if (!rec) {
            showUnknownRecipeWarning(code);
          }

          newPlan.push({
            instanceId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            permalink,
            scale: isNaN(scale) ? 1.0 : scale,
            day,
          });
        });
      }
    });
  }

  // Parse week / w
  if (params.has('w') || params.has('week')) {
    hasValidParams = true;
    const wVal = params.get('w') || params.get('week');
    workWeekOnly = wVal === '5';
  }

  if (hasValidParams) {
    planState = newPlan;
  }
  return hasValidParams;
}

/**
 * Reset planner state triggers
 */
function clearPlannerState(): void {
  if (confirm('Are you sure you want to clear your meal plan?')) {
    planState = [];
    checkedIngredients.clear();
    saveCheckedState();
    saveStateToStorageAndUrl(true);
    renderUI();
  }
}

/**
 * Render Core Planner Grid UI Interface
 */
function renderUI(highlightInstanceId?: string): void {
  const container = document.getElementById('planned-recipes-list-grid');
  const colShopping = document.getElementById('col-shopping');
  const mealPlannerContainer = document.getElementById('meal-planner');
  const toolbarEdit = document.getElementById('toolbar-edit');
  const toolbarView = document.getElementById('toolbar-view');
  const toolbarShop = document.getElementById('toolbar-shop');
  const suppSection = document.getElementById('supplemental-section');
  const suppList = document.getElementById('supplemental-recipes-list');

  if (!container) {
    return;
  }

  // Sync Filters button label and active highlights
  const btnToggleFilters = document.getElementById('btn-toggle-filters');
  if (btnToggleFilters) {
    const filterCount =
      includedTags.size +
      excludedTags.size +
      includedSources.size +
      excludedSources.size;
    btnToggleFilters.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Filters${filterCount > 0 ? ` (${filterCount})` : ''}`;
    btnToggleFilters.classList.toggle('active', filterCount > 0);
  }

  // Toggle View UX / Edit UX controls
  const btn7Day = document.getElementById('week-7day-btn');
  const btn5Day = document.getElementById('week-5day-btn');
  if (btn7Day && btn5Day) {
    btn5Day.classList.toggle('active', workWeekOnly);
    btn7Day.classList.toggle('active', !workWeekOnly);
  }

  // Set per-view visibility of second toolbar controls
  if (activeMobileTab === 'edit-plan') {
    if (toolbarEdit) {
      toolbarEdit.style.display = 'flex';
    }
    if (toolbarView) {
      toolbarView.style.display = 'none';
    }
    if (toolbarShop) {
      toolbarShop.style.display = 'none';
    }

    if (colShopping) {
      colShopping.style.display = 'none';
    }
    if (mealPlannerContainer) {
      mealPlannerContainer.classList.remove('show-shopping');
    }
  } else if (activeMobileTab === 'view-plan') {
    if (toolbarEdit) {
      toolbarEdit.style.display = 'none';
    }
    if (toolbarView) {
      toolbarView.style.display = 'flex';
    }
    if (toolbarShop) {
      toolbarShop.style.display = 'none';
    }

    if (colShopping) {
      colShopping.style.display = 'block';
    }
    if (mealPlannerContainer) {
      mealPlannerContainer.classList.add('show-shopping');
    }
  } else if (activeMobileTab === 'shopping-list') {
    if (toolbarEdit) {
      toolbarEdit.style.display = 'none';
    }
    if (toolbarView) {
      toolbarView.style.display = 'none';
    }

    // Only show shopping list toolbar if plan contains scheduled items
    const hasItems = planState.length > 0;
    if (toolbarShop) {
      toolbarShop.style.display = hasItems ? 'flex' : 'none';
    }

    if (colShopping) {
      colShopping.style.display = 'block';
    }
    if (mealPlannerContainer) {
      mealPlannerContainer.classList.add('show-shopping');
    }
  }

  // Active columns configuration
  const activeDays = workWeekOnly ? DAYS.slice(1, 6) : DAYS; // 5-Day (Mon-Fri) vs 7-Day
  container.classList.toggle('grid-5day', workWeekOnly);

  const basePath = getSiteBasePath();

  // Populate Columns HTML
  container.innerHTML = activeDays
    .map((day) => {
      const dayMeals = planState.filter((p) => p.day === day);

      // Calculate day totals (Prep + Cook)
      let dayPrep = 0;
      let dayCook = 0;
      dayMeals.forEach((dm) => {
        const r = recipesIndex.find((rec) => rec.permalink === dm.permalink);
        if (!r) {
          return;
        }
        r.times.forEach((t) => {
          const min = parseInt(t.time) || 0;
          if (t.step.toLowerCase() === 'prep') {
            dayPrep += min;
          }
          if (t.step.toLowerCase() === 'cook') {
            dayCook += min;
          }
        });
      });

      const dayTotalMin = dayPrep + dayCook;
      const dayTimeStr = dayTotalMin > 0 ? `${dayTotalMin} min` : '';
      const timeBadge = dayTimeStr
        ? `<span class="day-time-badge">${dayTimeStr}</span>`
        : '';

      // Cards list HTML
      let cardsHtml = '';
      if (editMode) {
        dayMeals.forEach((dm, idx) => {
          const rec = recipesIndex.find((r) => r.permalink === dm.permalink);
          const title = rec ? rec.title : 'Unknown Recipe';
          const servings = rec ? rec.servings : 4;
          const portions = Math.round(dm.scale * servings);
          const slug =
            dm.permalink.split('/').filter(Boolean).pop() || 'placeholder';
          const highlightClass =
            dm.instanceId === highlightInstanceId ? 'new-addition' : '';

          const deleteBtn = `<button type="button" class="recipe-remove-btn" data-instance-id="${dm.instanceId}" title="Remove recipe">✕</button>`;
          const swapBtn = `<button type="button" class="recipe-swap-btn" data-instance-id="${dm.instanceId}" title="Swap recipe"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></button>`;
          const handle = `<div class="recipe-drag-handle">⠿</div>`;
          const stepper = `
            <div class="portion-picker">
              <button type="button" class="portion-btn dec-btn" data-instance-id="${dm.instanceId}">-</button>
              <span class="portion-val">${portions}</span>
              <button type="button" class="portion-btn inc-btn" data-instance-id="${dm.instanceId}">+</button>
            </div>
          `;
          const dinnerClass = idx === 0 ? 'dinner-slot-card' : '';

          cardsHtml += `
            <div class="planned-recipe-item ${highlightClass} ${dinnerClass}" data-instance-id="${dm.instanceId}" data-day="${day}">
              <div class="recipe-card-media-wrapper" draggable="true">
                <img class="recipe-card-img" src="${basePath}${slug}/featured-image.webp" alt="${title}" onerror="this.src='${basePath}icon-72.png';" />
                ${handle}
                ${swapBtn}
                ${deleteBtn}
              </div>
              <div class="recipe-card-body">
                <h4 class="recipe-card-title">${title}</h4>
              </div>
              <div class="recipe-card-footer">
                ${stepper}
              </div>
            </div>
          `;
        });

        // Exactly one empty slot box at the bottom of the list
        const dinnerClass = dayMeals.length === 0 ? 'dinner-empty-slot' : '';
        cardsHtml += `
          <div class="empty-slot-box ${dinnerClass}" data-day="${day}" title="Add recipe to ${DAY_NAMES[day]}">
            <span class="empty-slot-plus">+</span>
          </div>
        `;
      } else {
        // View Mode: only render filled slots sorted by list order
        cardsHtml = dayMeals
          .map((dm) => {
            const rec = recipesIndex.find((r) => r.permalink === dm.permalink);
            const title = rec ? rec.title : 'Unknown Recipe';
            const servings = rec ? rec.servings : 4;
            const portions = Math.round(dm.scale * servings);
            const slug =
              dm.permalink.split('/').filter(Boolean).pop() || 'placeholder';
            const stepper = `<span class="recipe-serving-text">${portions} serving${portions !== 1 ? 's' : ''}</span>`;

            return `
              <a href="${dm.permalink}?from=plan&servings=${portions}" class="planned-recipe-item" data-instance-id="${dm.instanceId}">
                <div class="recipe-card-media-wrapper">
                  <img class="recipe-card-img" src="${basePath}${slug}/featured-image.webp" alt="${title}" onerror="this.src='${basePath}icon-72.png';" />
                </div>
                <div class="recipe-card-body">
                  <h4 class="recipe-card-title">${title}</h4>
                </div>
                <div class="recipe-card-footer">
                  ${stepper}
                </div>
              </a>
            `;
          })
          .join('');
      }

      return `
        <div class="day-column" data-day="${day}">
          <div class="day-header">
            <span class="day-title">${DAY_NAMES[day]}</span>
            ${timeBadge}
          </div>
          <div class="day-recipes-list" data-day="${day}">
            ${cardsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  // Render Supplemental Anytime Tray
  if (suppSection && suppList) {
    const supplementalMeals = planState.filter((p) => p.day === 'supplemental');
    if (!editMode && supplementalMeals.length === 0) {
      suppSection.style.display = 'none';
    } else {
      suppSection.style.display = 'block';

      let suppHtml = supplementalMeals
        .map((dm) => {
          const rec = recipesIndex.find((r) => r.permalink === dm.permalink);
          const title = rec ? rec.title : 'Unknown Recipe';
          const servings = rec ? rec.servings : 4;
          const portions = Math.round(dm.scale * servings);
          const slug =
            dm.permalink.split('/').filter(Boolean).pop() || 'placeholder';
          const highlightClass =
            dm.instanceId === highlightInstanceId ? 'new-addition' : '';

          const deleteBtn = editMode
            ? `<button type="button" class="recipe-remove-btn" data-instance-id="${dm.instanceId}" title="Remove recipe">✕</button>`
            : '';
          const swapBtn = editMode
            ? `<button type="button" class="recipe-swap-btn" data-instance-id="${dm.instanceId}" title="Swap recipe"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></button>`
            : '';
          const handle = editMode
            ? `<div class="recipe-drag-handle">⠿</div>`
            : '';
          const stepper = editMode
            ? `
              <div class="portion-picker">
                <button type="button" class="portion-btn dec-btn" data-instance-id="${dm.instanceId}">-</button>
                <span class="portion-val">${portions}</span>
                <button type="button" class="portion-btn inc-btn" data-instance-id="${dm.instanceId}">+</button>
              </div>
            `
            : `<span class="recipe-serving-text">${portions} serving${portions !== 1 ? 's' : ''}</span>`;

          const draggableAttr = editMode ? 'draggable="true"' : '';
          const cardTag = editMode ? 'div' : 'a';
          const hrefAttr = editMode
            ? ''
            : ` href="${dm.permalink}?from=plan&servings=${portions}"`;

          return `
            <${cardTag}${hrefAttr} class="planned-recipe-item ${highlightClass}" data-instance-id="${dm.instanceId}" data-day="supplemental">
              <div class="recipe-card-media-wrapper" ${draggableAttr}>
                <img class="recipe-card-img" src="${basePath}${slug}/featured-image.webp" alt="${title}" onerror="this.src='${basePath}icon-72.png';" />
                ${handle}
                ${swapBtn}
                ${deleteBtn}
              </div>
              <div class="recipe-card-body">
                <h4 class="recipe-card-title">${title}</h4>
              </div>
              <div class="recipe-card-footer">
                ${stepper}
              </div>
            </${cardTag}>
          `;
        })
        .join('');

      if (editMode) {
        suppHtml += `
          <div class="empty-slot-box" data-day="supplemental" title="Add supplemental recipe">
            <span class="empty-slot-plus">+</span>
          </div>
        `;
      }
      suppList.innerHTML = suppHtml;
    }
  }

  // Setup Event Bindings for newly rendered elements
  if (editMode) {
    setupDragAndDropHandlers();

    // Day slot & Supplemental selectors (clicking opens modal)
    document.querySelectorAll('.empty-slot-box').forEach((box) => {
      box.addEventListener('click', () => {
        const day = box.getAttribute('data-day');
        if (day) {
          openModal(day);
        }
      });
    });

    // Card portion buttons
    document.querySelectorAll('.dec-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-instance-id');
        if (id) {
          adjustPortions(id, -1);
        }
      });
    });
    document.querySelectorAll('.inc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-instance-id');
        if (id) {
          adjustPortions(id, 1);
        }
      });
    });

    // Swap buttons
    document.querySelectorAll('.recipe-swap-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-instance-id');
        if (id) {
          swapRecipe(id);
        }
      });
    });

    // Remove buttons
    document.querySelectorAll('.recipe-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-instance-id');
        if (id) {
          removeRecipeWithRecovery(id);
        }
      });
    });
  }

  // Update mode-toggle-group shopping count badge
  const shopCountBadge = document.getElementById('shopping-count-badge');
  if (shopCountBadge) {
    const plannedCount = planState.length;
    shopCountBadge.textContent = plannedCount > 0 ? ` (${plannedCount})` : '';
  }

  // Sync Global Stepper Indicator Label
  const globalIndicator = document.getElementById('global-scaler-indicator');
  if (globalIndicator) {
    globalIndicator.textContent = planState.length > 0 ? 'Portions' : '—';
  }

  // Show/Hide calendar vs shopping container
  const colPlanner = document.getElementById('col-planner');
  if (colPlanner) {
    colPlanner.style.display =
      activeMobileTab === 'shopping-list' ? 'none' : 'block';
  }
  if (colShopping) {
    colShopping.style.display =
      activeMobileTab === 'shopping-list' ? 'block' : 'none';
  }

  renderCombinedShoppingList();
  renderDietCategoryStats();
}

/**
 * Setup Event Listeners for HTML5 drag-and-drop actions
 */
function setupDragAndDropHandlers(): void {
  const trashZone = document.getElementById('planner-trash-zone');
  const cards = document.querySelectorAll('.planned-recipe-item');
  const slots = document.querySelectorAll(
    '.empty-slot-box, .planned-recipe-item',
  );
  const supplementalList = document.querySelector('.supplemental-recipes-list');

  // Touch Simulation State variables
  let touchDraggedId: string | null = null;
  let touchDraggedCard: HTMLElement | null = null;
  let touchDragMirror: HTMLElement | null = null;
  let touchOffsetLeft = 0;
  let touchOffsetTop = 0;
  let lastActiveTarget: HTMLElement | null = null;

  function findDropTarget(el: HTMLElement | null): HTMLElement | null {
    while (el) {
      if (
        el.classList.contains('empty-slot-box') ||
        el.classList.contains('planned-recipe-item') ||
        el.classList.contains('planner-trash-zone') ||
        el.classList.contains('supplemental-recipes-list')
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!touchDraggedId || !touchDragMirror) {
      return;
    }
    const touch = e.touches[0];

    // Position mirror at finger coordinates
    touchDragMirror.style.left = `${touch.clientX - touchOffsetLeft}px`;
    touchDragMirror.style.top = `${touch.clientY - touchOffsetTop}px`;

    // Detect target element under finger
    const elUnder = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    ) as HTMLElement | null;
    const target = findDropTarget(elUnder);

    if (target !== lastActiveTarget) {
      if (lastActiveTarget) {
        lastActiveTarget.classList.remove('drag-over');
      }
      if (target) {
        target.classList.add('drag-over');
      }
      lastActiveTarget = target;
    }

    if (e.cancelable) {
      e.preventDefault();
    }
  }

  function handleTouchEnd(): void {
    if (!touchDraggedId) {
      return;
    }

    // Clean up global touchlisteners
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    if (touchDragMirror) {
      touchDragMirror.remove();
      touchDragMirror = null;
    }

    if (touchDraggedCard) {
      touchDraggedCard.classList.remove('dragging');
      touchDraggedCard = null;
    }

    document.body.classList.remove('dragging-active');
    if (trashZone) {
      trashZone.style.display = 'none';
    }

    if (lastActiveTarget) {
      lastActiveTarget.classList.remove('drag-over');

      const targetDay = lastActiveTarget.getAttribute('data-day');
      const targetInstanceId =
        lastActiveTarget.getAttribute('data-instance-id') || undefined;

      if (lastActiveTarget.classList.contains('planner-trash-zone')) {
        removeRecipeWithRecovery(touchDraggedId);
      } else if (
        lastActiveTarget.classList.contains('supplemental-recipes-list')
      ) {
        const draggedIdx = planState.findIndex(
          (p) => p.instanceId === touchDraggedId,
        );
        if (draggedIdx !== -1) {
          const item = planState[draggedIdx];
          if (item.day !== 'supplemental') {
            item.day = 'supplemental';
            saveStateToStorageAndUrl(true);
            renderUI();
          }
        }
      } else if (targetDay) {
        if (targetDay === 'supplemental') {
          const draggedIdx = planState.findIndex(
            (p) => p.instanceId === touchDraggedId,
          );
          if (draggedIdx !== -1) {
            const item = planState[draggedIdx];
            item.day = 'supplemental';
            if (targetInstanceId && targetInstanceId !== touchDraggedId) {
              planState.splice(draggedIdx, 1);
              const targetIdx = planState.findIndex(
                (p) => p.instanceId === targetInstanceId,
              );
              if (targetIdx !== -1) {
                planState.splice(targetIdx, 0, item);
              } else {
                planState.push(item);
              }
            }
            saveStateToStorageAndUrl(true);
            renderUI();
          }
        } else {
          handleCardDrop(touchDraggedId, targetDay, targetInstanceId);
        }
      }
      lastActiveTarget = null;
    }

    touchDraggedId = null;
  }

  cards.forEach((card) => {
    const mediaWrapper = card.querySelector(
      '.recipe-card-media-wrapper',
    ) as HTMLElement;
    if (mediaWrapper) {
      // HTML5 Drag and Drop triggers on the media wrapper (Desktop)
      mediaWrapper.addEventListener('dragstart', (e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('.recipe-remove-btn') ||
          target.closest('.recipe-swap-btn')
        ) {
          e.preventDefault();
          return;
        }

        const id = card.getAttribute('data-instance-id');
        if (!id) {
          return;
        }

        const dragEvent = e as DragEvent;
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.setData('text/plain', id);
          dragEvent.dataTransfer.effectAllowed = 'move';
        }
        card.classList.add('dragging');
        document.body.classList.add('dragging-active');

        if (trashZone) {
          trashZone.style.display = 'flex';
        }
      });

      mediaWrapper.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.body.classList.remove('dragging-active');

        if (trashZone) {
          trashZone.style.display = 'none';
        }

        document
          .querySelectorAll('.empty-slot-box, .planned-recipe-item')
          .forEach((c) => {
            c.classList.remove('drag-over');
          });
      });

      // Touch event listener on drag handle & wrapper (Mobile)
      mediaWrapper.addEventListener(
        'touchstart',
        (e) => {
          const touchEvent = e as TouchEvent;
          const target = touchEvent.target as HTMLElement;
          if (
            target.closest('.recipe-remove-btn') ||
            target.closest('.recipe-swap-btn')
          ) {
            return; // Allow button clicks/taps
          }

          const touch = touchEvent.touches[0];
          const id = card.getAttribute('data-instance-id');
          if (!id) {
            return;
          }

          touchDraggedId = id;
          touchDraggedCard = card as HTMLElement;

          const rect = card.getBoundingClientRect();
          touchOffsetLeft = touch.clientX - rect.left;
          touchOffsetTop = touch.clientY - rect.top;

          // Create floating card mirror element
          touchDragMirror = card.cloneNode(true) as HTMLElement;
          touchDragMirror.classList.add('dragging-mirror');
          touchDragMirror.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            opacity: 0.85;
            pointer-events: none;
            z-index: 10000000;
            box-shadow: 0 12px 30px rgba(0,0,0,0.3);
            transform: scale(1.04);
            transition: transform 0.1s ease;
          `;
          document.body.appendChild(touchDragMirror);

          card.classList.add('dragging');
          document.body.classList.add('dragging-active');
          if (trashZone) {
            trashZone.style.display = 'flex';
          }

          document.addEventListener('touchmove', handleTouchMove, {
            passive: false,
          });
          document.addEventListener('touchend', handleTouchEnd);

          if (touchEvent.cancelable) {
            touchEvent.preventDefault();
          }
        },
        { passive: false },
      );
    }
  });

  slots.forEach((slot) => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragEvent = e as DragEvent;
      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.dropEffect = 'move';
      }
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      const dragEvent = e as DragEvent;
      const draggedId = dragEvent.dataTransfer?.getData('text/plain');
      if (!draggedId) {
        return;
      }

      const targetDay = slot.getAttribute('data-day');
      if (!targetDay) {
        return;
      }

      if (targetDay === 'supplemental') {
        const draggedIdx = planState.findIndex(
          (p) => p.instanceId === draggedId,
        );
        if (draggedIdx !== -1) {
          const item = planState[draggedIdx];
          item.day = 'supplemental';

          const targetInstanceId = slot.getAttribute('data-instance-id');
          if (targetInstanceId && targetInstanceId !== draggedId) {
            planState.splice(draggedIdx, 1);
            const targetIdx = planState.findIndex(
              (p) => p.instanceId === targetInstanceId,
            );
            if (targetIdx !== -1) {
              planState.splice(targetIdx, 0, item);
            } else {
              planState.push(item);
            }
          }
          saveStateToStorageAndUrl(true);
          renderUI();
        }
      } else {
        const targetInstanceId =
          slot.getAttribute('data-instance-id') || undefined;
        handleCardDrop(draggedId, targetDay, targetInstanceId);
      }
    });
  });

  if (supplementalList) {
    supplementalList.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    supplementalList.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragEvent = e as DragEvent;
      const draggedId = dragEvent.dataTransfer?.getData('text/plain');
      if (!draggedId) {
        return;
      }

      const draggedIdx = planState.findIndex((p) => p.instanceId === draggedId);
      if (draggedIdx !== -1) {
        const item = planState[draggedIdx];
        if (item.day !== 'supplemental') {
          item.day = 'supplemental';
          saveStateToStorageAndUrl(true);
          renderUI();
        }
      }
    });
  }
}

/**
 * Portion size increments/decrements on individual cards
 */
function adjustPortions(instanceId: string, offset: number): void {
  const planned = planState.find((p) => p.instanceId === instanceId);
  if (!planned) {
    return;
  }

  const rec = recipesIndex.find((r) => r.permalink === planned.permalink);
  if (!rec) {
    return;
  }

  const currentPortions = Math.round(planned.scale * rec.servings);
  const nextPortions = Math.max(1, currentPortions + offset);

  planned.scale = nextPortions / rec.servings;
  saveStateToStorageAndUrl(true);
  renderUI();
}

/**
 * Renders diet / category balance tag dashboard stats at calendar bottom
 */
function renderDietCategoryStats(): void {
  const panel = document.getElementById('planner-balance-stats');
  if (!panel) {
    return;
  }

  if (planState.length === 0) {
    panel.style.display = 'none';
    return;
  }

  // Tally tags from index
  const tagCounts: Record<string, number> = {};
  planState.forEach((dm) => {
    const rec = recipesIndex.find((r) => r.permalink === dm.permalink);
    if (!rec || !rec.tags) {
      return;
    }
    rec.tags.forEach((tag) => {
      const lower = tag.trim().toLowerCase();
      // Only capture main dietary categories
      const targetCategories = [
        'vegetarian',
        'vegan',
        'chicken',
        'meat',
        'dinner',
        'breakfast',
        'lunch',
        'dessert',
        'baking',
        'pasta',
        'soup',
        'salad',
      ];
      if (targetCategories.includes(lower)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });

  const entries = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([tag, count]) =>
        `<strong>${count}</strong> ${tag}${count !== 1 ? 's' : ''}`,
    );

  if (entries.length === 0) {
    panel.style.display = 'none';
  } else {
    panel.innerHTML = `Plan breakdown: ${entries.join(', ')}`;
    panel.style.display = 'block';
  }
}

/**
 * Loads cached completed checkboxes from storage
 */
function loadCheckedState(): void {
  try {
    const raw = localStorage.getItem('noonarby-shopping-checked-items');
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      checkedIngredients.clear();
      parsed.forEach((k) => checkedIngredients.add(k));
    }
  } catch (e) {
    console.error('Error loading checklist checked states:', e);
  }
}

/**
 * Caches completed checkboxes in LocalStorage
 */
function saveCheckedState(): void {
  localStorage.setItem(
    'noonarby-shopping-checked-items',
    JSON.stringify(Array.from(checkedIngredients)),
  );
}

/**
 * Compile Combined Scaling Shopping List
 */
function renderCombinedShoppingList(): void {
  loadCheckedState();
  const buyList = document.getElementById('combined-buy-list');
  const staplesList = document.getElementById('combined-staples-list');
  const optionalList = document.getElementById('combined-optional-list');
  const divider = document.querySelector('.shopping-divider');

  if (!buyList || !staplesList) {
    return;
  }

  if (planState.length === 0) {
    buyList.innerHTML = `<div class="planner-empty-state">Add some recipes to generate your combined shopping list.</div>`;
    staplesList.innerHTML = '';
    if (optionalList) {
      optionalList.innerHTML = '';
    }
    if (divider) {
      (divider as HTMLElement).style.display = 'none';
    }
    return;
  }

  if (divider) {
    (divider as HTMLElement).style.display = 'block';
  }

  const ingredients: IngredientInput[] = [];
  planState.forEach((item) => {
    const rec = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!rec) {
      return;
    }

    rec.ingredients.forEach((ing) => {
      let parsed: IngredientInput;
      if (typeof ing === 'string') {
        parsed = { item: ing };
      } else {
        parsed = JSON.parse(JSON.stringify(ing));
      }

      if (parsed.qty !== undefined) {
        if (Array.isArray(parsed.qty)) {
          parsed.qty = [parsed.qty[0] * item.scale, parsed.qty[1] * item.scale];
        } else {
          parsed.qty = parsed.qty * item.scale;
        }
      }
      if (parsed.alt?.qty !== undefined) {
        if (Array.isArray(parsed.alt.qty)) {
          parsed.alt.qty = [
            parsed.alt.qty[0] * item.scale,
            parsed.alt.qty[1] * item.scale,
          ];
        } else {
          parsed.alt.qty = parsed.alt.qty * item.scale;
        }
      }
      parsed.category = rec.title;
      ingredients.push(parsed);
    });
  });

  const { buyItems, optionalItems, stapleItems } =
    processShoppingList(ingredients);

  // Render Need to Buy Column with sections
  if (buyItems.length === 0) {
    buyList.innerHTML = `<div class="planner-empty-state">No items needed.</div>`;
  } else {
    buyList.innerHTML = renderBuyItemsWithSections(buyItems);
  }

  // Render Optional Section
  if (optionalList) {
    if (optionalItems.length === 0) {
      optionalList.innerHTML = '';
      const optionalSection = document.querySelector('.optional-section');
      if (optionalSection) {
        (optionalSection as HTMLElement).style.display = 'none';
      }
    } else {
      optionalList.innerHTML = renderItemsBlock(optionalItems, false);
      const optionalSection = document.querySelector('.optional-section');
      if (optionalSection) {
        (optionalSection as HTMLElement).style.display = 'block';
      }
    }
  }

  // Render Pantry Staples Column
  if (stapleItems.length === 0) {
    staplesList.innerHTML = `<div class="planner-empty-state">No staples.</div>`;
    if (divider) {
      (divider as HTMLElement).style.display = 'none';
    }
  } else {
    staplesList.innerHTML = renderItemsBlock(stapleItems, true);
    if (divider) {
      (divider as HTMLElement).style.display = 'block';
    }
  }

  // Accordion Expand/Collapse arrow
  const arrow = document.querySelector('.accordion-arrow');
  if (arrow) {
    arrow.textContent = staplesExpanded ? '▾' : '▸';
  }
  staplesList.style.display = staplesExpanded ? 'block' : 'none';

  // Bind Checklist click triggers
  document.querySelectorAll('.shopping-item-checkbox').forEach((chk) => {
    chk.addEventListener('change', () => {
      const key = chk.getAttribute('data-key');
      if (!key) {
        return;
      }

      if ((chk as HTMLInputElement).checked) {
        checkedIngredients.add(key);
      } else {
        checkedIngredients.delete(key);
      }

      saveCheckedState();
      renderUI(); // Sync cross-offs
    });
  });
}

function renderBuyItemsWithSections(items: ShoppingItem[]): string {
  let html = '';
  let currentSectionId = '';

  items.forEach((item) => {
    const section = getStoreSection(item.rest, item.item);
    if (section.id !== currentSectionId) {
      currentSectionId = section.id;
      html += `
        <li class="shopping-section-header compound-list-header">${section.name}</li>
      `;
    }

    const key = getIngredientKey(false, item.unit, item.rest);
    const isChecked = checkedIngredients.has(key);
    const checkedAttr = isChecked ? 'checked' : '';
    const checkedClass = isChecked ? 'checked' : '';

    const notesArr = item.notes || [];
    const recipes = Array.from(
      new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
    );
    const alts = Array.from(
      new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
    );
    const notesStrs = [];
    if (recipes.length > 0) {
      notesStrs.push(`from ${recipes.join(', ')}`);
    }
    if (alts.length > 0) {
      notesStrs.push(`or ${alts.join(' or ')}`);
    }
    const notesHtml =
      notesStrs.length > 0
        ? ` <span class="shopping-notes">(${notesStrs.join('; ')})</span>`
        : '';
    const qtyStr =
      item.qty !== null && item.qty > 0
        ? `${formatCookingNumber(item.qty)} `
        : '';
    const unitStr = item.unit ? `${item.unit} ` : '';

    const displayRest = item.rest;

    html += `
      <li class="shopping-item ${checkedClass}">
        <label class="shopping-item-label">
          <input type="checkbox" class="shopping-item-checkbox" data-key="${key}" ${checkedAttr} />
          <span>${qtyStr}${unitStr}${displayRest}${notesHtml}</span>
        </label>
      </li>
    `;
  });

  return html;
}

function renderItemsBlock(items: ShoppingItem[], isStaple: boolean): string {
  return items
    .map((item) => {
      const key = getIngredientKey(isStaple, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      const checkedAttr = isChecked ? 'checked' : '';
      const checkedClass = isChecked ? 'checked' : '';

      const notesArr = item.notes || [];
      const recipes = Array.from(
        new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
      );
      const alts = Array.from(
        new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
      );
      const notesStrs = [];
      if (recipes.length > 0) {
        notesStrs.push(`from ${recipes.join(', ')}`);
      }
      if (alts.length > 0) {
        notesStrs.push(`or ${alts.join(' or ')}`);
      }
      const notesHtml =
        notesStrs.length > 0
          ? ` <span class="shopping-notes">(${notesStrs.join('; ')})</span>`
          : '';
      const qtyStr =
        item.qty !== null && item.qty > 0
          ? `${formatCookingNumber(item.qty)} `
          : '';
      const unitStr = item.unit ? `${item.unit} ` : '';

      const displayRest = item.rest;

      return `
        <li class="shopping-item ${checkedClass}">
          <label class="shopping-item-label">
            <input type="checkbox" class="shopping-item-checkbox" data-key="${key}" ${checkedAttr} />
            <span>${qtyStr}${unitStr}${displayRest}${notesHtml}</span>
          </label>
        </li>
      `;
    })
    .join('');
}

/**
 * Copies the weekly menu text outline to the clipboard (Suggestion 4)
 */
function copyMenuTextToClipboard(): void {
  if (planState.length === 0) {
    return;
  }

  const activeDays = workWeekOnly ? DAYS.slice(1, 6) : DAYS;
  let text = 'My Weekly Meal Plan:\n';

  activeDays.forEach((day) => {
    const dayRecipes = planState.filter((p) => p.day === day);
    text += `\n${DAY_NAMES[day]}:\n`;
    if (dayRecipes.length === 0) {
      text += '  - No meals planned\n';
    } else {
      dayRecipes.forEach((dm) => {
        const rec = recipesIndex.find((r) => r.permalink === dm.permalink);
        const title = rec ? rec.title : 'Unknown Recipe';
        const servings = rec ? rec.servings : 4;
        const portions = Math.round(dm.scale * servings);
        text += `  - ${title} (${portions} servings)\n`;
      });
    }
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy-menu-text');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>Copied!</span>';
      setTimeout(() => (btn.innerHTML = orig), 2000);
    }
  });
}

/**
 * Formats and copies compiled ingredients list to clipboard
 */
function copyShoppingListToClipboard(
  format: 'markdown' | 'google-keep' = 'markdown',
): void {
  const chkOmit = document.getElementById(
    'chk-omit-completed',
  ) as HTMLInputElement;
  const omitChecked = chkOmit ? chkOmit.checked : false;

  const ingredients: IngredientInput[] = [];
  planState.forEach((item) => {
    const rec = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!rec) {
      return;
    }

    rec.ingredients.forEach((ing) => {
      let parsed: IngredientInput;
      if (typeof ing === 'string') {
        parsed = { item: ing };
      } else {
        parsed = JSON.parse(JSON.stringify(ing));
      }

      if (parsed.qty !== undefined) {
        if (Array.isArray(parsed.qty)) {
          parsed.qty = [parsed.qty[0] * item.scale, parsed.qty[1] * item.scale];
        } else {
          parsed.qty = parsed.qty * item.scale;
        }
      }
      if (parsed.alt?.qty !== undefined) {
        if (Array.isArray(parsed.alt.qty)) {
          parsed.alt.qty = [
            parsed.alt.qty[0] * item.scale,
            parsed.alt.qty[1] * item.scale,
          ];
        } else {
          parsed.alt.qty = parsed.alt.qty * item.scale;
        }
      }
      parsed.category = rec.title;
      ingredients.push(parsed);
    });
  });

  const { buyItems, optionalItems, stapleItems } =
    processShoppingList(ingredients);

  let clipboardText = '';

  if (format === 'google-keep') {
    // Google Keep format: Sorted order, no store section headings or titles, only items, each on a single line
    const filteredBuy = buyItems.filter((item) => {
      const key = getIngredientKey(false, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    const filteredOptional = optionalItems.filter((item) => {
      const key = getIngredientKey(false, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    const filteredStaples = stapleItems.filter((item) => {
      const key = getIngredientKey(true, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    const allItems = [...filteredBuy, ...filteredOptional, ...filteredStaples];
    const lines = allItems.map((item) => {
      const qtyStr =
        item.qty !== null && item.qty > 0
          ? `${formatCookingNumber(item.qty)} `
          : '';
      const unitStr = item.unit ? `${item.unit} ` : '';
      const notesArr = item.notes || [];
      const recipes = Array.from(
        new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
      );
      const alts = Array.from(
        new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
      );
      const notesStrs = [];
      if (recipes.length > 0) {
        notesStrs.push(`from ${recipes.join(', ')}`);
      }
      if (alts.length > 0) {
        notesStrs.push(`or ${alts.join(' or ')}`);
      }
      const notesStr = notesStrs.length > 0 ? ` (${notesStrs.join('; ')})` : '';

      const displayRest = item.rest;

      return `${qtyStr}${unitStr}${displayRest}${notesStr}`;
    });

    clipboardText = lines.join('\n');
  } else {
    // Markdown format
    clipboardText = '## Combined Shopping List\n';

    // Need to Buy Block (grouped by store sections)
    const filteredBuy = buyItems.filter((item) => {
      const key = getIngredientKey(false, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    if (filteredBuy.length > 0) {
      clipboardText += '\n### Need to Buy\n';
      let currentSectionId = '';
      filteredBuy.forEach((item) => {
        const section = getStoreSection(item.rest, item.item);
        if (section.id !== currentSectionId) {
          currentSectionId = section.id;
          clipboardText += `\n[ ${section.name} ]\n`;
        }

        const key = getIngredientKey(false, item.unit, item.rest);
        const isChecked = checkedIngredients.has(key);
        const mark = isChecked ? '[x]' : '[ ]';

        const qtyStr =
          item.qty !== null && item.qty > 0
            ? `${formatCookingNumber(item.qty)} `
            : '';
        const unitStr = item.unit ? `${item.unit} ` : '';
        const notesArr = item.notes || [];
        const recipes = Array.from(
          new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
        );
        const alts = Array.from(
          new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
        );
        const notesStrs = [];
        if (recipes.length > 0) {
          notesStrs.push(`from ${recipes.join(', ')}`);
        }
        if (alts.length > 0) {
          notesStrs.push(`or ${alts.join(' or ')}`);
        }
        const notesStr =
          notesStrs.length > 0 ? ` (${notesStrs.join('; ')})` : '';

        const displayRest = item.rest;

        clipboardText += `- ${mark} ${qtyStr}${unitStr}${displayRest}${notesStr}\n`;
      });
    }

    // Optional Block
    const filteredOptional = optionalItems.filter((item) => {
      const key = getIngredientKey(false, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    if (filteredOptional.length > 0) {
      clipboardText += '\n### Optional\n';
      filteredOptional.forEach((item) => {
        const key = getIngredientKey(false, item.unit, item.rest);
        const isChecked = checkedIngredients.has(key);
        const mark = isChecked ? '[x]' : '[ ]';

        const qtyStr =
          item.qty !== null && item.qty > 0
            ? `${formatCookingNumber(item.qty)} `
            : '';
        const unitStr = item.unit ? `${item.unit} ` : '';
        const notesArr = item.notes || [];
        const recipes = Array.from(
          new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
        );
        const alts = Array.from(
          new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
        );
        const notesStrs = [];
        if (recipes.length > 0) {
          notesStrs.push(`from ${recipes.join(', ')}`);
        }
        if (alts.length > 0) {
          notesStrs.push(`or ${alts.join(' or ')}`);
        }
        const notesStr =
          notesStrs.length > 0 ? ` (${notesStrs.join('; ')})` : '';

        const displayRest = item.rest;

        clipboardText += `- ${mark} ${qtyStr}${unitStr}${displayRest}${notesStr}\n`;
      });
    }

    // Staples Block
    const filteredStaples = stapleItems.filter((item) => {
      const key = getIngredientKey(true, item.unit, item.rest);
      const isChecked = checkedIngredients.has(key);
      return !(omitChecked && isChecked);
    });

    if (filteredStaples.length > 0) {
      clipboardText += '\n### Pantry Staples\n';
      filteredStaples.forEach((item) => {
        const key = getIngredientKey(true, item.unit, item.rest);
        const isChecked = checkedIngredients.has(key);
        const mark = isChecked ? '[x]' : '[ ]';

        const qtyStr =
          item.qty !== null && item.qty > 0
            ? `${formatCookingNumber(item.qty)} `
            : '';
        const unitStr = item.unit ? `${item.unit} ` : '';
        const notesArr = item.notes || [];
        const recipes = Array.from(
          new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
        );
        const alts = Array.from(
          new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
        );
        const notesStrs = [];
        if (recipes.length > 0) {
          notesStrs.push(`from ${recipes.join(', ')}`);
        }
        if (alts.length > 0) {
          notesStrs.push(`or ${alts.join(' or ')}`);
        }
        const notesStr =
          notesStrs.length > 0 ? ` (${notesStrs.join('; ')})` : '';

        const displayRest = item.rest;

        clipboardText += `- ${mark} ${qtyStr}${unitStr}${displayRest}${notesStr}\n`;
      });
    }
  }

  navigator.clipboard
    .writeText(clipboardText)
    .then(() => {
      const copyBtn = document.getElementById('btn-copy-combined-list');
      if (copyBtn) {
        if (copyBtn.tagName === 'SELECT') {
          const copySelect = copyBtn as HTMLSelectElement;
          const placeholderOpt = copySelect.options[0];
          const originalText = placeholderOpt.textContent || 'Copy List';
          placeholderOpt.textContent = 'Copied!';
          copySelect.value = '';
          copySelect.classList.add('success');
          setTimeout(() => {
            placeholderOpt.textContent = originalText;
            copySelect.classList.remove('success');
          }, 2000);
        } else {
          const textSpan = copyBtn.querySelector('span');
          if (textSpan) {
            const originalText = textSpan.textContent;
            textSpan.textContent = 'Copied!';
            setTimeout(() => {
              textSpan.textContent = originalText;
            }, 2000);
          }
        }
      }
    })
    .catch((err) =>
      console.error('Could not copy shopping list to clipboard:', err),
    );
}

/**
 * Copies the sharing plan URL link
 */
function sharePlanUrl(): void {
  saveStateToStorageAndUrl(true);
  const link = window.location.href;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('btn-share-plan');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Link Copied!';
      setTimeout(() => (btn.textContent = orig), 2000);
    }
  });
}

/**
 * Floating add button listener logic for individual recipe pages
 */
export function initRecipePageAddToPlan(): void {
  // Floating back button handler for ?from=plan (Technical Decision Option A)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('from') && urlParams.get('from') === 'plan') {
    const backBtn = document.createElement('a');
    backBtn.href = getSiteBasePath() + 'plan/'; // Defaults to View UX
    backBtn.className = 'plan-back-btn';
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span>Back to Meal Plan</span>
    `;

    OverlayContainer.getInstance().add(backBtn);
  }
}

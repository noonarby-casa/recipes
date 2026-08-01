<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { recipesStore } from '../../stores/recipes';
  import { plannerStore, getLocalPlanFromStorage } from '../../stores/planner';
  import { settingsStore } from '../../stores/settings';
  import { favoritesStore } from '../../stores/favorites';
  import { filtersStore } from '../../stores/filters';
  import {
    shoppingCheckedStore,
    combinedShoppingList,
    getIngredientKey,
    isItemChecked,
  } from '../../stores/shopping';
  import {
    parsePlanUrlParams,
    planUrlQueryString,
  } from '../../stores/planUrlSync';
  import { ls } from '../../utils/storage';
  import {
    formatDayTitle,
    formatIsoDate,
    getDateSequence,
    getMondayOfWeek,
  } from '../../utils/dates';
  import type { PlannedItem, Recipe } from '../../types';
  import CalendarGrid from '../domain/CalendarGrid.svelte';
  import ShoppingListColumn from '../domain/ShoppingListColumn.svelte';
  import FiltersModal from '../domain/FiltersModal.svelte';
  import RecipeSelectorModal from '../domain/RecipeSelectorModal.svelte';
  import PlannedRecipeDetailsModal from '../domain/PlannedRecipeDetailsModal.svelte';
  import MealPlannerToolbar from '../domain/MealPlannerToolbar.svelte';
  import HistoryView from '../domain/HistoryView.svelte';
  import StorageDetailsModal from '../domain/StorageDetailsModal.svelte';
  import {
    getCalendarLedgerFromStorage,
    getLedgerStats,
  } from '../../stores/planner';
  import { getCalendarMonthMatrix } from '../../utils/dates';

  import ExportModal from '../domain/ExportModal.svelte';
  import type { ExportItem } from '../../pipelines/shoppingExportPipeline';

  let isFiltersModalOpen = $state(false);
  let isExportModalOpen = $state(false);
  let isStorageModalOpen = $state(false);
  let activeAddDay = $state<string | null>(null);
  let detailsItem = $state<PlannedItem | null>(null);

  let copyMenuLabel = $state('Copy Menu');
  let unsubscribeUrlSync: (() => void) | null = null;

  const now = new Date();
  let historyYear = $state(now.getFullYear());
  let historyMonth = $state(now.getMonth());

  let storageStats = $derived(getLedgerStats());

  let totalMonthMeals = $derived.by(() => {
    const ledger = getCalendarLedgerFromStorage();
    const matrix = getCalendarMonthMatrix(historyYear, historyMonth);
    let count = 0;
    matrix.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          const iso = formatIsoDate(cell);
          if (ledger[iso]) {
            count += ledger[iso].length;
          }
        }
      });
    });
    return count;
  });

  function prevHistoryMonth() {
    if (historyMonth === 0) {
      historyYear -= 1;
      historyMonth = 11;
    } else {
      historyMonth -= 1;
    }
  }

  function nextHistoryMonth() {
    if (historyMonth === 11) {
      historyYear += 1;
      historyMonth = 0;
    } else {
      historyMonth += 1;
    }
  }

  function jumpHistoryToday() {
    const today = new Date();
    historyYear = today.getFullYear();
    historyMonth = today.getMonth();
  }

  let combinedExportItems = $derived<ExportItem[]>([
    ...$combinedShoppingList.combinedBuyItems.map((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(isStaple, item.unit, item.item);
      return {
        ...item,
        isChecked: isItemChecked(key, isStaple, $shoppingCheckedStore),
        isOptional: false,
      };
    }),
    ...$combinedShoppingList.optionalItems.map((item) => {
      const key = getIngredientKey(false, item.unit, item.item);
      return {
        ...item,
        isChecked: isItemChecked(key, false, $shoppingCheckedStore),
        isOptional: true,
      };
    }),
  ]);

  function arePlansEqual(planA: PlannedItem[], planB: PlannedItem[]): boolean {
    if (planA.length !== planB.length) {
      return false;
    }
    for (let i = 0; i < planA.length; i++) {
      const a = planA[i];
      const b = planB[i];
      if (a.permalink !== b.permalink) {
        return false;
      }
      if (a.customTitle !== b.customTitle) {
        return false;
      }
      if ((a.date || a.day) !== (b.date || b.day)) {
        return false;
      }
      if (Math.abs(a.scale - b.scale) > 0.001) {
        return false;
      }

      const extraA = a.extraIngredients || [];
      const extraB = b.extraIngredients || [];
      if (extraA.length !== extraB.length) {
        return false;
      }
      for (let j = 0; j < extraA.length; j++) {
        if (extraA[j].item !== extraB[j].item) {
          return false;
        }
        if (extraA[j].qty !== extraB[j].qty) {
          return false;
        }
        if (extraA[j].unit !== extraB[j].unit) {
          return false;
        }
      }
    }
    return true;
  }

  onMount(async () => {
    document.body.classList.add('meal-planner-layout');
    try {
      const res = await fetch('/index.json');
      if (!res.ok) {
        throw new Error('Failed to fetch recipes index');
      }
      const data: Recipe[] = await res.json();
      recipesStore.set(data);

      const urlInfo = parsePlanUrlParams(data, window.location.search);
      const urlPlan = urlInfo.plan;
      const urlStartDate = urlInfo.startDate;
      const urlDurationDays = urlInfo.durationDays;
      const urlWorkWeekOnly = urlInfo.workWeekOnly;
      const urlActiveTab = urlInfo.activeTab;

      settingsStore.update((s) => ({
        ...s,
        startDate: urlStartDate,
        durationDays: urlDurationDays,
        workWeekOnly: urlWorkWeekOnly,
        activeTab: urlActiveTab,
      }));

      const localPlanExists =
        ls.has('noonarby-calendar-ledger') || ls.has('noonarby-meal-plan');
      const localPlan = getLocalPlanFromStorage();

      const hasConflict =
        urlInfo.hasValidParams &&
        localPlanExists &&
        (urlWorkWeekOnly !== $settingsStore.workWeekOnly ||
          !arePlansEqual(urlPlan, localPlan));

      if (hasConflict) {
        plannerStore.setConflict(urlPlan, localPlan);
      } else {
        if (urlInfo.hasValidParams) {
          plannerStore.reorderRecipes(urlPlan);
        } else {
          plannerStore.reloadActivePlan();
        }
      }
    } catch (e) {
      console.error('Error in onMount initialization:', e);
    }

    unsubscribeUrlSync = planUrlQueryString.subscribe((query) => {
      if (query === null) {
        return;
      }
      const path = window.location.pathname;
      const nextUrl = query ? `${path}?${query}` : path;
      window.history.replaceState({}, '', nextUrl);
    });
  });

  onDestroy(() => {
    if (unsubscribeUrlSync) {
      unsubscribeUrlSync();
    }
    document.body.classList.remove('meal-planner-layout');
  });

  // Global Portions Scaler (+/-)
  function adjustGlobalPortions(offset: number) {
    const recipes = $recipesStore;
    plannerStore.update((state) => {
      const nextPlan = state.plan.map((planned) => {
        const rec = planned.permalink
          ? recipes.find((r) => r.permalink === planned.permalink)
          : undefined;
        const defaultServings = rec ? rec.servings : 4;
        const currentPortions = Math.round(planned.scale * defaultServings);
        const nextPortions = Math.max(1, currentPortions + offset);
        return { ...planned, scale: nextPortions / defaultServings };
      });
      if (!state.isPreviewing) {
        ls.setJson('noonarby-meal-plan', nextPlan);
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: state.isPreviewing ? state.localPlan : nextPlan,
      };
    });
  }

  function handleAddRecipeClick(day: string) {
    activeAddDay = day;
  }

  function handleRecipeSelected(permalink: string) {
    if (activeAddDay) {
      plannerStore.addRecipe(activeAddDay, permalink);
      activeAddDay = null;
    }
  }

  function handleSwapRecipeClick(item: PlannedItem) {
    const recipes = $recipesStore;
    if (recipes.length === 0) {
      return;
    }

    const itemKey = item.date || item.day;
    const dayMeals = $plannerStore.plan.filter(
      (p) => (p.date || p.day) === itemKey,
    );
    const isDinnerSlot =
      itemKey !== 'supplemental' && dayMeals.indexOf(item) === 0;

    const filters = $filtersStore;
    const favs = $favoritesStore;
    let pool = recipes;

    if (filters.favoritesOnly) {
      pool = pool.filter((r) => r.shortId && favs.includes(r.shortId));
    }
    if (isDinnerSlot) {
      pool = pool.filter(
        (r) => r.tags && r.tags.some((t) => t.toLowerCase() === 'dinner'),
      );
    }

    const plannedPermalinks = new Set(
      $plannerStore.plan.map((p) => p.permalink),
    );
    let candidates = pool.filter((r) => !plannedPermalinks.has(r.permalink));
    if (candidates.length === 0) {
      candidates = pool.filter((r) => r.permalink !== item.permalink);
    }
    if (candidates.length === 0) {
      candidates = pool;
    }

    const randomRec = candidates[Math.floor(Math.random() * candidates.length)];
    plannerStore.update((state) => {
      const nextPlan = state.plan.map((p) =>
        p.instanceId === item.instanceId
          ? { ...p, permalink: randomRec.permalink }
          : p,
      );
      if (!state.isPreviewing) {
        ls.setJson('noonarby-meal-plan', nextPlan);
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: state.isPreviewing ? state.localPlan : nextPlan,
      };
    });
  }

  function handleEditDetailsClick(item: PlannedItem) {
    detailsItem = item;
  }

  function sharePlanUrl() {
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

  function copyMenuTextToClipboard() {
    if ($plannerStore.plan.length === 0) {
      return;
    }

    const activeDates = getDateSequence(
      $settingsStore.startDate || formatIsoDate(getMondayOfWeek()),
      $settingsStore.durationDays || 5,
    );
    let text = 'My Meal Plan:\n';

    activeDates.forEach((dateStr) => {
      const dayRecipes = $plannerStore.plan.filter(
        (p) => (p.date || p.day) === dateStr,
      );
      text += `\n${formatDayTitle(dateStr)}:\n`;
      if (dayRecipes.length === 0) {
        text += '  - No meals planned\n';
      } else {
        dayRecipes.forEach((dm) => {
          const rec = dm.permalink
            ? $recipesStore.find((r) => r.permalink === dm.permalink)
            : undefined;
          const title = rec ? rec.title : dm.customTitle || 'Custom Item';
          const servings = rec ? rec.servings : 4;
          const portions = Math.round(dm.scale * servings);
          text += `  - ${title} (${portions} servings)\n`;
        });
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      copyMenuLabel = 'Copied!';
      setTimeout(() => (copyMenuLabel = 'Copy Menu'), 2000);
    });
  }

  let showGenerateFallbackNotice = $state(false);

  function handleGenerateDinnerPlan() {
    showGenerateFallbackNotice = false;
    const planChanged = plannerStore.generateDinnerPlan();
    if (!planChanged) {
      if ($filtersStore.favoritesOnly) {
        showGenerateFallbackNotice = true;
      }
    }
  }

  function handleFallbackGenerateAll() {
    filtersStore.update((f) => ({ ...f, favoritesOnly: false }));
    plannerStore.generateDinnerPlan();
    showGenerateFallbackNotice = false;
  }

  let shoppingCount = $derived($plannerStore.plan.length);
  let removedRecipeTitle = $derived.by(() => {
    if (!$plannerStore.lastRemovedRecipe) {
      return '';
    }
    const item = $plannerStore.lastRemovedRecipe;
    const rec = item.permalink
      ? $recipesStore.find((r) => r.permalink === item.permalink)
      : undefined;
    return rec ? rec.title : item.customTitle || 'Recipe';
  });
</script>

<!-- 1. Conflict Banner -->
{#if $plannerStore.hasConflict}
  <div id="plan-conflict-banner" class="planner-banner">
    <div class="banner-compare-group">
      <span class="banner-text">Viewing shared plan. Compare layouts:</span>
      <div class="banner-tabs">
        <button
          type="button"
          id="btn-compare-shared"
          class="banner-tab {$plannerStore.previewMode === 'shared'
            ? 'active btn-brand'
            : ''}"
          onclick={() => {
            plannerStore.showSharedPreview();
            const params = new URLSearchParams(window.location.search);
            const wVal = params.get('w') || params.get('week');
            settingsStore.update((s) => ({ ...s, workWeekOnly: wVal !== '7' }));
          }}
        >
          View Shared Plan
        </button>
        <button
          type="button"
          id="btn-compare-local"
          class="banner-tab {$plannerStore.previewMode === 'local'
            ? 'active btn-brand'
            : ''}"
          onclick={() => {
            plannerStore.showLocalPreview();
            const storedSettings = ls.getJson<{ workWeekOnly?: boolean }>('noonarby-meal-plan-settings');
            if (storedSettings?.workWeekOnly !== undefined) {
              settingsStore.update((s) => ({
                ...s,
                workWeekOnly: !!storedSettings.workWeekOnly,
              }));
            }
          }}
        >
          View My Draft
        </button>
      </div>
    </div>
    <div class="banner-actions">
      <button
        type="button"
        id="btn-banner-keep"
        class="banner-btn btn-brand"
        title="Keep your local draft and clear shared parameters"
        onclick={() => plannerStore.keepLocal()}
      >
        Keep My Draft
      </button>
      <button
        type="button"
        id="btn-banner-load"
        class="banner-btn btn-brand"
        title="Overwrite your draft with the shared plan"
        onclick={() => plannerStore.loadShared()}
      >
        Load Shared Plan
      </button>
      <button
        type="button"
        id="btn-banner-merge"
        class="banner-btn btn-brand"
        title="Merge shared plan into your local draft"
        onclick={() => plannerStore.mergePlan()}
      >
        Merge Both
      </button>
    </div>
  </div>
{/if}

{#if showGenerateFallbackNotice}
  <div id="planner-fav-fallback-banner" class="planner-banner fav-fallback-banner">
    <div class="banner-compare-group">
      <span class="banner-text">
        No favorited dinner recipes found. Would you like to generate your dinner plan using all catalog recipes?
      </span>
    </div>
    <div class="banner-actions">
      <button
        type="button"
        class="banner-btn btn-brand"
        onclick={handleFallbackGenerateAll}
      >
        Generate from All Recipes
      </button>
      <button
        type="button"
        class="planner-clear-btn"
        onclick={() => (showGenerateFallbackNotice = false)}
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}

<MealPlannerToolbar
  activeTab={$settingsStore.activeTab}
  startDate={$settingsStore.startDate}
  durationDays={$settingsStore.durationDays}
  shoppingCount={shoppingCount}
  hasPlan={$plannerStore.plan.length > 0}
  copyMenuLabel={copyMenuLabel}
  historyYear={historyYear}
  historyMonth={historyMonth}
  storageKb={storageStats.storageKb}
  storagePercent={storageStats.percent}
  totalMonthMeals={totalMonthMeals}
  onTabChange={(tab) => {
    settingsStore.update((s) => ({ ...s, activeTab: tab }));
    plannerStore.reloadActivePlan();
  }}
  onRangeChange={(startDate, durationDays) => {
    settingsStore.update((s) => ({
      ...s,
      startDate,
      durationDays,
      workWeekOnly: durationDays === 5,
    }));
    plannerStore.reloadActivePlan();
  }}
  onAdjustPortions={adjustGlobalPortions}
  onOpenFilters={() => (isFiltersModalOpen = true)}
  onGenerateDinnerPlan={handleGenerateDinnerPlan}
  onClearPlan={() => plannerStore.clearPlan()}
  onSharePlan={sharePlanUrl}
  onExportList={() => (isExportModalOpen = true)}
  onCopyMenu={copyMenuTextToClipboard}
  onResetCheckboxes={() => shoppingCheckedStore.clearChecked()}
  onPrevHistoryMonth={prevHistoryMonth}
  onNextHistoryMonth={nextHistoryMonth}
  onJumpHistoryToday={jumpHistoryToday}
  onSelectHistoryMonthYear={(y, m) => {
    historyYear = y;
    historyMonth = m;
  }}
  onOpenStorageModal={() => (isStorageModalOpen = true)}
  onJumpActivePlan={() => {
    const mon = formatIsoDate(getMondayOfWeek());
    settingsStore.update((s) => ({
      ...s,
      startDate: mon,
      durationDays: 5,
      workWeekOnly: true,
      activeTab: 'view',
    }));
    plannerStore.reloadActivePlan();
  }}
/>

<!-- 6. Main Grid / Columns Wrapper -->
<div class="meal-planner-container">
  {#if $settingsStore.activeTab === 'edit' || $settingsStore.activeTab === 'view'}
    <CalendarGrid
      editMode={$settingsStore.activeTab === 'edit'}
      onAddRecipe={handleAddRecipeClick}
      onSwapRecipe={handleSwapRecipeClick}
      onEditDetails={handleEditDetailsClick}
    />
  {/if}
  {#if $settingsStore.activeTab === 'shop'}
    <ShoppingListColumn />
  {/if}
  {#if $settingsStore.activeTab === 'history'}
    <HistoryView
      viewYear={historyYear}
      viewMonth={historyMonth}
      onSelectWindow={(startDate, durationDays) => {
        settingsStore.update((s) => ({
          ...s,
          startDate,
          durationDays,
          workWeekOnly: durationDays === 5,
          activeTab: 'view',
        }));
        plannerStore.reloadActivePlan();
      }}
    />
  {/if}
</div>

<!-- 7. Modals & Dialogs -->
<FiltersModal
  isOpen={isFiltersModalOpen}
  onClose={() => (isFiltersModalOpen = false)}
/>
<ExportModal
  isOpen={isExportModalOpen}
  onClose={() => (isExportModalOpen = false)}
  title="Combined Shopping List"
  items={combinedExportItems}
/>
<StorageDetailsModal
  isOpen={isStorageModalOpen}
  onClose={() => (isStorageModalOpen = false)}
/>

{#if activeAddDay}
  <RecipeSelectorModal
    isOpen={!!activeAddDay}
    day={activeAddDay}
    onClose={() => (activeAddDay = null)}
    onSelect={handleRecipeSelected}
  />
{/if}

{#if detailsItem}
  <PlannedRecipeDetailsModal
    isOpen={!!detailsItem}
    item={detailsItem}
    onClose={() => (detailsItem = null)}
  />
{/if}

<!-- 8. Recovery / Undo Toast -->
{#if $plannerStore.lastRemovedRecipe}
  <div class="plan-toast-notification">
    <div class="toast-body">
      <span
        >Removed <strong>{removedRecipeTitle}</strong> from {formatDayTitle(
          $plannerStore.lastRemovedRecipe.date ||
            $plannerStore.lastRemovedRecipe.day ||
            '',
        )}.</span
      >
      <button
        type="button"
        class="toast-undo-btn"
        onclick={() => plannerStore.undoRemove()}>Undo</button
      >
    </div>
    <button
      type="button"
      class="icon-close-btn"
      aria-label="Dismiss toast"
      onclick={() => plannerStore.clearLastRemoved()}>✕</button
    >
  </div>
{/if}

<style>
  .meal-planner-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }



  .planner-banner {
    align-items: center;
    background-color: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue-border-light);
    border-radius: 12px;
    box-shadow: var(--btn-shadow);
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 1rem 1.5rem;
  }

  .banner-compare-group {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .banner-tabs {
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 8px;
    display: flex;
    padding: 2px;
  }

  .banner-tab {
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--font-btn-text);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.3rem 0.75rem;
    transition: all 0.2s ease;
  }

  .banner-tab:hover {
    color: var(--noonblue);
  }

  .banner-actions {
    display: flex;
    gap: 0.5rem;
  }

  .banner-btn {
    border: none;
    border-radius: 6px;
    box-shadow: 0 2px 5px var(--noonblue-shadow-subtle);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.4rem 0.85rem;
    transition: all 0.2s ease;
  }

  .banner-btn:hover {
    transform: translateY(-1px);
  }

  .plan-toast-notification {
    align-items: center;
    animation: slideIn 0.3s ease;
    background-color: var(--card-bg);
    border: 1px solid var(--noonblue-border-light);
    border-left: 4px solid var(--noonblue);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    font-size: 0.85rem;
    gap: 1rem;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding: 0.75rem 1rem;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .plan-toast-notification .toast-body {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .plan-toast-notification .toast-undo-btn {
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--noonblue);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }

  .plan-toast-notification .toast-undo-btn:hover {
    background-color: var(--border-ultra-subtle);
    color: var(--noonblue);
  }

  #plan-conflict-banner,
  .fav-fallback-banner {
    display: flex;
  }

  @media (min-width: 768px) {
    .meal-planner-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      grid-area: container;
      height: 100%;
      margin-top: 0;
      min-height: 0;
      overflow: hidden;
    }
  }


</style>

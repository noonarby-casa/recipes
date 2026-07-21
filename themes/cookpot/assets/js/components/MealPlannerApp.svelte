<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { recipesStore } from '../stores/recipes';
  import { plannerStore } from '../stores/planner';
  import { settingsStore } from '../stores/settings';
  import { favoritesStore } from '../stores/favorites';
  import { filtersStore } from '../stores/filters';
  import { shoppingCheckedStore, combinedShoppingList, getIngredientKey, isItemChecked } from '../stores/shopping';
  import { parsePlanUrlParams, planUrlQueryString } from '../stores/planUrlSync';
  import type { PlannedItem, Recipe } from '../types';
  import CalendarGrid from './CalendarGrid.svelte';
  import ShoppingListColumn from './ShoppingListColumn.svelte';
  import FiltersModal from './FiltersModal.svelte';
  import RecipeSelectorModal from './RecipeSelectorModal.svelte';
  import PlannedRecipeDetailsModal from './PlannedRecipeDetailsModal.svelte';
  import { formatItemQuantity } from '../units';
  import { STORE_LAYOUTS } from '../shopping-list/store-sections';
  import ToggleGroup from './ToggleGroup.svelte';

  let isFiltersModalOpen = $state(false);
  let activeAddDay = $state<string | null>(null);
  let detailsItem = $state<PlannedItem | null>(null);

  let copyListLabel = $state('Copy Unchecked');
  let copyMenuLabel = $state('Copy Menu');
  let unsubscribeUrlSync: (() => void) | null = null;

  const DAY_NAMES: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    supplemental: 'Anytime / Supplemental'
  };



  function getLocalPlanFromStorage(): PlannedItem[] {
    if (typeof localStorage === 'undefined') {return [];}
    try {
      const raw = localStorage.getItem('noonarby-meal-plan');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading plan from storage:', e);
    }
    return [];
  }

  function arePlansEqual(planA: PlannedItem[], planB: PlannedItem[]): boolean {
    if (planA.length !== planB.length) {return false;}
    for (let i = 0; i < planA.length; i++) {
      const a = planA[i];
      const b = planB[i];
      if (a.permalink !== b.permalink) {return false;}
      if (a.customTitle !== b.customTitle) {return false;}
      if (a.day !== b.day) {return false;}
      if (Math.abs(a.scale - b.scale) > 0.001) {return false;}
      
      const extraA = a.extraIngredients || [];
      const extraB = b.extraIngredients || [];
      if (extraA.length !== extraB.length) {return false;}
      for (let j = 0; j < extraA.length; j++) {
        if (extraA[j].item !== extraB[j].item) {return false;}
        if (extraA[j].qty !== extraB[j].qty) {return false;}
        if (extraA[j].unit !== extraB[j].unit) {return false;}
      }
    }
    return true;
  }

  onMount(async () => {
    document.body.classList.add('meal-planner-layout');
    try {
      const res = await fetch('/index.json');
      if (!res.ok) {throw new Error('Failed to fetch recipes index');}
      const data: Recipe[] = await res.json();
      recipesStore.set(data);

      const urlInfo = parsePlanUrlParams(data, window.location.search);
      const urlPlan = urlInfo.plan;
      const urlWorkWeekOnly = urlInfo.workWeekOnly;
      const urlActiveTab = urlInfo.activeTab;

      const localPlanExists = !!localStorage.getItem('noonarby-meal-plan');
      const localPlan = getLocalPlanFromStorage();

      const hasConflict =
        urlInfo.hasValidParams &&
        localPlanExists &&
        (urlWorkWeekOnly !== $settingsStore.workWeekOnly || !arePlansEqual(urlPlan, localPlan));

      if (hasConflict) {
        plannerStore.setConflict(urlPlan, localPlan);
        settingsStore.update((s) => ({ ...s, workWeekOnly: urlWorkWeekOnly, activeTab: 'view' }));
      } else {
        if (urlInfo.hasValidParams) {
          plannerStore.reorderRecipes(urlPlan);
          settingsStore.update((s) => ({
            ...s,
            workWeekOnly: urlWorkWeekOnly,
            activeTab: urlActiveTab,
          }));
        } else {
          plannerStore.reorderRecipes(localPlan);
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
        const rec = planned.permalink ? recipes.find((r) => r.permalink === planned.permalink) : undefined;
        if (!rec) {return planned;}
        const currentPortions = Math.round(planned.scale * rec.servings);
        const nextPortions = Math.max(1, currentPortions + offset);
        return { ...planned, scale: nextPortions / rec.servings };
      });
      if (!state.isPreviewing) {
        localStorage.setItem('noonarby-meal-plan', JSON.stringify(nextPlan));
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
    if (recipes.length === 0) {return;}

    const dayMeals = $plannerStore.plan.filter((p) => p.day === item.day);
    const isDinnerSlot = item.day !== 'supplemental' && dayMeals.indexOf(item) === 0;

    const filters = $filtersStore;
    const favs = $favoritesStore;
    let pool = recipes;

    if (filters.favoritesOnly) {
      pool = pool.filter((r) => r.shortId && favs.includes(r.shortId));
    }
    if (isDinnerSlot) {
      pool = pool.filter((r) => r.tags && r.tags.some((t) => t.toLowerCase() === 'dinner'));
    }

    const plannedPermalinks = new Set($plannerStore.plan.map((p) => p.permalink));
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
        p.instanceId === item.instanceId ? { ...p, permalink: randomRec.permalink } : p
      );
      if (!state.isPreviewing) {
        localStorage.setItem('noonarby-meal-plan', JSON.stringify(nextPlan));
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
    if ($plannerStore.plan.length === 0) {return;}

    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const activeDays = $settingsStore.workWeekOnly ? DAYS.slice(0, 5) : DAYS;
    let text = 'My Weekly Meal Plan:\n';

    activeDays.forEach((day) => {
      const dayRecipes = $plannerStore.plan.filter((p) => p.day === day);
      text += `\n${DAY_NAMES[day]}:\n`;
      if (dayRecipes.length === 0) {
        text += '  - No meals planned\n';
      } else {
        dayRecipes.forEach((dm) => {
          const rec = dm.permalink ? $recipesStore.find((r) => r.permalink === dm.permalink) : undefined;
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

  function getNotesString(item: any): string {
    const parts: string[] = [];
    if (!item.note) {return '';}

    const sizeNote = item.note.sizeNote;
    if (sizeNote) {parts.push(sizeNote);}

    const groups: Record<string, GroupedNote> = {};
    interface GroupedNote {
      descriptor?: string;
      altItem?: string;
      recipes: string[];
    }

    (item.note.ingredientNotes || []).forEach((n: any) => {
      const desc = n.descriptor || '';
      const alt = n.altItem || '';
      const recipe = n.recipe;

      const key = `${desc}|${alt}`;
      if (!groups[key]) {
        groups[key] = {
          descriptor: n.descriptor,
          altItem: n.altItem,
          recipes: [],
        };
      }
      if (recipe && !groups[key].recipes.includes(recipe)) {
        groups[key].recipes.push(recipe);
      }
    });

    Object.values(groups).forEach((group) => {
      const detailParts: string[] = [];
      if (group.descriptor) {detailParts.push(group.descriptor);}
      if (group.altItem) {detailParts.push(`or ${group.altItem}`);}
      const detailText = detailParts.join(' ');

      if (group.recipes.length > 0) {
        parts.push(`${detailText} for ${group.recipes.join(', ')}`);
      } else if (detailText) {
        parts.push(detailText);
      }
    });

    return parts.join('; ');
  }

  function formatItemNotes(item: any): string {
    const notesStr = getNotesString(item);
    return notesStr ? ` (${notesStr})` : '';
  }

  function getKeepNotesString(item: any): string {
    const parts: string[] = [];
    if (!item.note) {return '';}

    const sizeNote = item.note.sizeNote;
    if (sizeNote) {parts.push(sizeNote);}

    const groups: Record<string, any> = {};
    (item.note.ingredientNotes || []).forEach((n: any) => {
      const desc = n.descriptor || '';
      const alt = n.altItem || '';
      const key = `${desc}|${alt}`;
      if (!groups[key]) {
        groups[key] = {
          descriptor: n.descriptor,
          altItem: n.altItem,
        };
      }
    });

    Object.values(groups).forEach((group) => {
      const detailParts: string[] = [];
      if (group.descriptor) {detailParts.push(group.descriptor);}
      if (group.altItem) {detailParts.push(`or ${group.altItem}`);}
      if (detailParts.length > 0) {
        parts.push(detailParts.join(' '));
      }
    });

    return parts.join('; ');
  }

  function formatKeepItemNotes(item: any): string {
    const notesStr = getKeepNotesString(item);
    return notesStr ? ` (${notesStr})` : '';
  }

  function handleCopyListChange(e: Event) {
    const select = e.currentTarget as HTMLSelectElement;
    const format = select.value as 'markdown' | 'google-keep';
    if (!format) {return;}

    const { buyItems, optionalItems, stapleItems } = $combinedShoppingList;
    const getSection = (category: string) => {
      const activeLayout = STORE_LAYOUTS[0]; // use default standard layout for formatting sections
      const section = activeLayout.sections.find((s) => s.categories.includes(category));
      return section || activeLayout.sections[activeLayout.sections.length - 1];
    };

    const combinedBuy = [...buyItems, ...stapleItems].sort((a, b) => {
      const secA = getSection(a.category);
      const secB = getSection(b.category);
      if (secA.order !== secB.order) {return secA.order - secB.order;}
      return a.item.localeCompare(b.item);
    });

    const filteredBuy = combinedBuy.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(isStaple, item.unit, item.item);
      return !isItemChecked(key, isStaple, $shoppingCheckedStore);
    });

    const filteredOptional = optionalItems.filter((item) => {
      const key = getIngredientKey(false, item.unit, item.item);
      return !isItemChecked(key, false, $shoppingCheckedStore);
    });

    let clipboardText = '';
    if (format === 'google-keep') {
      const buyLines = filteredBuy.map((item) => {
        const { qtyStr, itemStr } = formatItemQuantity(item.qty, item.unit, item.item);
        const notesStr = formatKeepItemNotes(item);
        return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}`;
      });
      const optionalLines = filteredOptional.map((item) => {
        const { qtyStr, itemStr } = formatItemQuantity(item.qty, item.unit, item.item);
        const notesStr = formatKeepItemNotes(item);
        return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr} (optional)`;
      });
      clipboardText = [...buyLines, ...optionalLines].join('\n');
    } else {
      clipboardText = '## Combined Shopping List\n';
      if (filteredBuy.length > 0) {
        let currentSectionId = '';
        filteredBuy.forEach((item) => {
          const section = getSection(item.category);
          if (section.id !== currentSectionId) {
            currentSectionId = section.id;
            clipboardText += `\n[ ${section.name} ]\n`;
          }
          const { qtyStr, itemStr } = formatItemQuantity(item.qty, item.unit, item.item);
          const notesStr = formatItemNotes(item);
          clipboardText += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}\n`;
        });
      }
      if (filteredOptional.length > 0) {
        clipboardText += '\n### Optional\n';
        filteredOptional.forEach((item) => {
          const { qtyStr, itemStr } = formatItemQuantity(item.qty, item.unit, item.item);
          const notesStr = formatItemNotes(item);
          clipboardText += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}\n`;
        });
      }
    }

    navigator.clipboard.writeText(clipboardText).then(() => {
      copyListLabel = 'Copied!';
      select.value = '';
      setTimeout(() => (copyListLabel = 'Copy Unchecked'), 2000);
    });
  }

  function handleGenerateDinnerPlan() {
    const planChanged = plannerStore.generateDinnerPlan();
    if (!planChanged) {
      // display warning toast if favorites filter is active but no favorites exist
      if ($filtersStore.favoritesOnly) {
        alert('No dinner recipes have been favorited yet. Add some favorites to generate a dinner plan.');
      }
    }
  }

  let shoppingCount = $derived($plannerStore.plan.length);
  let removedRecipeTitle = $derived.by(() => {
    if (!$plannerStore.lastRemovedRecipe) {return '';}
    const item = $plannerStore.lastRemovedRecipe;
    const rec = item.permalink ? $recipesStore.find((r) => r.permalink === item.permalink) : undefined;
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
          class="banner-tab {$plannerStore.previewMode === 'shared' ? 'active btn-brand' : ''}"
          onclick={() => {
            plannerStore.showSharedPreview();
            const params = new URLSearchParams(window.location.search);
            const wVal = params.get('w') || params.get('week');
            settingsStore.update(s => ({ ...s, workWeekOnly: wVal !== '7' }));
          }}
        >
          View Shared Plan
        </button>
        <button
          type="button"
          id="btn-compare-local"
          class="banner-tab {$plannerStore.previewMode === 'local' ? 'active btn-brand' : ''}"
          onclick={() => {
            plannerStore.showLocalPreview();
            const rawSettings = localStorage.getItem('noonarby-meal-plan-settings');
            if (rawSettings) {
              const parsed = JSON.parse(rawSettings);
              if (parsed.workWeekOnly !== undefined) {
                settingsStore.update(s => ({ ...s, workWeekOnly: !!parsed.workWeekOnly }));
              }
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

<!-- 2. Mode Selector Header Row -->
<div class="planner-mode-header">
  <div class="mode-toggle-group">
    <ToggleGroup
      options={[
        { id: 'edit', label: 'Edit Plan', idAttr: 'mode-edit-btn' },
        { id: 'view', label: 'View Plan', idAttr: 'mode-view-btn' },
        { id: 'shop', label: `Shopping List` + (shoppingCount > 0 ? ` (${shoppingCount})` : ''), idAttr: 'mode-shop-btn' }
      ]}
      selectedId={$settingsStore.activeTab}
      onChange={(id) => settingsStore.update(s => ({ ...s, activeTab: id as any }))}
    />
  </div>
</div>

<!-- 3. Edit Toolbar -->
<div
  class="planner-controls-toolbar"
  class:visible={$settingsStore.activeTab === 'edit'}
  id="toolbar-edit"
>
  <div class="week-toggle-group" id="week-toggle-group">
    <ToggleGroup
      options={[
        { id: '7day', label: '7-Day Week', idAttr: 'week-7day-btn' },
        { id: '5day', label: '5-Day Week', idAttr: 'week-5day-btn' }
      ]}
      selectedId={$settingsStore.workWeekOnly ? '5day' : '7day'}
      onChange={(id) => settingsStore.update(s => ({ ...s, workWeekOnly: id === '5day' }))}
    />
  </div>

  <div class="global-scaler-panel" id="global-scaler-panel">
    <span class="global-scaler-label">Adjust Servings</span>
    <div class="portion-picker">
      <button
        type="button"
        class="portion-btn"
        id="global-dec-btn"
        title="Scale down all recipe portions by 1"
        onclick={() => adjustGlobalPortions(-1)}
      >
        -
      </button>
      <span class="portion-val" id="global-scaler-indicator">{$plannerStore.plan.length > 0 ? 'Portions' : '—'}</span>
      <button
        type="button"
        class="portion-btn"
        id="global-inc-btn"
        title="Scale up all recipe portions by 1"
        onclick={() => adjustGlobalPortions(1)}
      >
        +
      </button>
    </div>
  </div>

  <div class="planner-top-actions">
    <button
      type="button"
      id="btn-toggle-filters"
      class="planner-btn-secondary"
      onclick={() => isFiltersModalOpen = true}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      Filters
    </button>
    <button
      type="button"
      id="btn-generate-plan"
      class="planner-btn-primary btn-brand"
      onclick={handleGenerateDinnerPlan}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"></circle>
      </svg>
      Generate Dinner Plan
    </button>
    <button type="button" id="btn-clear-plan" class="planner-clear-btn" onclick={() => plannerStore.clearPlan()}>
      Clear Plan
    </button>
  </div>
</div>

<!-- 4. View Toolbar -->
<div
  class="planner-controls-toolbar"
  class:visible={$settingsStore.activeTab === 'view'}
  id="toolbar-view"
>
  <div class="planner-top-actions">
    <button type="button" id="btn-share-plan" class="planner-btn-secondary" onclick={sharePlanUrl}>
      Share Plan
    </button>
  </div>
</div>

<!-- 5. Shop Toolbar -->
<div
  class="planner-controls-toolbar"
  class:visible={$settingsStore.activeTab === 'shop'}
  id="toolbar-shop"
>
  <div class="planner-top-actions">
    <select
      id="btn-copy-combined-list"
      class="dropdown-select"
      aria-label="Copy shopping list options"
      onchange={handleCopyListChange}
    >
      <option value="" disabled selected hidden>{copyListLabel}</option>
      <option value="markdown">Markdown</option>
      <option value="google-keep">Google Keep</option>
    </select>
    <button
      type="button"
      id="btn-copy-menu-text"
      class="planner-btn-secondary"
      title="Copy weekly menu as plain text"
      onclick={copyMenuTextToClipboard}
    >
      {copyMenuLabel}
    </button>
    <button
      type="button"
      class="planner-clear-btn"
      id="btn-reset-shopping-list"
      title="Reset checkboxes"
      onclick={() => shoppingCheckedStore.clearChecked()}
    >
      Reset Checkboxes
    </button>
  </div>
</div>

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
</div>

<!-- 7. Modals & Dialogs -->
<FiltersModal isOpen={isFiltersModalOpen} onClose={() => isFiltersModalOpen = false} />

{#if activeAddDay}
  <RecipeSelectorModal
    isOpen={!!activeAddDay}
    day={activeAddDay}
    onClose={() => activeAddDay = null}
    onSelect={handleRecipeSelected}
  />
{/if}

{#if detailsItem}
  <PlannedRecipeDetailsModal
    isOpen={!!detailsItem}
    item={detailsItem}
    onClose={() => detailsItem = null}
  />
{/if}

<!-- 8. Recovery / Undo Toast -->
{#if $plannerStore.lastRemovedRecipe}
  <div class="plan-toast-notification">
    <div class="toast-body">
      <span>Removed <strong>{removedRecipeTitle}</strong> from {DAY_NAMES[$plannerStore.lastRemovedRecipe.day]}.</span>
      <button type="button" class="toast-undo-btn" onclick={() => plannerStore.undoRemove()}>Undo</button>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Dismiss toast" onclick={() => plannerStore.clearLastRemoved()}>✕</button>
  </div>
{/if}

<style>
  #plan-conflict-banner {
    display: flex;
  }
  .planner-controls-toolbar {
    display: none;
  }
  .planner-controls-toolbar.visible {
    display: flex;
  }
  .plan-toast-notification {
    display: flex;
  }
</style>

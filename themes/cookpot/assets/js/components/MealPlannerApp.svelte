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
  import SearchIcon from './icons/SearchIcon.svelte';
  import DiceIcon from './icons/DiceIcon.svelte';

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
      class="btn btn-secondary"
      onclick={() => isFiltersModalOpen = true}
    >
      <SearchIcon size={14} strokeWidth={2.5} />
      Filters
    </button>
    <button
      type="button"
      id="btn-generate-plan"
      class="btn btn-brand"
      onclick={handleGenerateDinnerPlan}
    >
      <DiceIcon size={14} strokeWidth={2.5} />
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
    <button type="button" id="btn-share-plan" class="btn btn-secondary" onclick={sharePlanUrl}>
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
      class="btn btn-secondary"
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
    <button type="button" class="icon-close-btn" aria-label="Dismiss toast" onclick={() => plannerStore.clearLastRemoved()}>✕</button>
  </div>
{/if}

<style>
  .meal-planner-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .planner-mode-header {
    align-items: center;
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem 1.25rem;
  }

  .planner-controls-toolbar {
    align-items: center;
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: none;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1.25rem;
  }

  .planner-controls-toolbar.visible {
    display: flex;
  }

  .planner-top-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .global-scaler-panel {
    align-items: center;
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 10px;
    display: inline-flex;
    gap: 0.75rem;
    padding: 3px 0.75rem 3px 3px;
  }

  .global-scaler-label {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding-left: 0.5rem;
    text-transform: uppercase;
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

  #plan-conflict-banner {
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

  @media (max-width: 767px) {
    .planner-controls-toolbar {
      gap: 0.75rem;
      justify-content: center;
    }
  }
</style>



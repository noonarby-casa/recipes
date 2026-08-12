<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { recipesStore } from '../../stores/recipes';
  import { filtersStore, filterRecipes } from '../../stores/filters';
  import { favoritesStore } from '../../stores/favorites';
  import { scrollable } from '../../actions/scrollable';
  import type { IngredientInput, Recipe, ShoppingItem } from '../../types';
  import {
    scaleIngredient,
    getIngredientKey,
    isItemChecked,
  } from '../../stores/shopping';
  import { processShoppingList } from '../../pipelines/pipeline';
  import {
    STORE_LAYOUTS,
    getSectionForCategory,
    getActiveStoreLayoutId,
    compareShoppingItems,
  } from '../../data/store-sections';
  import StorePicker from '../domain/StorePicker.svelte';
  import ToggleGroup, { type Option } from '../primitives/ToggleGroup.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import HeartIcon from '../primitives/icons/HeartIcon.svelte';
  import ShoppingListItemRow from '../domain/ShoppingListItemRow.svelte';

  import { getUrlParams, updateUrlParams, onUrlChange } from '../../utils/urlSync';
  import {
    parseRecipeUrlParams,
    serializeRecipeUrlParams,
  } from '../../utils/shoppingDebugUrlSync';

  // 1. Isolated Svelte State
  let searchQuery = $state('');
  // Map of permalink -> selectedServings
  let selectedRecipeServings = $state<Record<string, number>>({});
  let isolatedStoreLayoutId = $state<string>(getActiveStoreLayoutId());
  let isolatedCheckedStates = $state<Record<string, boolean>>({});
  let isolatedAltSelections = $state<Record<string, string>>({});
  let activeMobileTab = $state<'recipes' | 'shopping'>('recipes');
  let isInitialized = false;

  let recipes = $derived($recipesStore);

  function applyUrlParams() {
    if (recipes.length === 0) {
      return;
    }
    const searchStr = getUrlParams().toString();
    const parsed = parseRecipeUrlParams(recipes, searchStr);
    if (parsed.hasValidParams) {
      if (
        Object.keys(parsed.selectedRecipeServings).length > 0 ||
        searchStr.includes('r=')
      ) {
        selectedRecipeServings = parsed.selectedRecipeServings;
      }
      if (parsed.layoutId) {
        isolatedStoreLayoutId = parsed.layoutId;
      }
      if (parsed.altSelections) {
        isolatedAltSelections = parsed.altSelections;
      }
    }
    isInitialized = true;
  }

  onMount(() => {
    if ($recipesStore.length === 0) {
      fetch('/index.json')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Recipe[]) => {
          if (data.length > 0) {
            recipesStore.set(data);
            applyUrlParams();
          }
        })
        .catch((e) => {
          console.error('Failed to fetch recipes index:', e);
        });
    } else {
      applyUrlParams();
    }

    const unsubscribeUrl = onUrlChange((params) => {
      const parsed = parseRecipeUrlParams(recipes, params.toString());
      selectedRecipeServings = parsed.selectedRecipeServings;
      if (parsed.layoutId) {
        isolatedStoreLayoutId = parsed.layoutId;
      }
      if (parsed.altSelections) {
        isolatedAltSelections = parsed.altSelections;
      }
    });

    return () => {
      unsubscribeUrl();
    };
  });

  $effect(() => {
    const servings = selectedRecipeServings;
    const layoutId = isolatedStoreLayoutId;
    const recipeList = recipes;
    const altSelections = isolatedAltSelections;

    if (isInitialized && recipeList.length > 0) {
      const { r, l, alt } = serializeRecipeUrlParams(
        servings,
        recipeList,
        layoutId,
        altSelections,
      );
      updateUrlParams({ r, l, alt }, 'replace');
    }
  });

  let filteredRecipes = $derived(
    filterRecipes(recipes, $filtersStore, $favoritesStore, searchQuery),
  );

  let selectedPermalinks = $derived(Object.keys(selectedRecipeServings));
  let selectedCount = $derived(selectedPermalinks.length);

  // Store Layout Options for StorePicker
  let storeLayoutOptions = $derived<Option[]>(
    STORE_LAYOUTS.map((layout) => ({
      id: layout.id,
      label: layout.name,
      description: layout.sections.map((s) => s.name).join(' → '),
    })),
  );

  let activeLayout = $derived(
    STORE_LAYOUTS.find((l) => l.id === isolatedStoreLayoutId) ||
      STORE_LAYOUTS[0],
  );

  // Toggle alternate selection in isolated state
  function toggleAlt(recipeShortId: string, altItemSlug: string) {
    const current = isolatedAltSelections[recipeShortId];
    const next = { ...isolatedAltSelections };
    if (current === altItemSlug) {
      delete next[recipeShortId];
    } else {
      next[recipeShortId] = altItemSlug;
    }
    isolatedAltSelections = next;
  }

  // Toggle single recipe selection
  function toggleRecipe(r: Recipe) {
    if (r.permalink in selectedRecipeServings) {
      const next = { ...selectedRecipeServings };
      delete next[r.permalink];
      selectedRecipeServings = next;
    } else {
      const baseYield = r.servings || 4;
      selectedRecipeServings = {
        ...selectedRecipeServings,
        [r.permalink]: baseYield,
      };
    }
  }

  // Servings adjustment for selected recipe
  function updateServings(permalink: string, delta: number, e: Event) {
    e.stopPropagation();
    const current = selectedRecipeServings[permalink];
    if (current === undefined) {
      return;
    }
    const nextVal = Math.max(1, current + delta);
    selectedRecipeServings = {
      ...selectedRecipeServings,
      [permalink]: nextVal,
    };
  }

  // Select all visible (filtered) recipes
  function selectAllFiltered() {
    const next = { ...selectedRecipeServings };
    filteredRecipes.forEach((r) => {
      if (!(r.permalink in next)) {
        next[r.permalink] = r.servings || 4;
      }
    });
    selectedRecipeServings = next;
  }

  // Clear all selections
  function clearAll() {
    selectedRecipeServings = {};
  }

  // Build aggregated ingredients list across selected recipes
  let aggregatedIngredients = $derived.by(() => {
    const list: IngredientInput[] = [];
    selectedPermalinks.forEach((permalink) => {
      const rec = recipes.find((r) => r.permalink === permalink);
      if (!rec) {
        return;
      }
      const servings = selectedRecipeServings[permalink] ?? rec.servings ?? 4;
      const baseYield = rec.servings || 4;
      const scale = servings / baseYield;

      rec.ingredients.forEach((ing) => {
        const parsed = scaleIngredient(
          typeof ing === 'string' ? { item: ing } : ing,
          scale,
        );
        parsed.recipe = rec.title;
        parsed.recipeShortId = rec.shortId;
        list.push(parsed);
      });
    });
    return list;
  });

  // Run pipeline matching live planner
  let processedShopping = $derived.by(() => {
    if (aggregatedIngredients.length === 0) {
      return {
        buyItems: [],
        optionalItems: [],
        stapleItems: [],
        combinedBuyItems: [],
      };
    }

    const { buyItems, optionalItems, stapleItems } = processShoppingList(
      aggregatedIngredients,
      activeLayout,
      isolatedAltSelections,
    );

    const combinedBuyItems = [...buyItems, ...stapleItems].sort((a, b) =>
      compareShoppingItems(a, b, activeLayout),
    );

    return { buyItems, optionalItems, stapleItems, combinedBuyItems };
  });

  let buyItems = $derived(processedShopping.combinedBuyItems);
  let optionalItems = $derived(processedShopping.optionalItems);

  let totalShoppingItemCount = $derived(
    buyItems.length + optionalItems.length,
  );

  const collapsedSections = new SvelteSet<string>();

  function toggleSection(sectionId: string) {
    if (collapsedSections.has(sectionId)) {
      collapsedSections.delete(sectionId);
    } else {
      collapsedSections.add(sectionId);
    }
  }

  // Group buy items by store section
  let groupedBuyItems = $derived.by(() => {
    const sections: { id: string; name: string; items: ShoppingItem[] }[] = [];
    let currentSectionId = '';
    let currentSection: (typeof sections)[0] | null = null;

    buyItems.forEach((item) => {
      const section = getSectionForCategory(item.category, activeLayout);
      if (section.id !== currentSectionId) {
        currentSectionId = section.id;
        currentSection = { id: section.id, name: section.name, items: [] };
        sections.push(currentSection);
      }
      currentSection?.items.push(item);
    });

    return sections;
  });

  let totalSectionsCount = $derived(
    groupedBuyItems.length + (optionalItems.length > 0 ? 1 : 0),
  );

  let allCollapsed = $derived(
    totalSectionsCount > 0 &&
      groupedBuyItems.every((sec) => collapsedSections.has(sec.id)) &&
      (optionalItems.length === 0 || collapsedSections.has('optional')),
  );

  function toggleAllSections() {
    if (allCollapsed) {
      collapsedSections.clear();
    } else {
      groupedBuyItems.forEach((sec) => collapsedSections.add(sec.id));
      if (optionalItems.length > 0) {
        collapsedSections.add('optional');
      }
    }
  }

  function getSectionCheckedInfo(sectionItems: ShoppingItem[]) {
    const total = sectionItems.length;
    const checked = sectionItems.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(isStaple, item.unit, item.item);
      return isItemChecked(key, isStaple, isolatedCheckedStates);
    }).length;
    return { checked, total, isComplete: total > 0 && checked === total };
  }

  // Checked state toggling
  function toggleItemChecked(key: string, isStaple: boolean) {
    const current = isItemChecked(key, isStaple, isolatedCheckedStates);
    isolatedCheckedStates = {
      ...isolatedCheckedStates,
      [key]: !current,
    };
  }

  // Mobile Tab Options
  let mobileTabOptions = $derived<Option[]>([
    { id: 'recipes', label: 'Recipes', badgeCount: selectedCount },
    {
      id: 'shopping',
      label: 'Shopping List',
      badgeCount: totalShoppingItemCount,
    },
  ]);
</script>

<div class="shopping-debug-container">
  <!-- Header Bar -->
  <div class="debug-page-header">
    <div class="debug-title-group">
      <h1>Shopping List Debugger</h1>
      <p>
        Test dynamic ingredient aggregation, unit conversions, and store aisle
        layout categorization in real-time.
      </p>
    </div>
  </div>

  <!-- Mobile View Toggle (visible on smaller screens) -->
  <div class="debug-mobile-toggle-wrapper">
    <ToggleGroup
      options={mobileTabOptions}
      selectedId={activeMobileTab}
      onChange={(id) => (activeMobileTab = id as 'recipes' | 'shopping')}
      fullWidth
    />
  </div>

  <!-- Main Split Body -->
  <div class="debug-split-layout">
    <!-- Left Column: Recipe Selection Shelf -->
    <div
      class="debug-col recipes-col"
      class:mobile-hidden={activeMobileTab !== 'recipes'}
    >
      <div class="debug-col-header">
        <div class="col-header-top">
          <h2>Recipes <span class="selected-badge">{selectedCount}</span></h2>
          <div class="action-btn-group">
            <button
              type="button"
              class="btn btn-sm btn-secondary select-all-btn"
              onclick={selectAllFiltered}
              title="Select all visible recipes"
            >
              Select All
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost clear-all-btn"
              onclick={clearAll}
              disabled={selectedCount === 0}
              title="Clear all selected recipes"
            >
              Clear All
            </button>
          </div>
        </div>

        <div class="search-filter-bar">
          <input
            type="text"
            class="debug-search-input"
            bind:value={searchQuery}
            placeholder="Search recipes by title..."
          />
          <button
            type="button"
            class="debug-fav-filter-btn {$filtersStore.favoritesOnly
              ? 'is-favorite'
              : ''}"
            onclick={() =>
              filtersStore.update((f) => ({
                ...f,
                favoritesOnly: !f.favoritesOnly,
              }))}
            aria-label="Filter favorites only"
            title={$filtersStore.favoritesOnly
              ? 'Showing favorites only'
              : 'Filter favorites only'}
          >
            <HeartIcon
              class="heart-icon {$filtersStore.favoritesOnly ? 'pop-anim' : ''}"
            />
          </button>
        </div>
      </div>

      <!-- Recipe Rows List -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="recipes-list-scroll scrollable-area"
        use:scrollable
        tabindex="0"
        role="region"
        aria-label="Available Debug Recipes"
      >
        {#if filteredRecipes.length === 0}
          <EmptyState
            title={searchQuery.trim()
              ? 'No matching recipes found'
              : 'No recipes available'}
            icon="🔍"
          />
        {:else}
          <div class="recipe-rows-grid">
            {#each filteredRecipes as r}
              {@const isSelected = r.permalink in selectedRecipeServings}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                class="debug-recipe-row {isSelected ? 'is-selected' : ''}"
                onclick={() => toggleRecipe(r)}
                role="button"
                tabindex="0"
              >
                <!-- Far Left: Featured Image or Icon -->
                <div class="row-icon-cell">
                  {#if r.image90 || r.image130 || r.image180 || r.image260}
                    <img
                      src={r.image90 || r.image130 || r.image180 || r.image260}
                      alt={r.title}
                      class="debug-recipe-thumb"
                      loading="lazy"
                    />
                  {:else}
                    <span class="recipe-emoji-icon">🍳</span>
                  {/if}
                </div>

                <!-- Middle: Title & Meta -->
                <div class="row-info-cell">
                  <span class="row-recipe-title">{r.title}</span>
                  <span class="row-recipe-meta">
                    {r.servings || 4} servings • {r.ingredients.length} ingredients
                    {#if r.recipeSource}
                      • {r.recipeSource}
                    {/if}
                  </span>
                </div>

                <!-- Far Right: Servings Stepper (when selected) -->
                {#if isSelected}
                  <div
                    class="row-servings-controls"
                    onclick={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <button
                      type="button"
                      class="debug-servings-btn stepper-minus"
                      onclick={(e) => updateServings(r.permalink, -1, e)}
                      aria-label="Decrease servings"
                    >
                      -
                    </button>
                    <span class="servings-label"
                      >{selectedRecipeServings[r.permalink]} servings</span
                    >
                    <button
                      type="button"
                      class="debug-servings-btn stepper-plus"
                      onclick={(e) => updateServings(r.permalink, 1, e)}
                      aria-label="Increase servings"
                    >
                      +
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Column: Dynamic Combined Shopping List -->
    <div
      class="debug-col shopping-col"
      class:mobile-hidden={activeMobileTab !== 'shopping'}
    >
      <div class="debug-col-header shopping-col-header">
        <div class="shopping-header-title-bar">
          <div>
            <h2>Dynamic Combined Shopping List</h2>
            <span class="shopping-count-subtitle"
              >{buyItems.length} items needed</span
            >
          </div>
          {#if totalSectionsCount > 0}
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              onclick={toggleAllSections}
            >
              {allCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          {/if}
        </div>

        <div class="store-picker-container">
          <StorePicker
            selectedId={isolatedStoreLayoutId}
            options={storeLayoutOptions}
            onChange={(id) => (isolatedStoreLayoutId = id)}
          />
        </div>
      </div>

      <!-- Shopping List Items Scrollable Area -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="shopping-list-scroll scrollable-area"
        use:scrollable
        tabindex="0"
        role="region"
        aria-label="Combined Debug Shopping List"
      >
        <div class="shopping-list-wrapper">
          <div class="shopping-section buy-section">
            <ul class="compound-list">
              {#if buyItems.length === 0}
                <li class="planner-empty-state">
                  No items needed. Select recipes on the left to generate the
                  shopping list.
                </li>
              {:else}
                {#each groupedBuyItems as section}
                  {@const info = getSectionCheckedInfo(section.items)}
                  {@const isCollapsed = collapsedSections.has(section.id)}
                  <li class="shopping-section-header compound-list-header">
                    <button
                      type="button"
                      class="section-toggle-btn"
                      aria-expanded={!isCollapsed}
                      aria-controls={`debug-section-buy-${section.id}`}
                      onclick={() => toggleSection(section.id)}
                    >
                      <span class="section-toggle-title">
                        <span
                          class="section-chevron"
                          class:collapsed={isCollapsed}
                          aria-hidden="true">▼</span
                        >
                        <span>{section.name}</span>
                      </span>
                      <span
                        class="section-count"
                        class:completed={info.isComplete}
                      >
                        {#if info.isComplete}
                          ✓ {info.total}/{info.total}
                        {:else}
                          {info.checked}/{info.total}
                        {/if}
                      </span>
                    </button>
                  </li>
                  {#if !isCollapsed}
                    {#each section.items as item}
                      {@const isStaple = item.staple === 'in-pantry'}
                      {@const key = getIngredientKey(
                        isStaple,
                        item.unit,
                        item.item,
                      )}
                      {@const isChecked = isItemChecked(
                        key,
                        isStaple,
                        isolatedCheckedStates,
                      )}
                      <ShoppingListItemRow
                        {item}
                        {isChecked}
                        onToggleChecked={() => toggleItemChecked(key, isStaple)}
                        onToggleAlt={toggleAlt}
                      />
                    {/each}
                  {/if}
                {/each}
              {/if}
            </ul>
          </div>

          {#if optionalItems.length > 0}
            {@const info = getSectionCheckedInfo(optionalItems)}
            {@const isCollapsed = collapsedSections.has('optional')}
            <div class="shopping-section optional-section">
              <ul class="compound-list">
                <li class="shopping-section-header compound-list-header">
                  <button
                    type="button"
                    class="section-toggle-btn"
                    aria-expanded={!isCollapsed}
                    aria-controls="debug-optional-items"
                    onclick={() => toggleSection('optional')}
                  >
                    <span class="section-toggle-title">
                      <span
                        class="section-chevron"
                        class:collapsed={isCollapsed}
                        aria-hidden="true">▼</span
                      >
                      <span>Optional</span>
                    </span>
                    <span
                      class="section-count"
                      class:completed={info.isComplete}
                    >
                      {#if info.isComplete}
                        ✓ {info.total}/{info.total}
                      {:else}
                        {info.checked}/{info.total}
                      {/if}
                    </span>
                  </button>
                </li>
                {#if !isCollapsed}
                  {#each optionalItems as item}
                    {@const key = getIngredientKey(false, item.unit, item.item)}
                    {@const isChecked = isItemChecked(
                      key,
                      false,
                      isolatedCheckedStates,
                    )}
                    <ShoppingListItemRow
                      {item}
                      {isChecked}
                      onToggleChecked={() => toggleItemChecked(key, false)}
                      onToggleAlt={toggleAlt}
                    />
                  {/each}
                {/if}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .shopping-debug-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    box-sizing: border-box;
    gap: 1.25rem;
    color: var(--text-color);
  }

  .debug-page-header {
    text-align: center;
  }

  .debug-page-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 0.25rem;
    background: linear-gradient(
      135deg,
      var(--noonblue, #0080d8),
      var(--noonblue-light, #3fb0ff)
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .debug-page-header p {
    color: var(--text-muted);
    font-size: 1rem;
    margin: 0;
  }

  .debug-mobile-toggle-wrapper {
    display: none;
  }

  .debug-split-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
  }

  .debug-col {
    display: flex;
    flex-direction: column;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 12px;
    overflow: hidden;
    min-height: 0;
  }

  .debug-col-header {
    padding: 1rem 1.25rem;
    background: var(--recipe-title-bg, #f8fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .col-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-header-top h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-title, var(--text-color));
  }

  .selected-badge {
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--noonblue, #0080d8);
    color: #ffffff;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
  }

  .action-btn-group {
    display: flex;
    gap: 0.5rem;
  }

  .search-filter-bar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .debug-search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--bg-color, #ffffff);
    color: var(--text-color, #0f172a);
  }

  .debug-search-input:focus {
    outline: none;
    border-color: var(--noonblue, #0080d8);
  }

  .debug-fav-filter-btn {
    background: var(--btn-bg, #ffffff);
    border: 1px solid var(--btn-border, #cbd5e1);
    color: var(--font-btn-text, #373737);
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .debug-fav-filter-btn.is-favorite {
    background: var(--heart-bg-hover, rgba(225, 29, 72, 0.1));
    border-color: var(--heart-color, #e11d48);
    color: var(--heart-color, #e11d48);
  }

  .recipes-list-scroll,
  .shopping-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .recipe-rows-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .debug-recipe-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--card-bg, #ffffff);
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .debug-recipe-row:hover {
    border-color: var(--noonblue-light, #3fb0ff);
  }

  .debug-recipe-row.is-selected {
    border-color: var(--noonblue, #0080d8);
    background: var(--noonblue-bg-light, rgba(0, 128, 216, 0.06));
    box-shadow: 0 0 0 1px var(--noonblue, #0080d8);
  }

  .row-icon-cell {
    font-size: 1.5rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
  }

  .debug-recipe-thumb {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
    background: var(--image-bg, #f8f9fa);
  }

  .row-info-cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .row-recipe-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-color, #0f172a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-recipe-meta {
    font-size: 0.78rem;
    color: var(--text-muted, #64748b);
  }

  .row-servings-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--font-controls-bg, #f1f5f9);
    border-radius: 6px;
    padding: 0.2rem 0.4rem;
  }

  .debug-servings-btn {
    border: 1px solid var(--btn-border, transparent);
    background: var(--btn-bg, #ffffff);
    color: var(--font-btn-text, #0f172a);
    width: 24px;
    height: 24px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .debug-servings-btn:hover {
    background: var(--noonblue, #0080d8);
    color: #ffffff;
  }

  .servings-label {
    font-size: 0.8rem;
    font-weight: 600;
    min-width: 70px;
    text-align: center;
    color: var(--text-color);
  }

  .shopping-col-header {
    gap: 0.5rem;
  }

  .shopping-header-title-bar h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-title, var(--text-color));
  }

  .shopping-count-subtitle {
    font-size: 0.82rem;
    color: var(--text-muted, #64748b);
  }

  .store-picker-container {
    margin-top: 0.25rem;
  }

  @media (max-width: 767px) {
    .debug-mobile-toggle-wrapper {
      display: block;
    }

    .debug-split-layout {
      grid-template-columns: 1fr;
    }

    .mobile-hidden {
      display: none !important;
    }
  }
</style>

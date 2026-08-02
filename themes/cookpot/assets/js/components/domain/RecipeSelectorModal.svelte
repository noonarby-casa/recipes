<script lang="ts">
  import { recipesStore } from '../../stores/recipes';
  import { filtersStore, filterRecipes } from '../../stores/filters';
  import { favoritesStore } from '../../stores/favorites';
  import { plannerStore } from '../../stores/planner';
  import { scrollable } from '../../actions/scrollable';
  import type { IngredientInput } from '../../types';
  import RecipeCard from './RecipeCard.svelte';
  import Modal from '../primitives/Modal.svelte';
  import ToggleGroup, { type Option } from '../primitives/ToggleGroup.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import HeartIcon from '../primitives/icons/HeartIcon.svelte';
  import ServingsPicker from './ServingsPicker.svelte';
  import IconPicker from './IconPicker.svelte';
  import IngredientsEditor from './IngredientsEditor.svelte';

  interface Props {
    /** Whether the recipe selector modal dialog is open and visible. */
    isOpen: boolean;
    /** The abbreviation of the target day of the week (e.g. 'mon', 'tue', or 'supplemental') where the recipe will be added. */
    day: string;
    /** Callback function to close the recipe selector modal dialog. */
    onClose: () => void;
    /** Callback function triggered when a recipe is selected (receives the recipe's permalink). */
    onSelect: (permalink: string) => void;
  }

  let { isOpen, day, onClose, onSelect }: Props = $props();

  let searchQuery = $state('');
  let keyboardFocusedIndex = $state(-1);
  let shelfElement = $state<HTMLElement | null>(null);
  let activeMobileTab = $state<'browse' | 'custom'>('browse');

  // Custom Dish Form State
  let customTitle = $state('');
  let customIcon = $state('utensils');
  let customServings = $state(4);
  let customIngredients = $state<IngredientInput[]>([]);

  let recipes = $derived($recipesStore);

  let filteredRecipes = $derived(
    filterRecipes(recipes, $filtersStore, $favoritesStore, searchQuery)
  );

  const mobileTabOptions: Option[] = [
    { id: 'browse', label: 'Browse Catalog' },
    { id: 'custom', label: 'Custom Entry' },
  ];

  let filtersNotice = $derived.by(() => {
    const activeFilters: string[] = [];
    if ($filtersStore.favoritesOnly) {
      activeFilters.push('Favorites only');
    }
    for (const tag of $filtersStore.includedTags) {
      activeFilters.push(`+${tag}`);
    }
    for (const tag of $filtersStore.excludedTags) {
      activeFilters.push(`-${tag}`);
    }
    for (const src of $filtersStore.includedSources) {
      activeFilters.push(`+${src}`);
    }
    for (const src of $filtersStore.excludedSources) {
      activeFilters.push(`-${src}`);
    }
    return activeFilters.length > 0 ? `Applying active filters: ${activeFilters.join(', ')}` : '';
  });

  $effect(() => {
    if (isOpen) {
      searchQuery = '';
      keyboardFocusedIndex = -1;
      activeMobileTab = 'browse';
      customTitle = '';
      customIcon = 'utensils';
      customServings = 4;
      customIngredients = [];
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (activeMobileTab !== 'browse' || filteredRecipes.length === 0) {return;}

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      keyboardFocusedIndex = (keyboardFocusedIndex + 1) % filteredRecipes.length;
      scrollFocusedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      keyboardFocusedIndex = (keyboardFocusedIndex - 1 + filteredRecipes.length) % filteredRecipes.length;
      scrollFocusedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = keyboardFocusedIndex >= 0 && keyboardFocusedIndex < filteredRecipes.length ? keyboardFocusedIndex : 0;
      onSelect(filteredRecipes[idx].permalink);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  function scrollFocusedIntoView() {
    setTimeout(() => {
      const focusedCard = shelfElement?.querySelector('.browse-card.keyboard-focused');
      if (focusedCard) {
        focusedCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  function handleAddCustomDish() {
    const trimmed = customTitle.trim();
    if (!trimmed) {
      return;
    }

    const instanceId = plannerStore.addCustomItem(day, trimmed);
    if (customIcon && customIcon !== 'utensils') {
      plannerStore.updateIcon(instanceId, customIcon);
    }
    if (customServings !== 4) {
      plannerStore.updateScale(instanceId, customServings / 4);
    }
    if (customIngredients.length > 0) {
      plannerStore.updateExtraIngredients(instanceId, customIngredients);
    }

    onClose();
  }

  const DAY_NAMES: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
  };

  let titleDay = $derived(
    day === 'supplemental'
      ? 'Add Supplemental Recipe'
      : `Add Recipe to ${DAY_NAMES[day] || 'Day'}`
  );

  let plannedPermalinks = $derived(new Set($plannerStore.plan.map((p) => p.permalink)));
</script>

<Modal
  {isOpen}
  {onClose}
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content selector-modal-content"
>
  {#snippet header()}
    <div class="planner-modal-header selector-modal-header">
      <div class="header-main-row">
        <h3>{titleDay}</h3>
        <button
          type="button"
          class="modal-close-btn"
          aria-label="Close modal"
          onclick={onClose}
        >
          ✕
        </button>
      </div>
      <span class="header-sub">
        Choose a recipe from the catalog or create a custom dish.
      </span>
    </div>
  {/snippet}

  <div class="selector-modal-wrapper">
    <!-- Mobile Segmented Tab Switcher -->
    <div class="selector-mobile-tabs">
      <ToggleGroup
        options={mobileTabOptions}
        selectedId={activeMobileTab}
        onChange={(id) => (activeMobileTab = id as 'browse' | 'custom')}
        fullWidth={true}
      />
    </div>

    <div class="selector-modal-body">
      <!-- Left Column: Browse Recipes -->
      <div class="selector-browse-col" class:mobile-hidden={activeMobileTab !== 'browse'}>
        {#if filtersNotice}
          <div class="modal-tags-notice">
            {filtersNotice}
          </div>
        {/if}

        <div class="modal-search-wrapper">
          <input
            type="text"
            bind:value={searchQuery}
            onkeydown={handleKeydown}
            placeholder="Search available recipes by title..."
            autocomplete="off"
          />
          <button
            type="button"
            class="recipe-favorite-filter-btn {$filtersStore.favoritesOnly ? 'is-favorite' : ''}"
            onclick={() => filtersStore.update((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
            aria-label="Filter favorites only"
            aria-pressed={$filtersStore.favoritesOnly}
            title={$filtersStore.favoritesOnly ? 'Showing favorites only' : 'Filter favorites only'}
          >
            <HeartIcon class="heart-icon {$filtersStore.favoritesOnly ? 'pop-anim' : ''}" />
          </button>
        </div>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          bind:this={shelfElement}
          class="planner-browse-shelf scrollable-area"
          use:scrollable
          tabindex="0"
          role="region"
          aria-label="Available Recipes Shelf"
        >
          {#if filteredRecipes.length === 0}
            {#if $filtersStore.favoritesOnly}
              <div class="selector-empty-fav-wrapper">
                <EmptyState
                  title={searchQuery.trim() ? 'No favorite recipes match your search' : 'No favorite recipes found'}
                  icon="❤️"
                  class="planner-empty-state-component"
                />
                <button
                  type="button"
                  class="btn btn-secondary clear-fav-filter-btn"
                  onclick={() => filtersStore.update((f) => ({ ...f, favoritesOnly: false }))}
                >
                  Show All Recipes
                </button>
              </div>
            {:else}
              <EmptyState
                title={searchQuery.trim() ? 'No matching recipes found' : 'No recipes found'}
                icon="🔍"
                class="planner-empty-state-component"
              />
            {/if}
          {:else}
            {#each filteredRecipes as r, idx}
              {@const isPlanned = plannedPermalinks.has(r.permalink)}
              <div class="card-wrapper {idx === keyboardFocusedIndex ? 'keyboard-focused' : ''}">
                <RecipeCard
                  recipe={r}
                  variant="compact"
                  {isPlanned}
                  onClick={() => onSelect(r.permalink)}
                />
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Right Column: Create Custom Dish -->
      <div class="selector-custom-col" class:mobile-hidden={activeMobileTab !== 'custom'}>
        <h4 class="custom-section-title">Create Custom Dish</h4>

        <div class="custom-form-group">
          <label for="custom-dish-title" class="custom-form-label">Dish Title</label>
          <input
            id="custom-dish-title"
            type="text"
            bind:value={customTitle}
            placeholder="e.g. Friday Night Tacos"
            class="custom-title-input"
          />
        </div>

        <div class="custom-form-row">
          <div class="custom-form-group icon-group">
            <span class="custom-form-label">Icon</span>
            <IconPicker
              selectedIcon={customIcon}
              onChange={(nextIcon) => (customIcon = nextIcon)}
            />
          </div>

          <div class="custom-form-group servings-group">
            <span class="custom-form-label">Base Servings</span>
            <ServingsPicker
              value={customServings}
              onChange={(nextVal) => (customServings = nextVal)}
              min={1}
              max={20}
            />
          </div>
        </div>

        <IngredientsEditor
          ingredients={customIngredients}
          onChange={(nextIngs) => (customIngredients = nextIngs)}
          title="Ingredients & Sides"
          emptyLabel="Optional: Add ingredients or sides to include in shopping list."
        />

        <div class="custom-action-row">
          <button
            type="button"
            class="btn btn-brand add-custom-btn"
            disabled={!customTitle.trim()}
            onclick={handleAddCustomDish}
          >
            Add Custom Dish to Plan
          </button>
        </div>
      </div>
    </div>
  </div>
</Modal>

<style>
  :global(.selector-modal-content) {
    max-width: 900px;
    width: 90vw;
  }

  .selector-modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .header-main-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  h3 {
    margin: 0;
  }
  .header-sub {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .selector-modal-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1rem;
  }

  .selector-mobile-tabs {
    display: none;
    padding: 0.75rem 1rem 0 1rem;
  }

  .selector-modal-body {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1.5rem;
    min-height: 440px;
  }

  .selector-browse-col {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .selector-custom-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.5rem 1rem 0;
    border-left: 1px solid var(--border-subtle);
    padding-left: 1.5rem;
  }

  .custom-section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-color);
  }

  .custom-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .custom-form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .custom-title-input {
    width: 100%;
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    background-color: var(--card-bg);
    color: var(--text-body);
    font-size: 0.85rem;
  }

  .custom-form-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .custom-action-row {
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .add-custom-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
  }

  .add-custom-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-tags-notice {
    display: block;
    padding: 0.75rem 1.5rem 0 1.5rem;
    font-size: 0.85rem;
    color: var(--noonblue);
  }

  .modal-search-wrapper {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem 0.5rem 1.5rem;
  }
  .modal-search-wrapper input {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-body);
    flex: 1;
    font-size: 0.85rem;
    min-width: 0;
    padding: 0.55rem 0.85rem;
  }
  .recipe-favorite-filter-btn {
    align-items: center;
    background: transparent;
    border: 1px solid var(--btn-border);
    border-radius: 50%;
    box-shadow: var(--btn-shadow);
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 36px;
    justify-content: center;
    padding: 0;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    width: 36px;
  }
  .recipe-favorite-filter-btn:hover {
    background-color: var(--heart-bg-hover);
    border-color: var(--heart-border-hover);
    color: var(--heart-color);
    transform: scale(1.05);
  }
  .recipe-favorite-filter-btn:active {
    transform: scale(0.95);
  }
  :global(.recipe-favorite-filter-btn .heart-icon) {
    fill: none;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2.5;
    transition: fill 0.25s ease, stroke 0.25s ease;
    width: 18px;
  }
  .recipe-favorite-filter-btn.is-favorite {
    background-color: var(--heart-bg-hover);
    border-color: var(--heart-color);
    color: var(--heart-color);
  }
  :global(.recipe-favorite-filter-btn.is-favorite .heart-icon) {
    fill: var(--heart-color);
    stroke: var(--heart-color);
  }
  .selector-empty-fav-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    grid-column: 1 / -1;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
  }
  .clear-fav-filter-btn {
    font-size: 0.85rem;
    padding: 0.4rem 0.85rem;
  }
  :global(.planner-empty-state-component) {
    margin-top: 1rem;
  }
  .card-wrapper {
    display: contents;
  }
  .planner-browse-shelf {
    align-content: start;
    display: grid;
    flex-grow: 1;
    gap: 0.65rem;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    max-height: 480px;
    min-height: 0;
    padding: 0.5rem 1.5rem 1.5rem 1.5rem;
  }

  @media (max-width: 767px) {
    :global(.selector-modal-content) {
      width: 95vw;
    }

    .selector-mobile-tabs {
      display: block;
    }

    .selector-modal-body {
      grid-template-columns: 1fr;
      min-height: 320px;
    }

    .selector-custom-col {
      border-left: none;
      padding: 0.5rem 1rem 1rem 1rem;
    }

    .planner-browse-shelf {
      grid-template-columns: 1fr;
      padding: 0.5rem 1rem 1rem 1rem;
      max-height: 380px;
    }

    .mobile-hidden {
      display: none !important;
    }
  }
</style>

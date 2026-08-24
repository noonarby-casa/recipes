<script lang="ts">
  import { recipesStore } from '../../stores/recipes';
  import { filtersStore, filterRecipes } from '../../stores/filters';
  import { favoritesStore } from '../../stores/favorites';
  import { plannerStore, getRecentCustomDishes, type RecentCustomDish } from '../../stores/planner';
  import { scrollable } from '../../actions/scrollable';
  import type { IngredientInput } from '../../types';
  import RecipeCard from './RecipeCard.svelte';
  import Modal from '../primitives/Modal.svelte';
  import ToggleGroup, { type Option } from '../primitives/ToggleGroup.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import Icon from '../primitives/Icon.svelte';
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
  let searchInputRef = $state<HTMLInputElement | null>(null);
  let activeMobileTab = $state<'browse' | 'custom'>('browse');

  // Custom Dish Form State
  let customTitle = $state('');
  let customIcon = $state('utensils');
  let customServings = $state(4);
  let customIngredients = $state<IngredientInput[]>([]);
  let isTitleFocused = $state(false);
  let showTitleError = $state(false);
  let activeSuggestionIndex = $state(-1);
  let titleInputRef = $state<HTMLInputElement | null>(null);

  let recipes = $derived($recipesStore);

  let filteredRecipes = $derived(
    filterRecipes(recipes, $filtersStore, $favoritesStore, searchQuery)
  );

  let recentDishes = $derived<RecentCustomDish[]>(
    isOpen ? getRecentCustomDishes(8) : []
  );

  let matchingSuggestions = $derived.by(() => {
    if (!recentDishes || recentDishes.length === 0) {return [];}
    const q = customTitle.trim().toLowerCase();
    if (!q) {return recentDishes.slice(0, 5);}
    return recentDishes.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 5);
  });

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
      isTitleFocused = false;
      showTitleError = false;
      activeSuggestionIndex = -1;

      if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
        setTimeout(() => {
          searchInputRef?.focus();
        }, 50);
      }
    }
  });

  function handleSearchInput() {
    keyboardFocusedIndex = -1;
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (activeMobileTab !== 'browse') {return;}

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredRecipes.length > 0) {
        if (keyboardFocusedIndex === -1) {
          keyboardFocusedIndex = 0;
        } else if (keyboardFocusedIndex < filteredRecipes.length - 1) {
          keyboardFocusedIndex++;
        }
        scrollFocusedIntoView();
      } else {
        const emptyBtn = shelfElement?.querySelector<HTMLButtonElement>(
          '.create-custom-bridge-btn, .clear-fav-filter-btn'
        );
        emptyBtn?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredRecipes.length > 0) {
        if (keyboardFocusedIndex > 0) {
          keyboardFocusedIndex--;
          scrollFocusedIntoView();
        } else if (keyboardFocusedIndex === 0) {
          keyboardFocusedIndex = -1;
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (keyboardFocusedIndex >= 0 && keyboardFocusedIndex < filteredRecipes.length) {
        onSelect(filteredRecipes[keyboardFocusedIndex].permalink);
      } else {
        searchInputRef?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (searchQuery.length > 0 || keyboardFocusedIndex >= 0) {
        searchQuery = '';
        keyboardFocusedIndex = -1;
      } else {
        onClose();
      }
    }
  }

  function handleCreateCustomBridge() {
    customTitle = searchQuery.trim();
    activeMobileTab = 'custom';
    searchQuery = '';
    keyboardFocusedIndex = -1;
    setTimeout(() => {
      titleInputRef?.focus();
    }, 50);
  }

  function handleCustomKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomDish();
    }
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomDish();
      return;
    }

    if (isTitleFocused && matchingSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % matchingSuggestions.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + matchingSuggestions.length) % matchingSuggestions.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          selectSuggestion(matchingSuggestions[activeSuggestionIndex]);
        } else {
          handleAddCustomDish();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        isTitleFocused = false;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomDish();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (customTitle.length > 0) {
        customTitle = '';
      } else {
        onClose();
      }
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

  function selectSuggestion(dish: RecentCustomDish) {
    customTitle = dish.title;
    customIcon = dish.icon;
    customServings = dish.baseServings;
    customIngredients = [...dish.ingredients];
    isTitleFocused = false;
    activeSuggestionIndex = -1;
    showTitleError = false;
  }

  function handleAddCustomDish() {
    const trimmed = customTitle.trim();
    if (!trimmed) {
      showTitleError = true;
      titleInputRef?.focus();
      setTimeout(() => {
        showTitleError = false;
      }, 1500);
      return;
    }

    plannerStore.addCustomItem(
      day,
      trimmed,
      customServings,
      customIcon,
      customIngredients
    );

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
            bind:this={searchInputRef}
            type="text"
            bind:value={searchQuery}
            oninput={handleSearchInput}
            onkeydown={handleSearchKeydown}
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
            <Icon name="heart" class="heart-icon {$filtersStore.favoritesOnly ? 'pop-anim' : ''}" />
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
              <div class="selector-empty-search-wrapper">
                <EmptyState
                  title={searchQuery.trim() ? `No catalog recipes match "${searchQuery.trim()}"` : 'No recipes found'}
                  icon="🔍"
                  class="planner-empty-state-component"
                />
                {#if searchQuery.trim()}
                  <button
                    type="button"
                    class="btn btn-brand create-custom-bridge-btn"
                    onclick={handleCreateCustomBridge}
                  >
                    + Create Custom Dish "{searchQuery.trim()}"
                  </button>
                {/if}
              </div>
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
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="selector-custom-col scrollable-area"
        use:scrollable
        class:mobile-hidden={activeMobileTab !== 'custom'}
        onkeydown={handleCustomKeydown}
      >
        <h4 class="custom-section-title">Create Custom Dish</h4>

        <div class="custom-form-group title-form-group">
          <label for="custom-dish-title" class="custom-form-label">Dish Title</label>
          <div class="title-input-container">
            <input
              id="custom-dish-title"
              bind:this={titleInputRef}
              type="text"
              bind:value={customTitle}
              placeholder="e.g. Friday Night Tacos"
              class="custom-title-input {showTitleError ? 'title-input-error shake-anim' : ''}"
              autocomplete="off"
              onfocus={() => (isTitleFocused = true)}
              onblur={() => setTimeout(() => (isTitleFocused = false), 200)}
              oninput={() => {
                showTitleError = false;
                activeSuggestionIndex = -1;
              }}
              onkeydown={handleTitleKeydown}
            />

            {#if isTitleFocused && matchingSuggestions.length > 0}
              <div class="recent-suggestions-dropdown" role="listbox">
                <div class="suggestions-header">Recent Custom Dishes</div>
                {#each matchingSuggestions as sug, sIdx}
                  <button
                    type="button"
                    class="suggestion-item {sIdx === activeSuggestionIndex ? 'active' : ''}"
                    onmousedown={() => selectSuggestion(sug)}
                  >
                    <img
                      src="/icons/custom-{sug.icon}.webp"
                      alt=""
                      class="suggestion-icon"
                      onerror={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icons/custom-utensils.webp';
                      }}
                    />
                    <span class="suggestion-title">{sug.title}</span>
                    <span class="suggestion-meta">{sug.baseServings} serv{#if sug.ingredients.length > 0} • {sug.ingredients.length} ing{/if}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
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
    padding-bottom: 0;
  }

  .selector-mobile-tabs {
    display: none;
    padding: 0.75rem 1rem 0 1rem;
  }

  .selector-modal-body {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1.5rem;
    min-height: 460px;
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
    max-height: 520px;
    overflow-y: auto;
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

  .title-form-group {
    position: relative;
  }

  .title-input-container {
    position: relative;
    width: 100%;
  }

  .recent-suggestions-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    max-height: 220px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .suggestions-header {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    padding: 0.5rem 0.75rem 0.25rem 0.75rem;
    border-bottom: 1px solid var(--border-ultra-subtle);
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-ultra-subtle);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
    width: 100%;
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .suggestion-item:hover,
  .suggestion-item.active {
    background-color: var(--noonblue-bg-light);
  }

  .suggestion-icon {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .suggestion-title {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-title);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suggestion-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    flex-shrink: 0;
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
    transition: border-color 0.2s ease;
  }

  .title-input-error {
    border-color: #ef4444 !important;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }

  .shake-anim {
    animation: shake 0.3s ease;
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
    padding-top: 0.75rem;
    position: sticky;
    bottom: 0;
    background: var(--card-bg);
    border-top: 1px solid var(--border-ultra-subtle);
    z-index: 10;
  }

  .add-custom-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
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
  .selector-empty-fav-wrapper,
  .selector-empty-search-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    grid-column: 1 / -1;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
  }
  .clear-fav-filter-btn,
  .create-custom-bridge-btn {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
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
      max-height: 440px;
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

<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { filtersStore, filterRecipes } from '../stores/filters';
  import { favoritesStore } from '../stores/favorites';
  import { plannerStore } from '../stores/planner';
  import { scrollable } from '../actions/scrollable';
  import RecipeCard from './RecipeCard.svelte';
  import Modal from './Modal.svelte';


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
  let searchInput = $state<HTMLInputElement | null>(null);
  let shelfElement = $state<HTMLElement | null>(null);

  let recipes = $derived($recipesStore);

  let filteredRecipes = $derived(
    filterRecipes(recipes, $filtersStore, $favoritesStore, searchQuery)
  );

  let filtersNotice = $derived.by(() => {
    const activeFilters: string[] = [];
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
      setTimeout(() => {
        searchInput?.focus();
      }, 50);
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (filteredRecipes.length === 0) {return;}

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
  contentClass="planner-modal-content"
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
        Click on a recipe to add it to the plan.
      </span>
    </div>
  {/snippet}

  {#if filtersNotice}
      <div class="modal-tags-notice">
        {filtersNotice}
      </div>
    {/if}

    <div class="modal-search-wrapper">
      <input
        type="text"
        bind:this={searchInput}
        bind:value={searchQuery}
        onkeydown={handleKeydown}
        placeholder="Search available recipes by title..."
        autocomplete="off"
      />
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
        <div class="planner-empty-state">
          {searchQuery.trim() ? 'No matching recipes found' : 'No recipes found'}
        </div>
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
</Modal>

<style>
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
  .modal-tags-notice {
    display: block;
    padding: 0.75rem 1.5rem 0 1.5rem;
    font-size: 0.85rem;
    color: var(--noonblue);
  }
  .modal-search-wrapper {
    padding: 1rem 1.5rem 0.5rem 1.5rem;
  }
  .modal-search-wrapper input {
    width: 100%;
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text-body);
    font-size: 0.85rem;
  }
  .planner-empty-state {
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
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    height: auto;
    min-height: 0;
    padding: 0.5rem 1.5rem 1.5rem 1.5rem;
  }

  @media (max-width: 767px) {
    .planner-browse-shelf {
      grid-template-columns: 1fr;
      padding: 0.5rem 1rem 1rem 1rem;
    }
  }
</style>



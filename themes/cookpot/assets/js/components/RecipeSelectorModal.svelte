<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { filtersStore } from '../stores/filters';
  import { favoritesStore } from '../stores/favorites';
  import { plannerStore } from '../stores/planner';
  import { scrollable } from '../actions/scrollable';
  import BrowseCard from './BrowseCard.svelte';
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





  let filteredRecipes = $derived.by(() => {
    let pool = recipes;

    if ($filtersStore.favoritesOnly) {
      pool = pool.filter((r) => r.shortId && $favoritesStore.includes(r.shortId));
    }
    if ($filtersStore.includedTags.length > 0) {
      pool = pool.filter((r) => r.tags && $filtersStore.includedTags.every(t => r.tags?.includes(t)));
    }
    if ($filtersStore.excludedTags.length > 0) {
      pool = pool.filter((r) => !r.tags || !$filtersStore.excludedTags.some(t => r.tags?.includes(t)));
    }
    if ($filtersStore.includedSources.length > 0) {
      pool = pool.filter((r) => r.recipeSource && $filtersStore.includedSources.includes(r.recipeSource));
    }
    if ($filtersStore.excludedSources.length > 0) {
      pool = pool.filter((r) => !r.recipeSource || !$filtersStore.excludedSources.includes(r.recipeSource));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return pool;
  });

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
    <div
      class="planner-modal-header"
      style="flex-direction: column; align-items: flex-start; gap: 0.25rem;"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <h3 style="margin: 0;">{titleDay}</h3>
        <button
          type="button"
          class="modal-close-btn"
          aria-label="Close modal"
          style="margin: 0;"
          onclick={onClose}
        >
          ✕
        </button>
      </div>
      <span style="font-size: 0.85rem; color: var(--text-muted);">
        Click on a recipe to add it to the plan.
      </span>
    </div>
  {/snippet}

  {#if filtersNotice}
      <div class="modal-tags-notice" style="display: block;">
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

    <div
      bind:this={shelfElement}
      class="planner-browse-shelf scrollable-area"
      use:scrollable
      tabindex="0"
      role="region"
      aria-label="Available Recipes Shelf"
    >
      {#if filteredRecipes.length === 0}
        <div class="planner-empty-state" style="margin-top: 1rem;">
          {searchQuery.trim() ? 'No matching recipes found' : 'No recipes found'}
        </div>
      {:else}
        {#each filteredRecipes as r, idx}
          {@const isPlanned = plannedPermalinks.has(r.permalink)}
          <div class={idx === keyboardFocusedIndex ? 'keyboard-focused' : ''} style="display: contents;">
            <BrowseCard
              recipe={r}
              isPlanned={isPlanned}
              onAdd={() => onSelect(r.permalink)}
            />
          </div>
        {/each}
      {/if}
    </div>
</Modal>

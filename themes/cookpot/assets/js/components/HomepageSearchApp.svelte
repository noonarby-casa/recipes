<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { recipesStore } from '../stores/recipes';
  import { favoritesStore } from '../stores/favorites';
  import { filtersStore, filterRecipes } from '../stores/filters';
  import { plannerStore } from '../stores/planner';
  import { ls } from '../utils/storage';
  import RecipeCard from './RecipeCard.svelte';
  import FiltersModal from './FiltersModal.svelte';
  import { PRIMARY_TAGS } from '../constants';
  import SearchIcon from './icons/SearchIcon.svelte';
  import XIcon from './icons/XIcon.svelte';
  import HeartIcon from './icons/HeartIcon.svelte';
  import FilterIcon from './icons/FilterIcon.svelte';

  let hasHydrated = $state(false);
  let isFiltersOpen = $state(false);
  let displayCount = $state(24);
  let bannerDismissed = $state(ls.getString('noonarby-planner-banner-dismissed') === 'true');
  let showPlannerBanner = $derived(!bannerDismissed && $plannerStore.plan.length === 0);

  function dismissPlannerBanner() {
    bannerDismissed = true;
    ls.setString('noonarby-planner-banner-dismissed', 'true');
  }

  let searchResults = $derived(
    filterRecipes($recipesStore, $filtersStore, $favoritesStore)
  );

  let paginatedResults = $derived(searchResults.slice(0, displayCount));



  async function hydrate() {
    if (hasHydrated) {return;}
    hasHydrated = true;

    try {
      const res = await fetch('/index.json');
      if (!res.ok) {throw new Error('Failed to fetch recipes');}
      const data = await res.json();
      recipesStore.set(data);

      const staticList = document.getElementById('recipe-list-default');
      if (staticList) {staticList.style.display = 'none';}

      const staticSearch = document.getElementById('recipe-search-static');
      if (staticSearch) {staticSearch.style.display = 'none';}
      
      const staticResults = document.getElementById('search-results');
      if (staticResults) {staticResults.style.display = 'none';}
    } catch (e) {
      console.error('Error hydrating search:', e);
    }
  }

  function handleScroll() {
    if (!hasHydrated) {
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.offsetHeight - 400;
      if (scrollPos >= threshold) {
        hydrate();
      }
      return;
    }

    const scrollPos = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.offsetHeight - 400;
    if (scrollPos >= threshold && displayCount < searchResults.length) {
      displayCount += 24;
    }
  }

  onMount(() => {
    window.addEventListener('scroll', handleScroll);

    const staticInput = document.getElementById('recipe-search-input') as HTMLInputElement | null;
    if (staticInput) {
      staticInput.addEventListener('focus', hydrate);
      staticInput.addEventListener('mouseenter', hydrate);
      staticInput.addEventListener('input', () => {
        filtersStore.update(f => ({ ...f, searchQuery: staticInput.value }));
        hydrate();
      });
    }

    const favChip = document.getElementById('favorites-only-chip');
    if (favChip) {
      favChip.addEventListener('click', () => {
        filtersStore.update(f => ({ ...f, favoritesOnly: !f.favoritesOnly }));
        hydrate();
      });
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hasFilterParams =
        params.has('tag') ||
        params.has('tags') ||
        params.has('q') ||
        params.has('query') ||
        params.has('search') ||
        params.has('source') ||
        params.has('sources') ||
        params.has('favorites') ||
        params.has('favorite');

      if (hasFilterParams) {
        hydrate().then(async () => {
          if (params.get('search') === 'focus') {
            await tick();
            const hydratedInput = document.getElementById('recipe-search-input-hydrated') as HTMLInputElement | null;
            if (hydratedInput) {
              hydratedInput.focus();
            }
          }
        });
      }
    }

    // Automatic background hydration during browser idle time
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        hydrate();
      }, { timeout: 1500 });
    } else {
      timerId = setTimeout(() => {
        hydrate();
      }, 500);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  });

  function clearAllFilters() {
    filtersStore.set({
      searchQuery: '',
      favoritesOnly: false,
      includedTags: [],
      excludedTags: [],
      includedSources: [],
      excludedSources: []
    });
  }

  function togglePrimaryTag(tag: string) {
    hydrate();
    filtersStore.update((state) => {
      let included = [...state.includedTags];
      let excluded = [...state.excludedTags];

      if (included.includes(tag)) {
        // Toggle from included to excluded
        included = included.filter(t => t !== tag);
        excluded.push(tag);
      } else if (excluded.includes(tag)) {
        // Toggle from excluded to none
        excluded = excluded.filter(t => t !== tag);
      } else {
        // Toggle from none to included
        included.push(tag);
      }

      return {
        ...state,
        includedTags: included,
        excludedTags: excluded
      };
    });
  }
</script>

{#if hasHydrated}
  {#if showPlannerBanner}
    <div class="planner-callout-banner">
      <div class="planner-callout-content">
        <span class="planner-callout-icon">🗓️</span>
        <div class="planner-callout-text">
          <strong>Plan your weekly meals:</strong> Schedule recipes for the week and generate an automatic shopping list.
        </div>
      </div>
      <div class="planner-callout-actions">
        <a href="/plan/" class="planner-callout-btn">Open Meal Planner →</a>
        <button
          type="button"
          class="planner-callout-close"
          onclick={dismissPlannerBanner}
          aria-label="Dismiss meal planner announcement"
        >
          <XIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  {/if}

  <div class="recipe-search-container">
    <div class="recipe-search-box">
      <SearchIcon size={18} strokeWidth={2.5} class="search-icon" />
      <input
        type="search"
        id="recipe-search-input-hydrated"
        class="recipe-search-input"
        value={$filtersStore.searchQuery}
        oninput={(e) => filtersStore.update(f => ({ ...f, searchQuery: e.currentTarget.value }))}
        placeholder="Search recipes by title, ingredients, source, or tags..."
        autocomplete="off"
        aria-label="Search recipes"
      />
      {#if $filtersStore.searchQuery}
        <button
          type="button"
          class="search-clear-btn"
          aria-label="Clear search"
          onclick={() => filtersStore.update(f => ({ ...f, searchQuery: '' }))}
        >
          <XIcon size={16} strokeWidth={2.5} />
        </button>
      {/if}
    </div>
    <div class="homepage-tags-bar">
      <div class="primary-tags-wrapper">
        <button
          type="button"
          class="tag-filter-pill favorites-pill {$filtersStore.favoritesOnly ? 'include' : ''}"
          onclick={() => filtersStore.update(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
        >
          <HeartIcon size={11} fill="currentColor" color="none" class="heart-icon-badge" />
          <span>Favorites</span>
        </button>
        {#each PRIMARY_TAGS as tag (tag)}
          {@const isInc = $filtersStore.includedTags.includes(tag)}
          {@const isExc = $filtersStore.excludedTags.includes(tag)}
          <button
            type="button"
            class="tag-filter-pill {isInc ? 'include' : ''} {isExc ? 'exclude' : ''}"
            onclick={() => togglePrimaryTag(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
      <button type="button" class="btn-more-filters" onclick={() => isFiltersOpen = true}>
        <FilterIcon size={14} strokeWidth={2.5} />
        Filters
      </button>
    </div>
    {#if $filtersStore.searchQuery || $filtersStore.favoritesOnly || $filtersStore.includedTags.length > 0 || $filtersStore.excludedTags.length > 0 || $filtersStore.includedSources.length > 0 || $filtersStore.excludedSources.length > 0}
      <div class="search-results-info">
        <span>{searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} found</span>
        <button type="button" class="search-results-clear-link" onclick={clearAllFilters}>Clear filters</button>
      </div>
    {/if}
  </div>

  <div class="recipe-list recipe-grid">
    {#if paginatedResults.length === 0}
      <div class="search-no-results-text">
        No recipes found matching your filters.
      </div>
    {:else}
      {#each paginatedResults as recipe (recipe.permalink)}
        <RecipeCard {recipe} />
      {/each}
    {/if}
  </div>
{/if}

<FiltersModal isOpen={isFiltersOpen} onClose={() => isFiltersOpen = false} />

<style>
  .favorites-pill {
    display: inline-flex;
    align-items: center;
  }
  :global(.heart-icon-badge) {
    margin-right: 4px;
    fill: currentColor;
    stroke: none;
  }
  .search-no-results-text {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 1.5rem;
    color: var(--text-muted);
    font-size: 1.05rem;
  }

  .planner-callout-banner {
    align-items: center;
    background-color: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue-border-light);
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
  }

  .planner-callout-content {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .planner-callout-icon {
    font-size: 1.25rem;
  }

  .planner-callout-text {
    color: var(--text-color);
    font-size: 0.9rem;
  }

  .planner-callout-actions {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    gap: 0.5rem;
  }

  .planner-callout-btn {
    background-color: var(--noonblue);
    border-radius: 6px;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.4rem 0.8rem;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .planner-callout-btn:hover {
    background-color: var(--noonblue-hover);
    color: #ffffff;
    text-decoration: none;
  }

  .planner-callout-close {
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    padding: 0.35rem;
    transition: all 0.2s ease;
  }

  .planner-callout-close:hover {
    background-color: rgba(0, 0, 0, 0.06);
    color: var(--text-color);
  }
</style>

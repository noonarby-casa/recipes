<script lang="ts">
  import { onMount } from 'svelte';
  import { recipesStore } from '../stores/recipes';
  import { favoritesStore } from '../stores/favorites';
  import { filtersStore } from '../stores/filters';
  import RecipeCard from './RecipeCard.svelte';
  import FiltersModal from './FiltersModal.svelte';
  import { PRIMARY_TAGS } from '../constants';

  let hasHydrated = $state(false);
  let isFiltersOpen = $state(false);
  let displayCount = $state(24);

  let searchResults = $derived.by(() => {
    let list = $recipesStore;
    const q = $filtersStore.searchQuery.trim().toLowerCase();
    const favs = $favoritesStore;

    if ($filtersStore.favoritesOnly) {
      list = list.filter(r => r.shortId && favs.includes(r.shortId));
    }

    if (q) {
      list = list.filter(r => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const sourceMatch = r.recipeSource && r.recipeSource.toLowerCase().includes(q);
        const tagsMatch = r.tags && r.tags.some(t => t.toLowerCase().includes(q));
        const ingMatch = r.ingredients && r.ingredients.some(ing => {
          const name = typeof ing === 'string' ? ing : ing.item;
          return name.toLowerCase().includes(q);
        });
        return titleMatch || sourceMatch || tagsMatch || ingMatch;
      });
    }

    if ($filtersStore.includedTags.length > 0) {
      list = list.filter(r => {
        const rTags = new Set((r.tags || []).map(t => t.trim().toLowerCase()));
        for (const tag of $filtersStore.includedTags) {
          if (!rTags.has(tag.trim().toLowerCase())) {return false;}
        }
        return true;
      });
    }

    if ($filtersStore.excludedTags.length > 0) {
      list = list.filter(r => {
        const rTags = new Set((r.tags || []).map(t => t.trim().toLowerCase()));
        for (const tag of $filtersStore.excludedTags) {
          if (rTags.has(tag.trim().toLowerCase())) {return false;}
        }
        return true;
      });
    }

    if ($filtersStore.includedSources.length > 0) {
      list = list.filter(r => {
        const rSrc = (r.recipeSource || '').trim().toLowerCase();
        let match = false;
        for (const src of $filtersStore.includedSources) {
          if (rSrc === src.trim().toLowerCase()) {match = true;}
        }
        return match;
      });
    }

    if ($filtersStore.excludedSources.length > 0) {
      list = list.filter(r => {
        const rSrc = (r.recipeSource || '').trim().toLowerCase();
        return !$filtersStore.excludedSources.includes(rSrc);
      });
    }

    return list;
  });

  let paginatedResults = $derived(searchResults.slice(0, displayCount));

  function getSiteBasePath(): string {
    if (typeof window === 'undefined') {return '/';}
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/recipes/')) {
      return '/recipes/';
    }
    return '/';
  }

  async function hydrate() {
    if (hasHydrated) {return;}
    hasHydrated = true;

    try {
      const basePath = getSiteBasePath();
      const res = await fetch(`${basePath}index.json`);
      if (!res.ok) {throw new Error('Failed to fetch recipes');}
      const data = await res.json();
      recipesStore.set(data);

      const staticList = document.getElementById('recipe-list-default');
      if (staticList) {staticList.style.display = 'none';}

      const staticSearch = document.querySelector('.recipe-search-container') as HTMLElement | null;
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

    return () => {
      window.removeEventListener('scroll', handleScroll);
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
  <div class="recipe-search-container">
    <div class="recipe-search-box">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        stroke="currentColor"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="search"
        id="recipe-search-input-hydrated"
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
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
    </div>
    <div class="homepage-tags-bar">
      <button
        type="button"
        class="tag-filter-pill favorites-pill {$filtersStore.favoritesOnly ? 'include' : ''}"
        onclick={() => filtersStore.update(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
        style="display: inline-flex; align-items: center;"
      >
        <svg
          class="heart-icon-badge"
          viewBox="0 0 24 24"
          width="11"
          height="11"
          style="margin-right: 4px; fill: currentColor; stroke: none;"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>Favorites</span>
      </button>
      <div class="primary-tags-wrapper">
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
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filters
      </button>
    </div>
    {#if $filtersStore.searchQuery || $filtersStore.favoritesOnly || $filtersStore.includedTags.length > 0 || $filtersStore.excludedTags.length > 0 || $filtersStore.includedSources.length > 0 || $filtersStore.excludedSources.length > 0}
      <div class="search-results-info" style="display: flex;">
        <span>{searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} found</span>
        <button type="button" class="search-results-clear-link" onclick={clearAllFilters}>Clear filters</button>
      </div>
    {/if}
  </div>

  <div class="recipe-list recipe-grid">
    {#if paginatedResults.length === 0}
      <div class="search-no-results-text" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.05rem;">
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

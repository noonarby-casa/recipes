<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { filtersStore } from '../stores/filters';
  import { favoritesStore } from '../stores/favorites';
  import { scrollable } from '../actions/scrollable';

  interface Props {
    /** Whether the filters modal dialog is open and visible. */
    isOpen: boolean;
    /** Callback function to close the filters modal dialog. */
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let recipes = $derived($recipesStore);

  let uniqueTags = $derived(
    Array.from(new Set(recipes.flatMap((r) => r.tags || []))).sort()
  );
  let uniqueSources = $derived(
    Array.from(new Set(recipes.map((r) => r.recipeSource || 'Noonarby'))).sort()
  );

  let matchesForTags = $derived(
    recipes.filter((r) => {
      if ($filtersStore.searchQuery) {
        const query = $filtersStore.searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesSummary = r.summary && r.summary.toLowerCase().includes(query);
        const matchesSource = r.recipeSource && r.recipeSource.toLowerCase().includes(query);
        const matchesTags = r.tags && r.tags.some((t) => t.toLowerCase().includes(query));
        const matchesIngredients = r.ingredients && r.ingredients.some((ing) => {
          const item = typeof ing === 'string' ? ing : ing.item;
          return item.toLowerCase().includes(query);
        });
        if (!matchesTitle && !matchesSummary && !matchesSource && !matchesTags && !matchesIngredients) {
          return false;
        }
      }
      if ($filtersStore.favoritesOnly && (!r.shortId || !$favoritesStore.includes(r.shortId))) {
        return false;
      }
      if ($filtersStore.includedSources.length > 0 && !($filtersStore.includedSources.includes(r.recipeSource || 'Noonarby'))) {
        return false;
      }
      if ($filtersStore.excludedSources.includes(r.recipeSource || 'Noonarby')) {
        return false;
      }
      return true;
    })
  );

  let matchesForSources = $derived(
    recipes.filter((r) => {
      if ($filtersStore.searchQuery) {
        const query = $filtersStore.searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesSummary = r.summary && r.summary.toLowerCase().includes(query);
        const matchesSource = r.recipeSource && r.recipeSource.toLowerCase().includes(query);
        const matchesTags = r.tags && r.tags.some((t) => t.toLowerCase().includes(query));
        const matchesIngredients = r.ingredients && r.ingredients.some((ing) => {
          const item = typeof ing === 'string' ? ing : ing.item;
          return item.toLowerCase().includes(query);
        });
        if (!matchesTitle && !matchesSummary && !matchesSource && !matchesTags && !matchesIngredients) {
          return false;
        }
      }
      if ($filtersStore.favoritesOnly && (!r.shortId || !$favoritesStore.includes(r.shortId))) {
        return false;
      }
      if ($filtersStore.includedTags.length > 0 && !($filtersStore.includedTags.some(t => r.tags?.includes(t)))) {
        return false;
      }
      if ($filtersStore.excludedTags.some(t => r.tags?.includes(t))) {
        return false;
      }
      return true;
    })
  );

  let tagTallies = $derived.by(() => {
    const tallies: Record<string, number> = {};
    matchesForTags.forEach((r) => {
      if (r.tags) {
        r.tags.forEach((tag) => {
          tallies[tag] = (tallies[tag] || 0) + 1;
        });
      }
    });
    return tallies;
  });

  let sourceTallies = $derived.by(() => {
    const tallies: Record<string, number> = {};
    matchesForSources.forEach((r) => {
      const src = r.recipeSource || 'Noonarby';
      tallies[src] = (tallies[src] || 0) + 1;
    });
    return tallies;
  });

  function toggleTag(tag: string) {
    filtersStore.update((state) => {
      const included = [...state.includedTags];
      const excluded = [...state.excludedTags];
      if (included.includes(tag)) {
        return {
          ...state,
          includedTags: included.filter((t) => t !== tag),
          excludedTags: [...excluded, tag],
        };
      } else if (excluded.includes(tag)) {
        return {
          ...state,
          excludedTags: excluded.filter((t) => t !== tag),
        };
      } else {
        return {
          ...state,
          includedTags: [...included, tag],
        };
      }
    });
  }

  function toggleSource(src: string) {
    filtersStore.update((state) => {
      const included = [...state.includedSources];
      const excluded = [...state.excludedSources];
      if (included.includes(src)) {
        return {
          ...state,
          includedSources: included.filter((s) => s !== src),
          excludedSources: [...excluded, src],
        };
      } else if (excluded.includes(src)) {
        return {
          ...state,
          excludedSources: excluded.filter((s) => s !== src),
        };
      } else {
        return {
          ...state,
          includedSources: [...included, src],
        };
      }
    });
  }

  function clearAll() {
    filtersStore.update((state) => ({
      ...state,
      includedTags: [],
      excludedTags: [],
      includedSources: [],
      excludedSources: [],
    }));
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="planner-modal-backdrop" onclick={handleBackdropClick} style="display: flex;">
    <div class="planner-modal-content" style="max-height: 75vh; height: auto;">
      <div class="planner-modal-header">
        <h3>Filter Recipes</h3>
        <button
          type="button"
          class="modal-close-btn"
          title="Close filters modal"
          aria-label="Close filters modal"
          onclick={onClose}
        >
          ✕
        </button>
      </div>
      <div
        class="planner-modal-body scrollable-area"
        use:scrollable
        style="padding: 1.25rem 1.5rem;"
        tabindex="0"
        role="region"
        aria-label="Recipe Filters"
      >
        <div
          style="margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center; justify-content: space-between;"
        >
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Active filters apply to the recipes list.
          </span>
          <button
            type="button"
            class="planner-clear-btn"
            style="font-size: 0.8rem; padding: 0.35rem 0.75rem; margin: 0;"
            onclick={clearAll}
          >
            ✕ Clear All Filters
          </button>
        </div>
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--text-title);">
          Filter by Tag
        </h4>
        <div class="planner-tag-filters" style="margin-bottom: 1.5rem;">
          {#each uniqueTags as tag}
            {@const isInc = $filtersStore.includedTags.includes(tag)}
            {@const isExc = $filtersStore.excludedTags.includes(tag)}
            {@const count = tagTallies[tag] || 0}
            {@const isDim = count === 0 && !isInc && !isExc}
            <button
              type="button"
              class="tag-filter-pill {isInc ? 'include' : ''} {isExc ? 'exclude' : ''} {isDim ? 'dimmed' : ''}"
              disabled={isDim}
              onclick={() => toggleTag(tag)}
            >
              {#if isInc}✓{:else if isExc}✕{/if} {tag.charAt(0).toUpperCase() + tag.slice(1)} <span class="tag-count">{count}</span>
            </button>
          {/each}
        </div>
        <hr
          class="shopping-divider"
          style="margin: 1.25rem 0; border: 0; border-top: 1px solid var(--border-subtle);"
        />
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--text-title);">
          Filter by Source
        </h4>
        <div class="planner-tag-filters">
          {#each uniqueSources as src}
            {@const isInc = $filtersStore.includedSources.includes(src)}
            {@const isExc = $filtersStore.excludedSources.includes(src)}
            {@const count = sourceTallies[src] || 0}
            {@const isDim = count === 0 && !isInc && !isExc}
            <button
              type="button"
              class="tag-filter-pill {isInc ? 'include' : ''} {isExc ? 'exclude' : ''} {isDim ? 'dimmed' : ''}"
              disabled={isDim}
              onclick={() => toggleSource(src)}
            >
              {#if isInc}✓{:else if isExc}✕{/if} {src} <span class="tag-count">{count}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.modal-backdrop) {
    align-items: center;
    backdrop-filter: blur(4px);
    background-color: rgba(0, 0, 0, 0.55);
    display: none;
    height: 100vh;
    justify-content: center;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 100000;
  }

  :global(.modal-backdrop.active) {
    display: flex;
  }

  :global(.modal-content) {
    animation: modalFadeIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    max-width: 450px;
    width: 90%;
  }

  :global(.modal-header) {
    align-items: center;
    border-bottom: 1px solid var(--border-ultra-subtle);
    display: flex;
    justify-content: space-between;
    padding: 1.25rem 1.5rem 0.75rem 1.5rem;
  }

  :global(.modal-title) {
    color: var(--text-title);
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
  }

  :global(.modal-close-btn) {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.5rem;
    font-weight: 300;
    height: 28px;
    justify-content: center;
    line-height: 1;
    padding: 0;
    transition: all 0.2s ease;
    width: 28px;
  }

  :global(.modal-close-btn:hover) {
    background-color: var(--font-controls-bg);
    color: var(--text-title);
  }

  :global(.modal-body) {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
  }

  @keyframes modalFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

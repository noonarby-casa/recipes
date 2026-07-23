<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { filtersStore, calculateTagTallies, calculateSourceTallies } from '../stores/filters';
  import { favoritesStore } from '../stores/favorites';
  import { scrollable } from '../actions/scrollable';
  import Modal from './Modal.svelte';

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

  let tagTallies = $derived(
    calculateTagTallies(recipes, uniqueTags, $filtersStore, $favoritesStore)
  );

  let sourceTallies = $derived(
    calculateSourceTallies(recipes, $filtersStore, $favoritesStore)
  );

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
</script>

<Modal
  {isOpen}
  {onClose}
  title="Filter Recipes"
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content"
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="planner-modal-body scrollable-area"
    use:scrollable
    tabindex="0"
    role="region"
    aria-label="Recipe Filters"
  >
    <div class="filter-header">
      <span class="filter-desc">
        Active filters apply to the recipes list.
      </span>
      <button
        type="button"
        class="planner-clear-btn"
        onclick={clearAll}
      >
        ✕ Clear All Filters
      </button>
    </div>
    <h4 class="filter-section-title">
      Filter by Tag
    </h4>
    <div class="planner-tag-filters tag-section-margin">
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
    <hr class="modal-divider" />
    <h4 class="filter-section-title">
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
</Modal>

<style>
  .filter-header {
    margin-bottom: 1.25rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  .filter-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .filter-section-title {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: var(--text-title);
  }

  .planner-tag-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-section-margin {
    margin-bottom: 1.5rem;
  }

  .modal-divider {
    margin: 1.25rem 0;
    border: 0;
    border-top: 1px solid var(--border-subtle);
  }
</style>

<script lang="ts">
  import type { Recipe } from '../types';
  import { favoritesStore } from '../stores/favorites';

  import { getSiteBasePath } from '../utils/site';

  interface Props {
    /** The recipe data to display in the browse card. */
    recipe: Recipe;
    /** Whether this recipe is currently added/planned in the meal planner. */
    isPlanned: boolean;
    /** Callback function triggered when the card is clicked to add the recipe. */
    onAdd: () => void;
  }

  let { recipe, isPlanned, onAdd }: Props = $props();

  let isFav = $derived(
    recipe.shortId ? $favoritesStore.includes(recipe.shortId) : false,
  );

  let basePath = $derived(getSiteBasePath());
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="browse-card {isPlanned ? 'planned' : ''}" onclick={onAdd}>
  <div class="browse-info">
    <img
      class="browse-img"
      src={recipe.image130 || `${basePath}icon-600.png`}
      alt={recipe.title}
      onerror={(e) => {
        (e.currentTarget as HTMLImageElement).src = `${basePath}icon-600.png`;
      }}
    />
    <div class="browse-title-wrapper">
      <h4 class="browse-title">{recipe.title}</h4>
      {#if isPlanned}
        <span class="browse-badge">Planned</span>
      {/if}
    </div>
  </div>
  {#if isFav}
    <button
      type="button"
      class="browse-add-btn browse-fav-active"
      aria-label="Favorited recipe"
      style="background: none; color: var(--heart-color); font-size: 0.85rem;"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
        stroke="none"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
    </button>
  {:else}
    <button type="button" class="browse-add-btn" aria-label="Add to plan"
      >+</button
    >
  {/if}
</div>

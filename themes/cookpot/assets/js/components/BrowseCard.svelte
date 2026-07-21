<script lang="ts">
  import type { Recipe } from '../types';
  import { favoritesStore } from '../stores/favorites';
  import HeartIcon from './icons/HeartIcon.svelte';

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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="browse-card {isPlanned ? 'planned' : ''}" onclick={onAdd}>
  <div class="browse-info">
    <img
      class="browse-img"
      src={recipe.image130 || '/icon-600.png'}
      alt={recipe.title}
      onerror={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/icon-600.png';
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
    >
      <HeartIcon size={14} fill="currentColor" color="none" />
    </button>
  {:else}
    <button type="button" class="browse-add-btn" aria-label="Add to plan"
      >+</button
    >
  {/if}
</div>

<style>
  .browse-fav-active {
    background: none;
    color: var(--heart-color);
    font-size: 0.85rem;
  }
</style>

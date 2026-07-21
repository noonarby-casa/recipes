<script lang="ts">
  import type { Recipe } from '../types';
  import { favoritesStore } from '../stores/favorites';

  interface Props {
    /** The recipe data to display in the card. */
    recipe: Recipe;
    /** Whether the card title and image should link to the recipe's detail page (defaults to true). */
    linkable?: boolean;
    /** Whether to show the favorite button on the card (defaults to true). */
    showFavorite?: boolean;
    /** Svelte Snippet for the inner HTML/children content of the card. */
    children?: import('svelte').Snippet;
  }

  let { recipe, linkable = true, showFavorite = true, children }: Props = $props();

  let isFav = $derived(recipe.shortId ? $favoritesStore.includes(recipe.shortId) : false);


</script>

<article class="recipe-list-item">
  {#if recipe.image130}
    <div class="recipe-list-image-container">
      <div class="recipe-list-image">
        {#if linkable}
          <a href={recipe.permalink}>
            <img
              src={recipe.image130}
              srcset={`${recipe.image90} 90w, ${recipe.image130} 130w, ${recipe.image180} 180w, ${recipe.image260} 260w`}
              sizes="(max-width: 599px) 90px, 130px"
              width="130"
              height="130"
              alt={recipe.title}
              loading="lazy"
            />
          </a>
        {:else}
          <img
            src={recipe.image130}
            srcset={`${recipe.image90} 90w, ${recipe.image130} 130w, ${recipe.image180} 180w, ${recipe.image260} 260w`}
            sizes="(max-width: 599px) 90px, 130px"
            width="130"
            height="130"
            alt={recipe.title}
            loading="lazy"
          />
        {/if}
      </div>
      {#if showFavorite && isFav}
        <div
          class="recipe-favorite-badge"
          data-short-id={recipe.shortId}
          title="Favorited recipe"
          style="display: flex;"
        >
          <svg
            class="heart-icon-badge"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            ></path>
          </svg>
        </div>
      {/if}
    </div>
  {/if}
  <div class="recipe-list-content">
    <h2 class="recipe-list-title">
      {#if linkable}
        <a href={recipe.permalink}>{recipe.title}</a>
      {:else}
        {recipe.title}
      {/if}
    </h2>
    <div class="recipe-list-meta">
      <div class="recipe-metadata-items">
        {#if recipe.dateHuman}
          <div class="recipe-meta-item recipe-date">
            <svg
              class="date-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <time datetime={recipe.dateMachine} class="recipe-list-date"
              >{recipe.dateHuman}</time
            >
          </div>
        {/if}
        {#if recipe.times && recipe.times.length > 0}
          <div class="recipe-meta-item recipe-time">
            <svg
              class="time-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>
              {#each recipe.times as t, index}
                {#if index > 0}{" + "}{/if}
                {t.step.charAt(0).toUpperCase() + t.step.slice(1)} {t.time}
              {/each}
            </span>
          </div>
        {/if}
        <div class="recipe-meta-item recipe-source">
          <svg
            class="source-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{recipe.recipeSource || 'Noonarby'}</span>
        </div>
      </div>
      {#if recipe.tags && recipe.tags.length > 0}
        {@const primaryTags = ["breakfast", "lunch", "dinner", "dessert", "vegetarian", "vegan"]}
        {@const matchingPrimary = recipe.tags.filter(tag => primaryTags.includes(tag.toLowerCase()))}
        {#if matchingPrimary.length > 0}
          <div class="recipe-tags-container">
            <ul class="recipe-tags-list">
              {#each matchingPrimary as tag}
                <li><span class="recipe-tag-label">{tag.charAt(0).toUpperCase() + tag.slice(1)}</span></li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  {#if children}
    {@render children()}
  {/if}
</article>

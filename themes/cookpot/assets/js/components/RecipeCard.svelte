<script lang="ts">
  import type { Recipe } from '../types';
  import { favoritesStore } from '../stores/favorites';
  import HeartIcon from './icons/HeartIcon.svelte';
  import CalendarIcon from './icons/CalendarIcon.svelte';
  import ClockIcon from './icons/ClockIcon.svelte';
  import UserIcon from './icons/UserIcon.svelte';

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
        >
          <HeartIcon fill="currentColor" color="none" class="heart-icon-badge" />
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
            <CalendarIcon size={14} strokeWidth={2.5} class="date-icon" />
            <time datetime={recipe.dateMachine} class="recipe-list-date"
              >{recipe.dateHuman}</time
            >
          </div>
        {/if}
        {#if recipe.times && recipe.times.length > 0}
          <div class="recipe-meta-item recipe-time">
            <ClockIcon size={14} strokeWidth={2.5} class="time-icon" />
            <span>
              {#each recipe.times as t, index}
                {#if index > 0}{" + "}{/if}
                {t.step.charAt(0).toUpperCase() + t.step.slice(1)} {t.time}
              {/each}
            </span>
          </div>
        {/if}
        <div class="recipe-meta-item recipe-source">
          <UserIcon size={14} strokeWidth={2.5} class="source-icon" />
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

<style>
  .recipe-favorite-badge {
    display: flex;
  }
</style>

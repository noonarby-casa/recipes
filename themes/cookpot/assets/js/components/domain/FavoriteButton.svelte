<script lang="ts">
  import { favoritesStore } from '../../stores/favorites';
  import Icon from '../primitives/Icon.svelte';

  interface Props {
    /** The unique short ID of the recipe. Used to check if it's in the favorites store and to toggle favorites state. */
    shortId: string;
  }

  let { shortId }: Props = $props();

  let isFav = $derived($favoritesStore.includes(shortId));

  function toggle() {
    favoritesStore.toggle(shortId);
  }
</script>

<button
  type="button"
  class="recipe-favorite-btn {isFav ? 'is-favorite' : ''}"
  id="recipe-favorite-btn"
  onclick={toggle}
  aria-label="Favorite recipe"
  aria-pressed={isFav ? 'true' : 'false'}
  title="Favorite recipe"
>
  <Icon name="heart" class="heart-icon" />
</button>

<style>
  :global(.recipe-favorite-btn) {
    background: transparent;
    border: 1px solid var(--btn-border);
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--btn-shadow);
    color: var(--text-muted);
  }

  :global(.recipe-favorite-btn:hover) {
    background-color: var(--heart-bg-hover);
    border-color: var(--heart-border-hover);
    color: var(--heart-color);
    transform: scale(1.05);
  }

  :global(.recipe-favorite-btn:active) {
    transform: scale(0.95);
  }

  :global(.recipe-favorite-btn .heart-icon) {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    transition:
      fill 0.25s ease,
      stroke 0.25s ease;
    width: 18px;
    height: 18px;
  }

  :global(.recipe-favorite-btn.is-favorite) {
    border-color: var(--heart-color);
    background-color: var(--heart-bg-hover);
    color: var(--heart-color);
  }

  :global(.recipe-favorite-btn.is-favorite .heart-icon) {
    fill: var(--heart-color);
    stroke: var(--heart-color);
  }

  :global(.recipe-favorite-btn .heart-icon.pop-anim) {
    animation: heart-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes heart-pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.35);
    }
    100% {
      transform: scale(1);
    }
  }

  :global(.recipe-list-image-container),
  :global(.browse-img-wrapper) {
    position: relative;
    display: flex;
  }

  :global(.recipe-scale-panel .recipe-favorite-btn) {
    margin-left: auto;
    order: 99;
    position: static;
  }
</style>

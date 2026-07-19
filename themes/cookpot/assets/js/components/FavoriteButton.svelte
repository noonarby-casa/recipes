<script lang="ts">
  import { favoritesStore } from '../stores/favorites';

  interface Props {
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
  <svg
    class="heart-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
</button>

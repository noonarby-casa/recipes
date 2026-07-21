<script lang="ts">
  import type { Recipe, PlannedItem } from '../types';
  import { recipesStore } from '../stores/recipes';
  import { plannerStore } from '../stores/planner';
  import { favoritesStore } from '../stores/favorites';
  import { formatItemQuantity } from '../units';
  import PortionPicker from './PortionPicker.svelte';
  import HeartIcon from './icons/HeartIcon.svelte';
  import CalendarIcon from './icons/CalendarIcon.svelte';
  import ClockIcon from './icons/ClockIcon.svelte';
  import UserIcon from './icons/UserIcon.svelte';
  import SwapIcon from './icons/SwapIcon.svelte';
  import EditIcon from './icons/EditIcon.svelte';

  interface Props {
    /** The recipe data to display. */
    recipe?: Recipe;
    /** The planned item (recipe or custom food item) to display. */
    item?: PlannedItem;
    /** Display mode variant: 'standard' (homepage/search), 'planner' (calendar), or 'compact' (modal shelf). */
    variant?: 'standard' | 'planner' | 'compact';
    /** Whether the title/image should link to the detail page (defaults to true). */
    linkable?: boolean;
    /** Whether to show the favorite heart badge (defaults to true). */
    showFavorite?: boolean;
    /** Whether the meal planner is currently in edit mode (used when variant="planner"). */
    editMode?: boolean;
    /** Whether this recipe is currently added to the plan (used when variant="compact"). */
    isPlanned?: boolean;
    /** Callback triggered when removing the item (variant="planner"). */
    onRemove?: () => void;
    /** Callback triggered when swapping the item (variant="planner"). */
    onSwap?: () => void;
    /** Callback triggered when editing details of the item (variant="planner"). */
    onEditDetails?: () => void;
    /** Callback triggered when clicking the card (variant="compact"). */
    onClick?: () => void;
    /** Svelte Snippet for custom inner/children content. */
    children?: import('svelte').Snippet;
  }

  let {
    recipe,
    item,
    variant = 'standard',
    linkable = true,
    showFavorite = true,
    editMode = false,
    isPlanned = false,
    onRemove,
    onSwap,
    onEditDetails,
    onClick,
    children,
  }: Props = $props();

  let recipes = $derived($recipesStore);
  let rec = $derived(
    recipe || (item?.permalink ? recipes.find((r) => r.permalink === item.permalink) : undefined)
  );

  let title = $derived(rec ? rec.title : item?.customTitle || 'Custom Item');
  let shortId = $derived(rec?.shortId || recipe?.shortId);
  let isFav = $derived(shortId ? $favoritesStore.includes(shortId) : false);

  let defaultServings = $derived(rec ? rec.servings : 4);
  let portions = $derived(
    item ? Math.round(item.scale * defaultServings) : defaultServings
  );
  let extras = $derived(item?.extraIngredients || []);
  let imgUrl = $derived(
    rec?.image260 || rec?.image180 || rec?.image130 || recipe?.image260 || recipe?.image180 || recipe?.image130 || '/icon-600.png'
  );
  let srcset = $derived.by(() => {
    const r = rec || recipe;
    if (r?.image260) {
      return `${r.image90 || r.image130} 90w, ${r.image130} 130w, ${r.image180 || r.image260} 180w, ${r.image260} 260w`;
    }
    return undefined;
  });

  let permalinkUrl = $derived.by(() => {
    if (!linkable || editMode) {return '';}
    if (variant === 'planner' && item?.permalink) {
      return `${item.permalink}?from=plan&instanceId=${item.instanceId}&servings=${portions}`;
    }
    if (rec?.permalink) {
      return rec.permalink;
    }
    return '';
  });

  function handlePortionChange(nextPortions: number) {
    if (item) {
      plannerStore.updateScale(item.instanceId, nextPortions / defaultServings);
    }
  }
</script>

{#if variant === 'standard' || variant === 'planner'}

  <article
    class="recipe-card-unified {variant}-card {editMode ? 'edit-mode' : 'view-mode'}"
    data-instance-id={item?.instanceId}
  >
    <!-- Vertical Top Half: Recipe Image & Icons -->
    <div class="recipe-card-media-wrapper">
      {#if permalinkUrl}
        <a href={permalinkUrl} class="recipe-card-image-link">
          <img
            src={imgUrl}
            {srcset}
            sizes="(max-width: 599px) 180px, 260px"
            alt={title}
            class="recipe-card-img"
            loading="lazy"
            onerror={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/icon-600.png';
            }}
          />
        </a>
      {:else}
        <img
          src={imgUrl}
          {srcset}
          sizes="(max-width: 599px) 180px, 260px"
          alt={title}
          class="recipe-card-img"
          loading="lazy"
          onerror={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/icon-600.png';
          }}
        />
      {/if}

      {#if showFavorite && isFav}
        <div class="recipe-favorite-badge" title="Favorited recipe">
          <HeartIcon fill="currentColor" color="none" size={13} />
        </div>
      {/if}

      {#if variant === 'planner' && editMode}
        <div class="recipe-drag-handle" title="Drag to reorder">⠿</div>
      {/if}
    </div>

    <!-- Vertical Bottom Half: Title and Mode Details -->
    <div class="recipe-card-body">
      <h3 class="recipe-card-title">
        {#if permalinkUrl}
          <a href={permalinkUrl}>{title}</a>
        {:else}
          {title}
        {/if}
      </h3>

      {#if variant === 'standard'}
        <!-- Standard Mode Details (Date, Times, Source, Tags) -->
        <div class="recipe-list-meta">
          <div class="recipe-metadata-items">
            {#if rec?.dateHuman}
              <div class="recipe-meta-item recipe-date">
                <CalendarIcon size={14} strokeWidth={2.5} class="date-icon" />
                <time datetime={rec.dateMachine} class="recipe-list-date">{rec.dateHuman}</time>
              </div>
            {/if}
            {#if rec?.times && rec.times.length > 0}
              <div class="recipe-meta-item recipe-time">
                <ClockIcon size={14} strokeWidth={2.5} class="time-icon" />
                <span>
                  {#each rec.times as t, index}
                    {#if index > 0}{' + '}{/if}
                    {t.step.charAt(0).toUpperCase() + t.step.slice(1)} {t.time}
                  {/each}
                </span>
              </div>
            {/if}
            <div class="recipe-meta-item recipe-source">
              <UserIcon size={14} strokeWidth={2.5} class="source-icon" />
              <span>{rec?.recipeSource || 'Noonarby'}</span>
            </div>
          </div>
          {#if rec?.tags && rec.tags.length > 0}
            {@const primaryTags = ['breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'vegan']}
            {@const matchingPrimary = rec.tags.filter((tag) => primaryTags.includes(tag.toLowerCase()))}
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
        {#if children}
          {@render children()}
        {/if}

      {:else if variant === 'planner'}
        <!-- Planner Mode Details (Servings / Controls & Extra Sides) -->
        {#if editMode}
          <div class="planner-edit-controls-stacked">
            <div class="portion-picker-row">
              <PortionPicker value={portions} onChange={handlePortionChange} />
            </div>
            <div class="planner-action-btns">
              {#if onSwap}
                <button type="button" class="recipe-control-btn recipe-swap-btn" onclick={onSwap} title="Swap recipe">
                  <SwapIcon size={14} strokeWidth={2.5} />
                </button>
              {/if}
              {#if onEditDetails}
                <button type="button" class="recipe-control-btn recipe-edit-details-btn" onclick={onEditDetails} title="Edit details">
                  <EditIcon size={14} strokeWidth={2.5} />
                </button>
              {/if}
              {#if onRemove}
                <button type="button" class="recipe-control-btn recipe-remove-btn" onclick={onRemove} title="Remove recipe">✕</button>
              {/if}
            </div>
          </div>
        {:else}
          <span class="recipe-serving-text">{portions} serving{portions !== 1 ? 's' : ''}</span>
        {/if}

        {#if extras.length > 0}
          <div class="recipe-card-extra-ingredients">
            <span class="extra-ingredients-label">Sides</span>
            <ul class="extra-ingredients-list">
              {#each extras as ing}
                {@const qtyVal = ing.qty !== undefined ? (Array.isArray(ing.qty) ? ing.qty[0] : ing.qty) : null}
                {@const formatted = formatItemQuantity(qtyVal, ing.unit || '', ing.item, true)}
                <li>
                  <span>{formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{ing.desc ? ing.desc + ' ' : ''}{formatted.itemStr}{ing.prep ? `, ${ing.prep}` : ''}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </div>
  </article>

{:else if variant === 'compact'}

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="browse-card {isPlanned ? 'planned' : ''}" onclick={onClick}>
    <div class="browse-info">
      <div class="browse-img-wrapper">
        <img
          class="browse-img"
          src={imgUrl}
          alt={title}
          onerror={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/icon-600.png';
          }}
        />
        {#if showFavorite && isFav}
          <div class="compact-fav-badge" title="Favorited recipe">
            <HeartIcon size={10} fill="currentColor" color="none" />
          </div>
        {/if}
      </div>
      <div class="browse-title-wrapper">
        <h4 class="browse-title">{title}</h4>
        {#if isPlanned}
          <span class="browse-badge">Planned</span>
        {/if}
      </div>
    </div>
  </div>

{/if}

<style>
  .recipe-card-unified {
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
  .recipe-card-unified:hover {
    border-color: var(--noonblue-panel-hover-border);
    box-shadow: 0 8px 25px rgba(0, 128, 216, 0.08);
    transform: translateY(-2px);
  }
  .recipe-card-media-wrapper {
    aspect-ratio: 1 / 1;
    background-color: var(--image-bg);
    height: auto;
    position: relative;
    width: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }
  .recipe-card-image-link {
    display: block;
    width: 100%;
    height: 100%;
  }
  .recipe-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.4s ease;
  }
  .recipe-card-unified:hover .recipe-card-img {
    transform: scale(1.05);
  }
  .recipe-favorite-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 3px;
    color: var(--heart-color);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    z-index: 5;
  }
  html.dark-mode .recipe-favorite-badge {
    background: rgba(30, 30, 30, 0.85);
  }
  .recipe-card-controls {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
  }
  .recipe-card-body {
    display: flex;
    flex-direction: column;
    padding: 0.65rem 0.75rem;
    flex-grow: 1;
    gap: 0.35rem;
  }
  .recipe-card-title {
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
    color: var(--text-title);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .recipe-card-title a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .recipe-card-title a:hover {
    color: var(--noonblue);
  }
  .recipe-serving-text {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
  }
  .planner-edit-controls-stacked {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    margin-top: 0.2rem;
  }
  .portion-picker-row {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  .planner-action-btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
  }
  .recipe-control-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 8px;
    color: var(--font-btn-text);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.85rem;
    height: 32px;
    width: 32px;
    min-width: 32px;
    min-height: 32px;
    justify-content: center;
    line-height: 1;
    padding: 0;
    transition: all 0.2s ease;
  }
  .recipe-control-btn:hover {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }
  .recipe-control-btn.recipe-remove-btn:hover {
    background-color: rgba(255, 59, 48, 0.15);
    border-color: #ff3b30;
    color: #ff3b30;
  }
  .recipe-drag-handle {
    position: absolute;
    top: 6px;
    left: 6px;
    align-items: center;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(2px);
    border-radius: 6px;
    color: #fff;
    cursor: grab;
    display: flex;
    font-size: 0.85rem;
    justify-content: center;
    line-height: 1;
    min-width: 28px;
    min-height: 28px;
    padding: 2px 6px;
    user-select: none;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  }
  .recipe-drag-handle:active {
    cursor: grabbing;
  }
  .browse-img-wrapper {
    position: relative;
    flex-shrink: 0;
  }
  .compact-fav-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: var(--card-bg);
    border-radius: 50%;
    padding: 1px;
    color: var(--heart-color);
    display: flex;
    line-height: 1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
</style>

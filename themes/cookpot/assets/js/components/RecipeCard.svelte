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
  .recipe-card-controls {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
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

  .planned-recipe-item {
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    box-shadow: var(--btn-shadow);
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    position: relative;
    transition: all 0.2s ease;
  }

  .planned-recipe-item:hover {
    border-color: var(--noonblue-border-light);
  }

  .planned-recipe-item.view-mode-card .recipe-card-body {
    padding-bottom: 0.6rem;
  }

  .planned-recipe-item.dinner-slot-card {
    border-color: var(--border-subtle);
    border-width: 2.5px;
  }

  .planned-recipe-item.dinner-slot-card:hover {
    border-color: var(--noonblue-border-light);
  }

  .planned-recipe-item.dragging {
    border-color: var(--noonblue);
    border-style: dashed;
    opacity: 0.4;
  }

  .planned-recipe-item.drag-over {
    position: relative;
  }

  .planned-recipe-item.drag-over::before {
    background-color: var(--noonblue);
    content: '';
    height: 4px;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 100;
  }

  .planned-recipe-item.new-addition {
    animation: flashHighlight 1.2s ease-out;
  }

  @keyframes flashHighlight {
    0% {
      background-color: var(--noonblue-bg-hover);
      border-color: var(--noonblue);
      transform: scale(1.03);
    }
    100% {
      background-color: var(--card-bg);
      border-color: var(--border-subtle);
      transform: scale(1);
    }
  }



  .recipe-card-footer {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0.6rem 0.6rem 0.6rem;
  }

  .recipe-card-extra-ingredients {
    margin-top: 0.5rem;
    padding-top: 0.4rem;
    border-top: 1px dashed var(--border-subtle);
  }

  .extra-ingredients-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 0.2rem;
  }

  .extra-ingredients-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .extra-ingredients-list li {
    font-size: 0.72rem;
    color: var(--text-body);
    line-height: 1.35;
    position: relative;
    padding-left: 0.55rem;
  }

  .extra-ingredients-list li::before {
    content: '•';
    color: var(--noonblue);
    position: absolute;
    left: 0;
  }

  .browse-card {
    align-items: center;
    background-color: var(--bg-color);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    transition: all 0.2s ease;
  }

  .browse-card:hover {
    border-color: var(--noonblue-border-light);
    box-shadow: var(--btn-shadow);
  }

  .browse-info {
    align-items: center;
    display: flex;
    flex: 1;
    gap: 0.6rem;
    min-width: 0;
  }

  .browse-img {
    background-color: var(--image-bg);
    border-radius: 4px;
    flex-shrink: 0;
    height: 38px;
    object-fit: cover;
    width: 38px;
  }

  .browse-title-wrapper {
    min-width: 0;
  }

  .browse-title {
    color: var(--text-color);
    font-size: 0.8rem;
    font-weight: 700;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .browse-badge {
    background-color: rgba(0, 128, 216, 0.1);
    border-radius: 3px;
    color: var(--noonblue);
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 600;
    margin-top: 0.1rem;
    padding: 0.05rem 0.3rem;
  }

  .browse-add-btn {
    align-items: center;
    background-color: var(--noonblue-bg-light);
    border: none;
    border-radius: 50%;
    color: var(--noonblue);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    font-size: 1rem;
    font-weight: 700;
    height: 24px;
    justify-content: center;
    width: 24px;
  }

  .browse-card.planned {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue-border-light);
  }

  .browse-card.keyboard-focused {
    background-color: var(--noonblue-bg-hover);
    border-color: var(--noonblue);
  }
</style>



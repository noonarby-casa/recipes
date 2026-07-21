<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { plannerStore } from '../stores/planner';
  import type { PlannedItem } from '../types';
  import { formatItemQuantity } from '../units';
  import PortionPicker from './PortionPicker.svelte';
  import SwapIcon from './icons/SwapIcon.svelte';
  import EditIcon from './icons/EditIcon.svelte';

  interface Props {
    /** The planned item (recipe or custom food item) to display. */
    item: PlannedItem;
    /** Whether the meal planner is currently in edit mode. */
    editMode: boolean;
    /** Callback triggered when removing the planned item from the planner. */
    onRemove: () => void;
    /** Callback triggered when swapping the planned recipe/item for another. */
    onSwap: () => void;
    /** Callback triggered when opening the details editor modal for this item. */
    onEditDetails: () => void;
  }

  let { item, editMode, onRemove, onSwap, onEditDetails }: Props = $props();

  let recipes = $derived($recipesStore);
  let rec = $derived(item.permalink ? recipes.find((r) => r.permalink === item.permalink) : undefined);
  let title = $derived(rec ? rec.title : item.customTitle || 'Custom Item');
  let defaultServings = $derived(rec ? rec.servings : 4);
  let portions = $derived(Math.round(item.scale * defaultServings));

  let extras = $derived(item.extraIngredients || []);

  function handlePortionChange(nextPortions: number) {
    plannerStore.updateScale(item.instanceId, nextPortions / defaultServings);
  }
</script>

{#if !editMode && rec}
  <a
    href="{item.permalink}?from=plan&instanceId={item.instanceId}&servings={portions}"
    class="planned-recipe-item view-mode-card"
    data-instance-id={item.instanceId}
  >
    <div class="planned-recipe-header">
      <h4 class="recipe-card-title">{title}</h4>
      <span class="recipe-serving-text">{portions} serving{portions !== 1 ? 's' : ''}</span>
    </div>
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
  </a>
{:else}

  <div
    class="planned-recipe-item {editMode ? 'edit-mode-card' : 'view-mode-card'}"
    data-instance-id={item.instanceId}
  >
    <div class="planned-recipe-header">
      <h4 class="recipe-card-title">{title}</h4>
      
      {#if editMode}
        <div class="recipe-card-controls">
          {#if rec}
            <button type="button" class="recipe-swap-btn" onclick={onSwap} title="Swap recipe">
              <SwapIcon size={12} strokeWidth={2.5} />
            </button>
          {/if}
          <button type="button" class="recipe-edit-details-btn" onclick={onEditDetails} title="Edit details">
            <EditIcon size={12} strokeWidth={2.5} />
          </button>
          <button type="button" class="recipe-remove-btn" onclick={onRemove} title="Remove recipe">✕</button>
          <div class="recipe-drag-handle">⠿</div>
        </div>
      {:else}
        <span class="recipe-serving-text">{portions} serving{portions !== 1 ? 's' : ''}</span>
      {/if}
    </div>

    {#if editMode}
      <div class="portion-picker-wrapper">
        <PortionPicker value={portions} onChange={handlePortionChange} />
      </div>
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
  </div>
{/if}

<style>
  .portion-picker-wrapper {
    margin-top: 0.5rem;
  }
</style>

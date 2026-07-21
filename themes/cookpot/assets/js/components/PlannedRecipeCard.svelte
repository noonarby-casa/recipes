<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { plannerStore } from '../stores/planner';
  import type { PlannedItem } from '../types';
  import { formatItemQuantity } from '../units';
  import PortionPicker from './PortionPicker.svelte';

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
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>
              </svg>
            </button>
          {/if}
          <button type="button" class="recipe-edit-details-btn" onclick={onEditDetails} title="Edit details">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
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

<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { favoritesStore } from '../stores/favorites';
  import { plannerStore } from '../stores/planner';
  import { scrollable } from '../actions/scrollable';
  import type { PlannedItem } from '../types';
  import { formatItemQuantity } from '../units';
  import { parseRawUserInput } from '../simple-parser';
  import { assembleIngredientText } from '../shopping-list/utils';
  import Modal from './Modal.svelte';
  import PortionPicker from './PortionPicker.svelte';
import HeartIcon from './icons/HeartIcon.svelte';
  import EditIcon from './icons/EditIcon.svelte';

  interface Props {
    /** Whether the details editor modal is open and visible. */
    isOpen: boolean;
    /** The planned item (recipe or custom food item) whose details are being edited. */
    item: PlannedItem;
    /** Callback function to close the details editor modal. */
    onClose: () => void;
  }

  let { isOpen, item, onClose }: Props = $props();

  let recipes = $derived($recipesStore);
  let rec = $derived(item.permalink ? recipes.find((r) => r.permalink === item.permalink) : undefined);
  let title = $derived(rec ? rec.title : item.customTitle || 'Custom Item');
  let defaultServings = $derived(rec ? rec.servings : 4);
  let portions = $derived(Math.round(item.scale * defaultServings));
  let isFav = $derived(rec && rec.shortId ? $favoritesStore.includes(rec.shortId) : false);

  let extras = $derived(item.extraIngredients || []);

  let editingIndex = $state<number | null>(null);
  let inputValue = $state('');

  let parsedExtra = $derived(inputValue.trim() ? parseRawUserInput(inputValue.trim()) : null);

  $effect(() => {
    if (editingIndex !== null && extras[editingIndex]) {
      inputValue = assembleIngredientText(extras[editingIndex], true);
    } else {
      inputValue = '';
    }
  });

  function toggleFavorite() {
    if (rec && rec.shortId) {
      favoritesStore.toggle(rec.shortId);
    }
  }

  function handleSaveExtra() {
    const text = inputValue.trim();
    if (editingIndex !== null) {
      const parsed = text ? parseRawUserInput(text) : null;
      const nextExtras = [...extras];
      if (!parsed || !parsed.item) {
        nextExtras.splice(editingIndex, 1);
      } else {
        nextExtras[editingIndex] = parsed;
      }
      plannerStore.updateExtraIngredients(item.instanceId, nextExtras);
      editingIndex = null;
    } else {
      if (!text) {return;}
      const parsed = parseRawUserInput(text);
      if (parsed.item) {
        plannerStore.updateExtraIngredients(item.instanceId, [...extras, parsed]);
        inputValue = '';
      }
    }
  }

  function handleCancelEdit() {
    editingIndex = null;
  }

  function handleEditExtra(idx: number) {
    editingIndex = idx;
  }

  function handleRemoveExtra(idx: number) {
    const nextExtras = extras.filter((_, i) => i !== idx);
    plannerStore.updateExtraIngredients(item.instanceId, nextExtras);
    if (editingIndex === idx) {
      editingIndex = null;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveExtra();
    } else if (e.key === 'Escape') {
      if (editingIndex !== null) {
        editingIndex = null;
        e.stopPropagation();
      }
    }
  }
</script>

<Modal
  {isOpen}
  {onClose}
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content"
  contentStyle="max-height: 85vh; height: auto;"
>
  {#snippet header()}
    <div class="planner-modal-header details-modal-header">
      <h3>Edit Details: {title}</h3>
      <button type="button" class="modal-close-btn" onclick={onClose}>✕</button>
    </div>
  {/snippet}

    <div class="planner-modal-body scrollable-area" use:scrollable>
      {#if !rec}
        <h4 class="details-section-title">Title</h4>
        <input
          type="text"
          value={item.customTitle || ''}
          onchange={(e) => plannerStore.updateCustomTitle(item.instanceId, e.currentTarget.value)}
          class="title-input"
        />
      {/if}

      <h4 class="details-section-title">Portions</h4>
      <div class="portions-row">
        <PortionPicker
          value={portions}
          onChange={(nextVal) => plannerStore.updateScale(item.instanceId, nextVal / defaultServings)}
        />

        {#if rec && rec.shortId}
          <button
            type="button"
            class="recipe-favorite-btn {isFav ? 'is-favorite' : ''}"
            onclick={toggleFavorite}
            aria-label="Favorite recipe"
            aria-pressed={isFav ? 'true' : 'false'}
            title="Favorite recipe"
          >
            <HeartIcon class="heart-icon" />
          </button>
        {/if}
      </div>

      <h4 class="details-section-title">Sides & Extra Ingredients</h4>
      {#if extras.length === 0}
        <div class="no-extras">No Sides or extra ingredients added yet.</div>
      {:else}
        <ul class="extras-list">
          {#each extras as ing, idx}
            {@const qtyVal = ing.qty !== undefined ? (Array.isArray(ing.qty) ? ing.qty[0] : ing.qty) : null}
            {@const formatted = formatItemQuantity(qtyVal, ing.unit || '', ing.item, true)}
            {@const descStr = ing.desc ? ing.desc + ' ' : ''}
            {@const fullItem = `${descStr}${formatted.itemStr}${ing.prep ? `, ${ing.prep}` : ''}`}
            {@const isEditing = editingIndex === idx}
            <li class="extras-item" class:editing={isEditing}>
              <span>{formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{fullItem}</span>
              <div class="extras-actions">
                <button type="button" onclick={() => handleEditExtra(idx)} title="Edit side" class="action-btn edit-btn">
                  <EditIcon size={14} strokeWidth={2.5} />
                </button>
                <button type="button" onclick={() => handleRemoveExtra(idx)} class="action-btn remove-btn">✕</button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="controls-row">
        <input
          type="text"
          bind:value={inputValue}
          onkeydown={handleKeydown}
          placeholder={editingIndex !== null ? 'Edit side...' : 'e.g. 1 can chickpeas'}
          class="extra-input"
        />
        <button type="button" onclick={handleSaveExtra} class="btn btn-brand save-btn">
          {editingIndex !== null ? 'Save' : 'Add'}
        </button>
        {#if editingIndex !== null}
          <button type="button" onclick={handleCancelEdit} class="btn btn-secondary cancel-btn">
            Cancel
          </button>
        {/if}
      </div>

      {#if parsedExtra && parsedExtra.item}
        <div id="extra-preview-container" class="preview-container">
          <div><strong>Qty:</strong> <span class="preview-val">{parsedExtra.qty !== undefined ? parsedExtra.qty.toString() : '—'}</span></div>
          <div><strong>Unit:</strong> <span class="preview-val">{parsedExtra.unit || '—'}</span></div>
          <div><strong>Desc:</strong> <span class="preview-val">{parsedExtra.desc || '—'}</span></div>
          <div><strong>Item:</strong> <span class="preview-val">{parsedExtra.item || '—'}</span></div>
          <div><strong>Prep:</strong> <span class="preview-val">{parsedExtra.prep || '—'}</span></div>
        </div>
      {/if}
    </div>
</Modal>

<style>
  .details-modal-header {
    gap: 0.5rem;
  }
  .details-modal-header h3 {
    margin: 0;
  }
  .details-section-title {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: var(--text-title);
  }
  .title-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    background: var(--bg-card);
    color: var(--text-body);
    margin-bottom: 1.5rem;
  }
  .portions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .no-extras {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }
  .extras-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
  }
  .extras-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
  }
  .extras-item.editing {
    background: var(--font-controls-bg);
    border-radius: 4px;
  }
  .extras-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .action-btn {
    background: none;
    border: none;
    color: var(--noonblue);
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .edit-btn {
    padding: 0.25rem;
  }
  .remove-btn {
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    line-height: 1;
  }
  .controls-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .extra-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    background: var(--bg-card);
    color: var(--text-body);
  }
  .save-btn {
    padding: 0.5rem 1rem;
    margin: 0;
  }
  .cancel-btn {
    padding: 0.5rem 1rem;
    margin: 0;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    color: var(--text-body);
    cursor: pointer;
  }
  .preview-container {
    display: flex;
    font-size: 0.8rem;
    background: var(--font-controls-bg);
    border: 1px dashed var(--border-subtle);
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .preview-val {
    color: var(--noonblue);
    font-family: monospace;
  }
</style>

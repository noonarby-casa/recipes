<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { favoritesStore } from '../stores/favorites';
  import { plannerStore } from '../stores/planner';
  import type { PlannedItem } from '../types';
  import { formatItemQuantity } from '../units';
  import { parseRawUserInput } from '../simple-parser';
  import { assembleIngredientText } from '../shopping-list/utils';

  interface Props {
    isOpen: boolean;
    item: PlannedItem;
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

  function decPortions() {
    const nextPortions = Math.max(1, portions - 1);
    plannerStore.updateScale(item.instanceId, nextPortions / defaultServings);
  }

  function incPortions() {
    const nextPortions = portions + 1;
    plannerStore.updateScale(item.instanceId, nextPortions / defaultServings);
  }

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
      } else {
        onClose();
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="planner-modal-backdrop" onclick={handleBackdropClick} style="display: flex;">
    <div class="planner-modal-content" style="max-height: 85vh; height: auto;">
      <div class="planner-modal-header" style="display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;">
        <h3 style="margin: 0;">Edit Details: {title}</h3>
        <button type="button" class="modal-close-btn" onclick={onClose} style="margin: 0; background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted);">✕</button>
      </div>
      <div class="planner-modal-body scrollable-area" style="padding: 1.25rem 1.5rem; overflow-y: auto;">
        {#if !rec}
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text-title);">Title</h4>
          <input
            type="text"
            value={item.customTitle || ''}
            onchange={(e) => plannerStore.updateCustomTitle(item.instanceId, e.currentTarget.value)}
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-subtle); border-radius: 4px; background: var(--bg-card); color: var(--text-body); margin-bottom: 1.5rem;"
          />
        {/if}

        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text-title);">Portions</h4>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <div class="portion-picker" style="display: inline-flex;">
            <button type="button" class="portion-btn" onclick={decPortions}>-</button>
            <span class="portion-val" style="min-width: 3rem; text-align: center; font-weight: bold; line-height: 32px;">{portions}</span>
            <button type="button" class="portion-btn" onclick={incPortions}>+</button>
          </div>

          {#if rec && rec.shortId}
            <button
              type="button"
              class="recipe-favorite-btn {isFav ? 'is-favorite' : ''}"
              onclick={toggleFavorite}
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
          {/if}
        </div>

        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text-title);">Sides & Extra Ingredients</h4>
        {#if extras.length === 0}
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">No Sides or extra ingredients added yet.</div>
        {:else}
          <ul style="list-style: none; padding: 0; margin: 0 0 1rem 0;">
            {#each extras as ing, idx}
              {@const qtyVal = ing.qty !== undefined ? (Array.isArray(ing.qty) ? ing.qty[0] : ing.qty) : null}
              {@const formatted = formatItemQuantity(qtyVal, ing.unit || '', ing.item, true)}
              {@const descStr = ing.desc ? ing.desc + ' ' : ''}
              {@const fullItem = `${descStr}${formatted.itemStr}${ing.prep ? `, ${ing.prep}` : ''}`}
              {@const isEditing = editingIndex === idx}
              <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border-subtle); {isEditing ? 'background: var(--font-controls-bg); border-radius: 4px;' : ''}">
                <span>{formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{fullItem}</span>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                  <button type="button" onclick={() => handleEditExtra(idx)} title="Edit side" style="background: none; border: none; color: var(--noonblue); cursor: pointer; padding: 0.25rem; display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button type="button" onclick={() => handleRemoveExtra(idx)} style="background: none; border: none; color: var(--noonblue); font-weight: bold; cursor: pointer; padding: 0.25rem 0.5rem; font-size: 1rem; line-height: 1;">✕</button>
                </div>
              </li>
            {/each}
          </ul>
        {/if}

        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input
            type="text"
            bind:value={inputValue}
            onkeydown={handleKeydown}
            placeholder={editingIndex !== null ? 'Edit side...' : 'e.g. 1 can chickpeas'}
            style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-subtle); border-radius: 4px; background: var(--bg-card); color: var(--text-body);"
          />
          <button type="button" onclick={handleSaveExtra} class="planner-btn-primary btn-brand" style="padding: 0.5rem 1rem; margin: 0;">
            {editingIndex !== null ? 'Save' : 'Add'}
          </button>
          {#if editingIndex !== null}
            <button type="button" onclick={handleCancelEdit} class="planner-btn-secondary" style="padding: 0.5rem 1rem; margin: 0; background: var(--font-controls-bg); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-body); cursor: pointer;">
              Cancel
            </button>
          {/if}
        </div>

        {#if parsedExtra && parsedExtra.item}
          <div id="extra-preview-container" style="display: flex; font-size: 0.8rem; background: var(--font-controls-bg); border: 1px dashed var(--border-subtle); padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 1rem; gap: 0.75rem; flex-wrap: wrap;">
            <div><strong>Qty:</strong> <span style="color: var(--noonblue); font-family: monospace;">{parsedExtra.qty !== undefined ? parsedExtra.qty.toString() : '—'}</span></div>
            <div><strong>Unit:</strong> <span style="color: var(--noonblue); font-family: monospace;">{parsedExtra.unit || '—'}</span></div>
            <div><strong>Desc:</strong> <span style="color: var(--noonblue); font-family: monospace;">{parsedExtra.desc || '—'}</span></div>
            <div><strong>Item:</strong> <span style="color: var(--noonblue); font-family: monospace;">{parsedExtra.item || '—'}</span></div>
            <div><strong>Prep:</strong> <span style="color: var(--noonblue); font-family: monospace;">{parsedExtra.prep || '—'}</span></div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

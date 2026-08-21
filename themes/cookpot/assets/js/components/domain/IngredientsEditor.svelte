<script lang="ts">
  import type { IngredientInput } from '../../types';
  import { parseRawUserInput } from '../../simple-parser';
  import { formatItemQuantity } from '../../units';
  import Icon from '../primitives/Icon.svelte';

  interface Props {
    /** The list of ingredient inputs to manage. */
    ingredients: IngredientInput[];
    /** Callback triggered when the ingredient list changes. */
    onChange: (next: IngredientInput[]) => void;
    /** Section title (defaults to "Sides & Extra Ingredients"). */
    title?: string;
    /** Optional empty state label. */
    emptyLabel?: string;
  }

  let {
    ingredients,
    onChange,
    title = 'Ingredients & Sides',
    emptyLabel = 'No ingredients or sides added yet.',
  }: Props = $props();

  let inputValue = $state('');
  let editingIndex = $state<number | null>(null);

  let parsedExtra = $derived.by(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return null;
    }
    return parseRawUserInput(trimmed);
  });

  function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    const parsed = parseRawUserInput(trimmed);
    if (!parsed || !parsed.item) {
      return;
    }

    const next = [...ingredients];
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < next.length) {
      next[editingIndex] = parsed;
    } else {
      next.push(parsed);
    }

    onChange(next);
    inputValue = '';
    editingIndex = null;
  }

  function handleRemove(idx: number) {
    const next = ingredients.filter((_, i) => i !== idx);
    if (editingIndex === idx) {
      editingIndex = null;
      inputValue = '';
    } else if (editingIndex !== null && editingIndex > idx) {
      editingIndex--;
    }
    onChange(next);
  }

  function handleEdit(idx: number) {
    const target = ingredients[idx];
    if (!target) {
      return;
    }

    const qtyStr =
      target.qty !== undefined && target.qty !== null
        ? `${Array.isArray(target.qty) ? target.qty[0] : target.qty} `
        : '';
    const unitStr = target.unit ? `${target.unit} ` : '';
    const descStr = target.desc ? `${target.desc} ` : '';
    const prepStr = target.prep ? `, ${target.prep}` : '';

    inputValue = `${qtyStr}${unitStr}${descStr}${target.item}${prepStr}`;
    editingIndex = idx;
  }

  function handleCancelEdit() {
    editingIndex = null;
    inputValue = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }
</script>

<div class="ingredients-editor">
  {#if title}
    <h4 class="editor-section-title">{title}</h4>
  {/if}

  {#if ingredients.length === 0}
    <div class="no-ingredients">{emptyLabel}</div>
  {:else}
    <ul class="ingredients-list">
      {#each ingredients as ing, idx}
        {@const qtyVal = ing.qty !== undefined ? (Array.isArray(ing.qty) ? ing.qty[0] : ing.qty) : null}
        {@const formatted = formatItemQuantity(qtyVal, ing.unit || '', ing.item, true)}
        {@const descStr = ing.desc ? ing.desc + ' ' : ''}
        {@const fullItem = `${descStr}${formatted.itemStr}${ing.prep ? `, ${ing.prep}` : ''}`}
        {@const isEditing = editingIndex === idx}
        <li class="ingredient-item" class:editing={isEditing}>
          <span>{formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{fullItem}</span>
          <div class="ingredient-actions">
            <button
              type="button"
              onclick={() => handleEdit(idx)}
              title="Edit ingredient"
              class="action-btn edit-btn"
            >
              <Icon name="edit" size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onclick={() => handleRemove(idx)}
              title="Remove ingredient"
              class="action-btn remove-btn"
            >
              ✕
            </button>
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
      placeholder={editingIndex !== null ? 'Edit ingredient...' : 'e.g. 1 can chickpeas'}
      class="ingredient-input"
    />
    <button type="button" onclick={handleSave} class="btn btn-brand save-btn">
      {editingIndex !== null ? 'Save' : 'Add'}
    </button>
    {#if editingIndex !== null}
      <button type="button" onclick={handleCancelEdit} class="btn btn-secondary cancel-btn">
        Cancel
      </button>
    {/if}
  </div>

  {#if parsedExtra && parsedExtra.item}
    <div class="preview-container">
      <div>
        <strong>Qty:</strong>
        <span class="preview-val">
          {parsedExtra.qty !== undefined ? parsedExtra.qty.toString() : '—'}
        </span>
      </div>
      <div>
        <strong>Unit:</strong>
        <span class="preview-val">{parsedExtra.unit || '—'}</span>
      </div>
      <div>
        <strong>Desc:</strong>
        <span class="preview-val">{parsedExtra.desc || '—'}</span>
      </div>
      <div>
        <strong>Item:</strong>
        <span class="preview-val">{parsedExtra.item || '—'}</span>
      </div>
      <div>
        <strong>Prep:</strong>
        <span class="preview-val">{parsedExtra.prep || '—'}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .ingredients-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .editor-section-title {
    margin: 0.5rem 0 0.25rem 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .no-ingredients {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
  }
  .ingredients-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .ingredient-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.65rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    font-size: 0.85rem;
    color: var(--text-body);
  }
  .ingredient-item.editing {
    border-color: var(--noonblue);
    background-color: rgba(43, 114, 230, 0.05);
  }
  .ingredient-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .action-btn:hover {
    color: var(--text-body);
  }
  .remove-btn:hover {
    color: var(--danger-color);
  }
  .controls-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .ingredient-input {
    flex-grow: 1;
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    background-color: var(--card-bg);
    color: var(--text-body);
    font-size: 0.85rem;
  }
  .save-btn,
  .cancel-btn {
    padding: 0.45rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
  }
  .preview-container {
    display: flex;
    gap: 0.75rem;
    padding: 0.4rem 0.65rem;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .preview-val {
    color: var(--noonblue);
    font-weight: 600;
  }
</style>

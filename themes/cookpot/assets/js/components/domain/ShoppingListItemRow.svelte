<script lang="ts">
  import type { ShoppingItem } from '../../types';
  import { formatItemQuantity, formatQty, abbreviateUnit } from '../../units';
  import { toSlug } from '../../pipelines/pipeline';

  interface Props {
    item: ShoppingItem;
    isChecked: boolean;
    onToggleChecked: (checked: boolean) => void;
    onToggleAlt?: (recipeShortId: string, altItemSlug: string) => void;
  }

  let { item, isChecked, onToggleChecked, onToggleAlt }: Props = $props();

  let formatted = $derived(formatItemQuantity(item.qty, item.unit, item.item));

  let descs = $derived.by(() => {
    const notes = item.note?.ingredientNotes ?? [];
    return notes
      .map((n) => n.descriptor?.trim())
      .filter((d): d is string => Boolean(d));
  });

  let universalDescriptor = $derived.by(() => {
    const notes = item.note?.ingredientNotes ?? [];
    if (notes.length === 0 || descs.length !== notes.length) {
      return undefined;
    }
    const first = descs[0];
    return descs.every((d) => d.toLowerCase() === first.toLowerCase())
      ? first
      : undefined;
  });

  function formatSubnoteQty(
    qty: number | null | undefined,
    unit?: string,
  ): string {
    if (qty === null || qty === undefined) {
      return '';
    }
    const qStr = formatQty(qty);
    const abbrev = unit ? abbreviateUnit(unit) : '';
    return abbrev ? `${qStr} ${abbrev}` : qStr;
  }
</script>

<li class="checklist-item" class:checked={isChecked}>
  <label class="checklist-item-label">
    <input
      type="checkbox"
      class="checklist-item-checkbox"
      data-item={item.item}
      checked={isChecked}
      onchange={(e) =>
        onToggleChecked((e.currentTarget as HTMLInputElement).checked)}
    />
    <div class="checklist-item-content">
      <span class="checklist-item-title">
        {formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{universalDescriptor
          ? universalDescriptor + ' '
          : ''}{formatted.itemStr}
      </span>

      {#if item.note?.sizeNote || (item.note?.ingredientNotes && item.note.ingredientNotes.length > 0)}
        <div class="checklist-item-details">
          {#if item.note?.sizeNote}
            <span class="checklist-item-note">{item.note.sizeNote}</span>
          {/if}

          {#if item.note?.ingredientNotes && item.note.ingredientNotes.length > 0}
            <ul class="checklist-item-subnotes">
              {#each item.note.ingredientNotes as note}
                <li class="checklist-subnote">
                  <span class="subnote-main">
                    {#if note.qty !== null && note.qty !== undefined}
                      <span class="subnote-qty"
                        >{formatSubnoteQty(note.qty, note.unit)}</span
                      >
                    {/if}
                    {#if note.descriptor && !universalDescriptor}
                      <span class="subnote-badge">[{note.descriptor}]</span>
                    {/if}
                    {#if note.recipe}
                      <span class="subnote-recipe">— {note.recipe}</span>
                    {/if}
                  </span>

                  {#if note.altItem && note.recipeShortId && onToggleAlt}
                    {@const altSlug = toSlug(note.altItem)}
                    <button
                      type="button"
                      class="btn-alt-swap"
                      onclick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (note.recipeShortId) {
                          onToggleAlt(note.recipeShortId, altSlug);
                        }
                      }}
                      title="Swap to {note.altItem}"
                    >
                      alt: {note.altItem} ⇄
                    </button>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>
  </label>
</li>

<style>
  .checklist-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    width: 100%;
  }

  .checklist-item-title {
    font-weight: 500;
  }

  .checklist-item-subnotes {
    list-style: none;
    padding-left: 0;
    margin: 0.25rem 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .checklist-subnote {
    font-size: 0.825rem;
    color: var(--text-muted, #373737);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .subnote-main {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .subnote-qty {
    font-weight: 600;
    color: var(--text-color, #222);
  }

  .subnote-badge {
    background: var(--tag-bg, #f1f3f5);
    color: var(--tag-text, #373737);
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    font-size: 0.775rem;
    font-weight: 500;
  }

  .subnote-recipe {
    color: var(--text-muted, #555);
  }

  .btn-alt-swap {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--noonblue, #00518c);
    background: var(--noonblue-bg-light, rgba(0, 81, 140, 0.08));
    border: 1px solid var(--noonblue-border-light, rgba(0, 81, 140, 0.3));
    border-radius: 12px;
    padding: 0.1rem 0.5rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .btn-alt-swap:hover {
    background: var(--noonblue-bg-hover, rgba(0, 81, 140, 0.15));
    border-color: var(--noonblue-border-hover, rgba(0, 81, 140, 0.6));
  }
</style>

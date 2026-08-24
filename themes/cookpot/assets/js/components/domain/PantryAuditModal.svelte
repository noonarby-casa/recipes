<script lang="ts">
  import Modal from '../primitives/Modal.svelte';
  import ToggleGroup, { type Option } from '../primitives/ToggleGroup.svelte';
  import type { ShoppingItem } from '../../types';
  import { getIngredientKey, isItemChecked } from '../../stores/shopping';
  import { formatItemQuantity, formatQty, abbreviateUnit } from '../../units';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: ShoppingItem[];
    checkedStates: Record<string, boolean>;
    onSetChecked: (key: string, checked: boolean) => void;
  }

  let { isOpen, onClose, items, checkedStates, onSetChecked }: Props = $props();

  type ScopeMode = 'staples' | 'all';

  let scopeMode = $state<ScopeMode>('staples');
  let currentIndex = $state(0);
  let isCompleted = $state(false);

  let stapleItems = $derived(
    items.filter((item) => item.staple === 'in-pantry'),
  );

  let hasStaples = $derived(stapleItems.length > 0);

  // Auto-switch scope to 'all' if there are no staples in the active plan
  $effect(() => {
    if (isOpen) {
      if (!hasStaples && items.length > 0) {
        scopeMode = 'all';
      } else {
        scopeMode = 'staples';
      }
      currentIndex = 0;
      isCompleted = false;
    }
  });

  let activeItems = $derived<ShoppingItem[]>(
    scopeMode === 'staples' ? stapleItems : items,
  );

  let totalItems = $derived(activeItems.length);

  let currentItem = $derived<ShoppingItem | undefined>(
    activeItems[currentIndex],
  );

  let currentItemKey = $derived<string>(
    currentItem ? getIngredientKey(currentItem.item) : '',
  );

  let currentIsChecked = $derived<boolean>(
    currentItem
      ? isItemChecked(
          currentItemKey,
          currentItem.staple === 'in-pantry',
          checkedStates,
        )
      : false,
  );

  let formattedCurrent = $derived.by(() => {
    if (!currentItem) {
      return { qtyStr: '', itemStr: '' };
    }
    return formatItemQuantity(
      currentItem.qty,
      currentItem.unit,
      currentItem.item,
    );
  });

  // Completion summary metrics
  let onHandItems = $derived(
    activeItems.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(item.item);
      return isItemChecked(key, isStaple, checkedStates);
    }),
  );

  let needToBuyItems = $derived(
    activeItems.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(item.item);
      return !isItemChecked(key, isStaple, checkedStates);
    }),
  );

  const scopeOptions: Option[] = $derived([
    {
      id: 'staples',
      label: `Pantry Staples (${stapleItems.length})`,
      disabled: !hasStaples,
    },
    {
      id: 'all',
      label: `All Items (${items.length})`,
    },
  ]);

  function handleScopeChange(id: string) {
    scopeMode = id as ScopeMode;
    currentIndex = 0;
    isCompleted = false;
  }

  function advance() {
    if (currentIndex + 1 < totalItems) {
      currentIndex += 1;
    } else {
      isCompleted = true;
    }
  }

  function handleHaveIt() {
    if (!currentItem) {
      return;
    }
    onSetChecked(currentItemKey, true);
    advance();
  }

  function handleNeedIt() {
    if (!currentItem) {
      return;
    }
    onSetChecked(currentItemKey, false);
    advance();
  }

  function handleSkip() {
    advance();
  }

  function handlePrevious() {
    if (isCompleted) {
      isCompleted = false;
      currentIndex = Math.max(0, totalItems - 1);
    } else if (currentIndex > 0) {
      currentIndex -= 1;
    }
  }

  function handleRestart() {
    currentIndex = 0;
    isCompleted = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) {
      return;
    }

    // Avoid interfering if focus is in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (!isCompleted && currentItem) {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleHaveIt();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNeedIt();
      } else if (e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleSkip();
      } else if (
        e.key === 'p' ||
        e.key === 'P' ||
        e.key === 'ArrowUp' ||
        e.key === 'Backspace'
      ) {
        if (currentIndex > 0) {
          e.preventDefault();
          handlePrevious();
        }
      }
    } else if (isCompleted && (e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      onClose();
    }
  }

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

<svelte:window onkeydown={handleKeydown} />

<Modal
  {isOpen}
  {onClose}
  title="Pantry & Stock Check"
  contentClass="pantry-audit-modal-content"
>
  <div class="audit-modal-wrapper">
    <!-- Scope Selector Bar -->
    <div class="audit-scope-bar">
      <ToggleGroup
        options={scopeOptions}
        selectedId={scopeMode}
        onChange={handleScopeChange}
        fullWidth
      />
    </div>

    {#if activeItems.length === 0}
      <div class="audit-empty-state">
        <span class="empty-icon">🥣</span>
        <p>No ingredients found for this scope.</p>
      </div>
    {:else if !isCompleted && currentItem}
      <!-- Progress Bar & Counter -->
      <div class="audit-progress-container">
        <div class="audit-progress-bar-bg">
          <div
            class="audit-progress-bar-fill"
            style="width: {((currentIndex + 1) / totalItems) * 100}%"
          ></div>
        </div>
        <div class="audit-progress-text">
          <span>Item {currentIndex + 1} of {totalItems}</span>
          <span class="audit-progress-pct"
            >{Math.round(((currentIndex + 1) / totalItems) * 100)}%</span
          >
        </div>
      </div>

      <!-- Main Item Card -->
      <div class="audit-item-card">
        <div class="audit-item-header">
          <span class="audit-category-badge">{currentItem.category}</span>
          <span
            class="audit-status-badge {currentIsChecked
              ? 'status-have'
              : 'status-need'}"
          >
            {currentIsChecked ? '✓ Currently: On Hand' : '🛒 Currently: To Buy'}
          </span>
        </div>

        <div class="audit-item-main">
          <h2 class="audit-item-title">
            {#if formattedCurrent.qtyStr}
              <span class="audit-item-qty">{formattedCurrent.qtyStr}</span>
            {/if}
            <span class="audit-item-name">{formattedCurrent.itemStr}</span>
          </h2>
        </div>

        <!-- Item Context & Recipe Notes -->
        {#if currentItem.note?.sizeNote || (currentItem.note?.ingredientNotes && currentItem.note.ingredientNotes.length > 0)}
          <div class="audit-notes-box">
            {#if currentItem.note.sizeNote}
              <div class="audit-size-note">{currentItem.note.sizeNote}</div>
            {/if}
            {#if currentItem.note.ingredientNotes && currentItem.note.ingredientNotes.length > 0}
              <ul class="audit-subnotes-list">
                {#each currentItem.note.ingredientNotes as note}
                  <li class="audit-subnote-row">
                    {#if note.qty !== null && note.qty !== undefined}
                      <span class="audit-subnote-qty"
                        >{formatSubnoteQty(note.qty, note.unit)}</span
                      >
                    {/if}
                    {#if note.descriptor}
                      <span class="audit-subnote-badge">[{note.descriptor}]</span>
                    {/if}
                    {#if note.recipe}
                      <span class="audit-subnote-recipe">for {note.recipe}</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Primary Decision Buttons -->
      <div class="audit-actions-grid">
        <button
          type="button"
          class="btn audit-action-btn audit-btn-need"
          onclick={handleNeedIt}
          title="Need to buy this item (Key: N or Left Arrow)"
        >
          <span class="action-icon">🛒</span>
          <div class="action-labels">
            <span class="action-main-text">Need It</span>
            <span class="action-subtext">Add to Buy List (N)</span>
          </div>
        </button>

        <button
          type="button"
          class="btn audit-action-btn audit-btn-have"
          onclick={handleHaveIt}
          title="Have this item on hand (Key: Y or Right Arrow)"
        >
          <span class="action-icon">✓</span>
          <div class="action-labels">
            <span class="action-main-text">Have It</span>
            <span class="action-subtext">On Hand (Y)</span>
          </div>
        </button>
      </div>

      <!-- Secondary Controls Bar -->
      <div class="audit-secondary-controls">
        <button
          type="button"
          class="btn btn-ghost btn-sm audit-prev-btn"
          disabled={currentIndex === 0}
          onclick={handlePrevious}
          title="Go back to previous item (Key: P or Up Arrow)"
        >
          ← Previous
        </button>

        <span class="audit-shortcut-hint">Keys: [← Need] [→ Have] [↓ Skip]</span>

        <button
          type="button"
          class="btn btn-ghost btn-sm audit-skip-btn"
          onclick={handleSkip}
          title="Leave current state and continue (Key: Space or Down Arrow)"
        >
          Skip →
        </button>
      </div>
    {:else if isCompleted}
      <!-- Completion Summary Screen -->
      <div class="audit-complete-card">
        <div class="complete-icon">🎉</div>
        <h2 class="complete-title">Pantry Check Complete!</h2>
        <p class="complete-subtitle">
          Your shopping list has been updated to reflect what's on hand.
        </p>

        <div class="complete-stats-row">
          <div class="stat-pill stat-have">
            <span class="stat-num">{onHandItems.length}</span>
            <span class="stat-label">On Hand</span>
          </div>
          <div class="stat-pill stat-need">
            <span class="stat-num">{needToBuyItems.length}</span>
            <span class="stat-label">Need to Buy</span>
          </div>
        </div>

        {#if needToBuyItems.length > 0}
          <div class="need-list-section">
            <span class="need-list-title">Added to your Buy List:</span>
            <ul class="need-items-tags">
              {#each needToBuyItems as item}
                <li class="need-item-tag">{item.item}</li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="need-list-section all-stocked">
            <span>✨ You're all stocked up on audited items!</span>
          </div>
        {/if}

        <div class="complete-actions">
          <button
            type="button"
            class="btn btn-brand complete-done-btn"
            onclick={onClose}
          >
            Done / View Shopping List
          </button>

          <div class="complete-secondary-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              onclick={handleRestart}
            >
              Restart Audit
            </button>
            {#if scopeMode === 'staples' && items.length > stapleItems.length}
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                onclick={() => handleScopeChange('all')}
              >
                Audit All Items ({items.length})
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style>
  :global(.pantry-audit-modal-content) {
    max-width: 580px;
    width: 92vw;
  }

  .audit-modal-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem 1.25rem 1.5rem;
    color: var(--text-color);
  }

  .audit-scope-bar {
    width: 100%;
  }

  .audit-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .audit-progress-container {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .audit-progress-bar-bg {
    width: 100%;
    height: 6px;
    background: var(--font-controls-bg);
    border-radius: 999px;
    overflow: hidden;
  }

  .audit-progress-bar-fill {
    height: 100%;
    background: var(--noonblue, #0080d8);
    border-radius: 999px;
    transition: width 0.25s ease-out;
  }

  .audit-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .audit-item-card {
    background: var(--recipe-title-bg, #f8fafc);
    border: 1px solid var(--border-subtle, #e2e8f0);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .audit-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .audit-category-badge {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: var(--font-controls-bg);
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
  }

  .audit-status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
  }

  .audit-status-badge.status-have {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success-color, #10b981);
  }

  .audit-status-badge.status-need {
    background: rgba(249, 115, 22, 0.12);
    color: var(--warning-color, #f97316);
  }

  .audit-item-main {
    margin: 0.25rem 0;
  }

  .audit-item-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
    line-height: 1.3;
    color: var(--text-title, var(--text-color));
  }

  .audit-item-qty {
    color: var(--noonblue, #0080d8);
    margin-right: 0.35rem;
  }

  .audit-notes-box {
    background: var(--bg-color, #ffffff);
    border: 1px solid var(--border-ultra-subtle, #cbd5e1);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .audit-size-note {
    font-weight: 600;
    color: var(--text-color);
  }

  .audit-subnotes-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .audit-subnote-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .audit-subnote-qty {
    font-weight: 600;
    color: var(--text-color);
  }

  .audit-subnote-badge {
    background: var(--font-controls-bg);
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .audit-subnote-recipe {
    font-style: italic;
  }

  .audit-actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .audit-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 0.75rem;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    transition: all 0.15s ease-in-out;
  }

  .audit-btn-need {
    background: var(--card-bg, #ffffff);
    border: 2px solid var(--warning-color, #f97316);
    color: var(--warning-color, #f97316);
  }

  .audit-btn-need:hover {
    background: rgba(249, 115, 22, 0.1);
  }

  .audit-btn-have {
    background: var(--success-color, #10b981);
    border: 2px solid var(--success-color, #10b981);
    color: #ffffff;
  }

  .audit-btn-have:hover {
    background: var(--success-color-hover, #059669);
    border-color: var(--success-color-hover, #059669);
  }

  .action-icon {
    font-size: 1.3rem;
  }

  .action-labels {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .action-main-text {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .action-subtext {
    font-size: 0.72rem;
    font-weight: 500;
    opacity: 0.85;
  }

  .audit-secondary-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.25rem;
  }

  .audit-shortcut-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .audit-complete-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem 0;
    gap: 1rem;
  }

  .complete-icon {
    font-size: 2.5rem;
  }

  .complete-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-title, var(--text-color));
  }

  .complete-subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .complete-stats-row {
    display: flex;
    gap: 1.5rem;
    margin: 0.5rem 0;
  }

  .stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    min-width: 100px;
  }

  .stat-pill.stat-have {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color, #10b981);
  }

  .stat-pill.stat-need {
    background: rgba(249, 115, 22, 0.1);
    color: var(--warning-color, #f97316);
  }

  .stat-num {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .need-list-section {
    width: 100%;
    text-align: left;
    background: var(--recipe-title-bg, #f8fafc);
    border: 1px solid var(--border-subtle, #e2e8f0);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .need-list-section.all-stocked {
    text-align: center;
    color: var(--success-color, #10b981);
    font-weight: 600;
  }

  .need-list-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .need-items-tags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .need-item-tag {
    background: var(--bg-color, #ffffff);
    border: 1px solid var(--warning-color, #f97316);
    color: var(--text-color);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  .complete-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .complete-done-btn {
    width: 100%;
    padding: 0.85rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 8px;
  }

  .complete-secondary-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    .audit-actions-grid {
      grid-template-columns: 1fr;
    }

    .audit-shortcut-hint {
      display: none;
    }
  }
</style>

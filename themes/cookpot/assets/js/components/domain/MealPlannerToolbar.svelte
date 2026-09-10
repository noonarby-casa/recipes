<script lang="ts">
  import ToggleGroup from '../primitives/ToggleGroup.svelte';
  import Icon from '../primitives/Icon.svelte';
  import DateRangePicker from './DateRangePicker.svelte';
  import MonthYearPicker from './MonthYearPicker.svelte';

  interface Props {
    /** Currently active tab ('edit', 'view', 'shop', or 'history'). */
    activeTab: 'edit' | 'view' | 'shop' | 'history';
    /** Start date string ISO 'YYYY-MM-DD'. */
    startDate: string;
    /** Duration in days (1..21). */
    durationDays: number;
    /** Total number of items in shopping list. */
    shoppingCount?: number;
    /** Whether at least one meal is currently scheduled in the plan. */
    hasPlan?: boolean;
    /** Label text for copy menu button (e.g. 'Copy Menu' or 'Copied!'). */
    copyMenuLabel?: string;
    /** Year for history view. */
    historyYear?: number;
    /** Month (0-indexed) for history view. */
    historyMonth?: number;
    /** KB used for history storage. */
    storageKb?: number;
    /** Storage percentage used. */
    storagePercent?: number;
    /** Total meals logged in current month. */
    totalMonthMeals?: number;

    /** Whether any custom checkbox overrides exist. */
    hasCustomChecks?: boolean;

    // Event callbacks
    onTabChange?: (tab: 'edit' | 'view' | 'shop' | 'history') => void;
    onRangeChange?: (startDate: string, durationDays: number) => void;
    onAdjustPortions?: (delta: number) => void;
    onOpenFilters?: () => void;
    onGenerateDinnerPlan?: () => void;
    onClearPlan?: () => void;
    onSharePlan?: () => void;
    onExportList?: () => void;
    onCopyMenu?: () => void;
    onResetCheckboxes?: () => void;
    onOpenPantryAudit?: () => void;
    onPrevHistoryMonth?: () => void;
    onNextHistoryMonth?: () => void;
    onJumpHistoryToday?: () => void;
    onSelectHistoryMonthYear?: (year: number, month: number) => void;
    onOpenStorageModal?: () => void;
    onJumpActivePlan?: () => void;
  }

  let {
    activeTab,
    startDate,
    durationDays,
    shoppingCount = 0,
    hasPlan = false,
    copyMenuLabel = 'Copy Menu',
    historyYear = new Date().getFullYear(),
    historyMonth = new Date().getMonth(),
    storageKb = 0,
    storagePercent = 0,
    totalMonthMeals = 1,
    hasCustomChecks = false,
    onTabChange,
    onRangeChange,
    onAdjustPortions,
    onOpenFilters,
    onGenerateDinnerPlan,
    onClearPlan,
    onSharePlan,
    onExportList,
    onCopyMenu,
    onResetCheckboxes,
    onOpenPantryAudit,
    onPrevHistoryMonth,
    onNextHistoryMonth,
    onJumpHistoryToday,
    onSelectHistoryMonthYear,
    onOpenStorageModal,
    onJumpActivePlan,
  }: Props = $props();
</script>

<div class="planner-unified-toolbar">
  <!-- Primary Row: Mode Switcher & Contextual Navigation/Controls -->
  <div class="toolbar-primary-row">
    <div class="mode-toggle-group">
      <ToggleGroup
        options={[
          { id: 'view', label: 'View', idAttr: 'mode-view-btn' },
          { id: 'edit', label: 'Edit', idAttr: 'mode-edit-btn' },
          {
            id: 'shop',
            label:
              `Shop` +
              (shoppingCount > 0 ? ` (${shoppingCount})` : ''),
            idAttr: 'mode-shop-btn',
          },
          { id: 'history', label: 'History', idAttr: 'mode-history-btn' },
        ]}
        selectedId={activeTab}
        onChange={(id) =>
          onTabChange?.(id as 'edit' | 'view' | 'shop' | 'history')}
      />
    </div>

    <div class="toolbar-primary-context">
      {#if activeTab === 'view' || activeTab === 'edit'}
        <div class="date-picker-toolbar-wrapper">
          <DateRangePicker
            {startDate}
            {durationDays}
            onChangeRange={(s, d) => onRangeChange?.(s, d)}
          />
        </div>
      {:else if activeTab === 'history'}
        <div class="history-left-controls">
          <MonthYearPicker
            year={historyYear}
            month={historyMonth}
            onChangeMonthYear={(y, m) => onSelectHistoryMonthYear?.(y, m)}
            onPrevMonth={() => onPrevHistoryMonth?.()}
            onNextMonth={() => onNextHistoryMonth?.()}
            onJumpToday={() => onJumpHistoryToday?.()}
          />
          {#if totalMonthMeals === 0}
            <button
              type="button"
              class="history-empty-alert-pill"
              onclick={() => onJumpActivePlan?.()}
            >
              🗓️ Empty Month — Plan Now
            </button>
          {/if}
        </div>
      {:else if activeTab === 'shop'}
        <div class="shop-primary-actions">
          <button
            type="button"
            id="btn-check-pantry"
            class="btn btn-brand"
            disabled={shoppingCount === 0}
            onclick={() => onOpenPantryAudit?.()}
            title="Audit pantry staples and ingredients on hand"
          >
            Check Pantry
          </button>
          <button
            type="button"
            id="btn-copy-combined-list"
            class="btn btn-secondary"
            onclick={() => onExportList?.()}
          >
            Export List...
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Secondary Context Actions Row -->
  <div
    class="toolbar-secondary-row"
    class:visible={activeTab === 'edit'}
    id="toolbar-edit"
  >
    <div class="global-scaler-panel" id="global-scaler-panel">
      <span class="global-scaler-label">Adjust Servings</span>
      <div class="servings-picker">
        <button
          type="button"
          class="servings-btn"
          id="global-dec-btn"
          title="Scale down all recipe servings by 1"
          onclick={() => onAdjustPortions?.(-1)}
        >
          -
        </button>
        <span class="servings-val" id="global-scaler-indicator">
          {hasPlan ? 'Servings' : '—'}
        </span>
        <button
          type="button"
          class="servings-btn"
          id="global-inc-btn"
          title="Scale up all recipe servings by 1"
          onclick={() => onAdjustPortions?.(1)}
        >
          +
        </button>
      </div>
    </div>

    <div class="planner-top-actions">
      <button
        type="button"
        id="btn-toggle-filters"
        class="btn btn-secondary"
        onclick={() => onOpenFilters?.()}
      >
        <Icon name="filter" size={14} strokeWidth={2.5} />
        Filters
      </button>
      <button
        type="button"
        id="btn-generate-plan"
        class="btn btn-brand"
        onclick={() => onGenerateDinnerPlan?.()}
      >
        <Icon name="dice" size={14} strokeWidth={2.5} />
        Generate Dinner Plan
      </button>
      <button
        type="button"
        id="btn-clear-plan"
        class="planner-clear-btn"
        title="Clear recipes from the active date window"
        onclick={() => onClearPlan?.()}
      >
        Clear Range
      </button>
    </div>
  </div>

  <div
    class="toolbar-secondary-row"
    class:visible={activeTab === 'view'}
    id="toolbar-view"
  >
    <div class="toolbar-spacer"></div>
    <div class="planner-top-actions">
      <button
        type="button"
        id="btn-share-plan"
        class="btn btn-secondary"
        onclick={() => onSharePlan?.()}
      >
        Share Plan
      </button>
    </div>
  </div>

  <div
    class="toolbar-secondary-row"
    class:visible={activeTab === 'shop'}
    id="toolbar-shop"
  >
    <div class="toolbar-spacer"></div>
    <div class="shop-secondary-actions">
      <button
        type="button"
        id="btn-copy-menu-text"
        class="btn btn-secondary"
        title="Copy weekly menu as plain text"
        onclick={() => onCopyMenu?.()}
      >
        {copyMenuLabel}
      </button>
      {#if hasCustomChecks}
        <button
          type="button"
          class="planner-clear-btn"
          id="btn-reset-shopping-list"
          title="Reset checkboxes"
          onclick={() => onResetCheckboxes?.()}
        >
          Reset Checkboxes
        </button>
      {/if}
    </div>
  </div>

  <div
    class="toolbar-secondary-row"
    class:visible={activeTab === 'history'}
    id="toolbar-history"
  >
    <div class="toolbar-spacer"></div>
    <div class="planner-top-actions">
      <button
        type="button"
        class="history-storage-toolbar-btn"
        title="View Storage & Backup Details"
        onclick={() => onOpenStorageModal?.()}
      >
        💾 {storageKb} KB ({storagePercent}%)
      </button>

      <button
        type="button"
        class="history-active-shortcut-btn"
        onclick={() => onJumpActivePlan?.()}
      >
        Jump to Active Plan View →
      </button>
    </div>
  </div>
</div>

<style>
  .planner-unified-toolbar {
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    margin-top: 0.5rem;
    padding: 0.5rem 0.85rem;
  }

  @media (min-width: 768px) {
    .planner-unified-toolbar {
      box-sizing: border-box;
      min-height: 82px;
    }

    .toolbar-primary-row {
      min-height: 34px;
    }

    .toolbar-secondary-row {
      min-height: 32px;
    }
  }

  .toolbar-primary-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
  }

  .toolbar-primary-context {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .toolbar-secondary-row {
    align-items: center;
    border-top: 1px solid var(--border-ultra-subtle);
    display: none;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
    padding-top: 0.4rem;
  }

  .toolbar-secondary-row.visible {
    display: flex;
  }

  .toolbar-spacer {
    flex: 1;
  }

  .planner-top-actions,
  .shop-primary-actions,
  .shop-secondary-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  :global(.planner-unified-toolbar .btn),
  :global(.planner-unified-toolbar .planner-clear-btn) {
    align-items: center;
    box-sizing: border-box;
    display: inline-flex;
    font-size: 0.8rem;
    height: 32px;
    justify-content: center;
    padding: 0 0.75rem;
  }

  .global-scaler-panel {
    align-items: center;
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 8px;
    box-sizing: border-box;
    display: inline-flex;
    gap: 0.5rem;
    height: 32px;
    padding: 2px 0.5rem 2px 2px;
  }

  .global-scaler-panel :global(.servings-picker) {
    height: 26px;
  }

  .global-scaler-panel :global(.servings-btn) {
    font-size: 0.85rem;
    height: 24px;
    width: 24px;
  }

  .global-scaler-label {
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding-left: 0.4rem;
    text-transform: uppercase;
  }

  .history-left-controls {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .history-empty-alert-pill {
    align-items: center;
    background: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue-border-light);
    border-radius: 8px;
    color: var(--noonblue);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.8rem;
    font-weight: 600;
    height: 32px;
    padding: 0 0.65rem;
    transition: all 0.2s ease;
  }

  .history-empty-alert-pill:hover {
    background: var(--noonblue);
    color: #ffffff;
  }

  .history-storage-toolbar-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.8rem;
    font-weight: 600;
    height: 32px;
    padding: 0 0.65rem;
    transition: all 0.2s ease;
  }

  .history-storage-toolbar-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .history-active-shortcut-btn {
    align-items: center;
    background: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue);
    border-radius: 8px;
    color: var(--noonblue);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.8rem;
    font-weight: 600;
    height: 32px;
    padding: 0 0.75rem;
    transition: all 0.2s ease;
  }

  .history-active-shortcut-btn:hover {
    background: var(--noonblue);
    color: #ffffff;
  }

  @media (max-width: 767px) {
    .toolbar-primary-row,
    .toolbar-secondary-row {
      gap: 0.5rem;
      justify-content: center;
    }
  }
</style>

<script lang="ts">
  import ToggleGroup from '../primitives/ToggleGroup.svelte';
  import FilterIcon from '../primitives/icons/FilterIcon.svelte';
  import DiceIcon from '../primitives/icons/DiceIcon.svelte';
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
    onPrevHistoryMonth,
    onNextHistoryMonth,
    onJumpHistoryToday,
    onSelectHistoryMonthYear,
    onOpenStorageModal,
    onJumpActivePlan,
  }: Props = $props();
</script>

<div class="meal-planner-toolbar-container">
  <!-- Mode Selector Header Row -->
  <div class="planner-mode-header">
    <div class="mode-toggle-group">
      <ToggleGroup
        options={[
          { id: 'view', label: 'View Plan', idAttr: 'mode-view-btn' },
          { id: 'edit', label: 'Edit Plan', idAttr: 'mode-edit-btn' },
          {
            id: 'shop',
            label:
              `Shopping List` +
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
  </div>

  <!-- Edit Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'edit'}
    id="toolbar-edit"
  >
    <div class="date-picker-toolbar-wrapper">
      <DateRangePicker
        {startDate}
        {durationDays}
        onChangeRange={(s, d) => onRangeChange?.(s, d)}
      />
    </div>

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
        <FilterIcon size={14} strokeWidth={2.5} />
        Filters
      </button>
      <button
        type="button"
        id="btn-generate-plan"
        class="btn btn-brand"
        onclick={() => onGenerateDinnerPlan?.()}
      >
        <DiceIcon size={14} strokeWidth={2.5} />
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

  <!-- View Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'view'}
    id="toolbar-view"
  >
    <div class="date-picker-toolbar-wrapper">
      <DateRangePicker
        {startDate}
        {durationDays}
        onChangeRange={(s, d) => onRangeChange?.(s, d)}
      />
    </div>

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

  <!-- Shop Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'shop'}
    id="toolbar-shop"
  >
    <div class="planner-top-actions">
      <button
        type="button"
        id="btn-copy-combined-list"
        class="btn btn-secondary"
        onclick={() => onExportList?.()}
      >
        Export List...
      </button>
      <button
        type="button"
        id="btn-copy-menu-text"
        class="btn btn-secondary"
        title="Copy weekly menu as plain text"
        onclick={() => onCopyMenu?.()}
      >
        {copyMenuLabel}
      </button>
      <button
        type="button"
        class="planner-clear-btn"
        id="btn-reset-shopping-list"
        title="Reset checkboxes"
        onclick={() => onResetCheckboxes?.()}
      >
        Reset Checkboxes
      </button>
    </div>
  </div>

  <!-- History Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'history'}
    id="toolbar-history"
  >
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
  .planner-mode-header {
    align-items: center;
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem 1.25rem;
  }

  .planner-controls-toolbar {
    align-items: center;
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: none;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1.25rem;
  }

  .planner-controls-toolbar.visible {
    display: flex;
  }

  .planner-top-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .global-scaler-panel {
    align-items: center;
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 10px;
    display: inline-flex;
    gap: 0.75rem;
    padding: 3px 0.75rem 3px 3px;
  }

  .global-scaler-label {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding-left: 0.5rem;
    text-transform: uppercase;
  }



  .history-left-controls {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .history-empty-alert-pill {
    align-items: center;
    background: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue-border-light);
    border-radius: 8px;
    color: var(--noonblue);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.825rem;
    font-weight: 600;
    height: 36px;
    padding: 0 0.75rem;
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
    font-size: 0.825rem;
    font-weight: 600;
    height: 36px;
    padding: 0 0.75rem;
    transition: all 0.2s ease;
  }

  .history-storage-toolbar-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .history-active-shortcut-btn {
    background: var(--noonblue-bg-light);
    border: 1px solid var(--noonblue);
    border-radius: 8px;
    color: var(--noonblue);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.45rem 0.85rem;
    transition: all 0.2s ease;
  }

  .history-active-shortcut-btn:hover {
    background: var(--noonblue);
    color: #ffffff;
  }

  @media (max-width: 767px) {
    .planner-controls-toolbar {
      gap: 0.75rem;
      justify-content: center;
    }
  }
</style>

<script lang="ts">
  import ToggleGroup from '../primitives/ToggleGroup.svelte';
  import FilterIcon from '../primitives/icons/FilterIcon.svelte';
  import DiceIcon from '../primitives/icons/DiceIcon.svelte';

  interface Props {
    /** Currently active tab ('edit', 'view', or 'shop'). */
    activeTab: 'edit' | 'view' | 'shop';
    /** Whether 5-day work week mode is enabled. */
    workWeekOnly: boolean;
    /** Total number of items in shopping list. */
    shoppingCount?: number;
    /** Whether at least one meal is currently scheduled in the plan. */
    hasPlan?: boolean;
    /** Label text for copy menu button (e.g. 'Copy Menu' or 'Copied!'). */
    copyMenuLabel?: string;

    // Event callbacks
    onTabChange?: (tab: 'edit' | 'view' | 'shop') => void;
    onWorkWeekChange?: (workWeekOnly: boolean) => void;
    onAdjustPortions?: (delta: number) => void;
    onOpenFilters?: () => void;
    onGenerateDinnerPlan?: () => void;
    onClearPlan?: () => void;
    onSharePlan?: () => void;
    onExportList?: () => void;
    onCopyMenu?: () => void;
    onResetCheckboxes?: () => void;
  }

  let {
    activeTab,
    workWeekOnly,
    shoppingCount = 0,
    hasPlan = false,
    copyMenuLabel = 'Copy Menu',
    onTabChange,
    onWorkWeekChange,
    onAdjustPortions,
    onOpenFilters,
    onGenerateDinnerPlan,
    onClearPlan,
    onSharePlan,
    onExportList,
    onCopyMenu,
    onResetCheckboxes
  }: Props = $props();
</script>

<div class="meal-planner-toolbar-container">
  <!-- Mode Selector Header Row -->
  <div class="planner-mode-header">
    <div class="mode-toggle-group">
      <ToggleGroup
        options={[
          { id: 'edit', label: 'Edit Plan', idAttr: 'mode-edit-btn' },
          { id: 'view', label: 'View Plan', idAttr: 'mode-view-btn' },
          {
            id: 'shop',
            label: `Shopping List` + (shoppingCount > 0 ? ` (${shoppingCount})` : ''),
            idAttr: 'mode-shop-btn',
          },
        ]}
        selectedId={activeTab}
        onChange={(id) => onTabChange?.(id as 'edit' | 'view' | 'shop')}
      />
    </div>
  </div>

  <!-- Edit Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'edit'}
    id="toolbar-edit"
  >
    <div class="week-toggle-group" id="week-toggle-group">
      <ToggleGroup
        options={[
          { id: '7day', label: '7-Day Week', idAttr: 'week-7day-btn' },
          { id: '5day', label: '5-Day Week', idAttr: 'week-5day-btn' },
        ]}
        selectedId={workWeekOnly ? '5day' : '7day'}
        onChange={(id) => onWorkWeekChange?.(id === '5day')}
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
        onclick={() => onClearPlan?.()}
      >
        Clear Plan
      </button>
    </div>
  </div>

  <!-- View Toolbar -->
  <div
    class="planner-controls-toolbar"
    class:visible={activeTab === 'view'}
    id="toolbar-view"
  >
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

  @media (max-width: 767px) {
    .planner-controls-toolbar {
      gap: 0.75rem;
      justify-content: center;
    }
  }
</style>

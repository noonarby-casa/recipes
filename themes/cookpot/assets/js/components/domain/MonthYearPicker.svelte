<script lang="ts">
  interface Props {
    year: number;
    month: number; // 0-indexed (0 = Jan, 11 = Dec)
    onChangeMonthYear: (year: number, month: number) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onJumpToday: () => void;
  }

  let {
    year,
    month,
    onChangeMonthYear,
    onPrevMonth,
    onNextMonth,
    onJumpToday,
  }: Props = $props();

  let isOpen = $state(false);

  // Independent year state for popover
  let pickerYear = $state(2026);

  const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  let displayLabel = $derived(
    new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  function togglePopover() {
    if (!isOpen) {
      pickerYear = year;
    }
    isOpen = !isOpen;
  }

  function selectMonth(selectedMonthIdx: number) {
    onChangeMonthYear(pickerYear, selectedMonthIdx);
    isOpen = false;
  }

  function stepYear(delta: number) {
    pickerYear += delta;
  }
</script>

<div class="month-year-picker-container">
  <div class="month-stepper-wrapper">
    <button
      type="button"
      class="history-nav-btn"
      title="Previous Month"
      onclick={onPrevMonth}
    >
      ‹
    </button>

    <button
      type="button"
      class="month-year-display-btn"
      class:active={isOpen}
      onclick={togglePopover}
    >
      <span class="month-year-label">{displayLabel}</span>
      <span class="month-picker-caret">▾</span>
    </button>

    <button
      type="button"
      class="history-nav-btn"
      title="Next Month"
      onclick={onNextMonth}
    >
      ›
    </button>

    <button type="button" class="history-today-btn" onclick={onJumpToday}>
      Today
    </button>
  </div>

  {#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="month-picker-backdrop" onclick={() => (isOpen = false)}></div>

    <div class="month-year-popover">
      <!-- Year Selector Toggle Row -->
      <div class="year-selector-row">
        <button
          type="button"
          class="year-step-btn"
          title="Previous Year"
          onclick={() => stepYear(-1)}
        >
          ‹
        </button>
        <span class="year-display-text">{pickerYear}</span>
        <button
          type="button"
          class="year-step-btn"
          title="Next Year"
          onclick={() => stepYear(1)}
        >
          ›
        </button>
      </div>

      <!-- 12 Months Grid -->
      <div class="months-grid-3x4">
        {#each MONTH_NAMES as monthName, mIdx}
          <button
            type="button"
            class="month-cell-btn"
            class:selected={mIdx === month && pickerYear === year}
            onclick={() => selectMonth(mIdx)}
          >
            {monthName}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .month-year-picker-container {
    position: relative;
  }

  .month-stepper-wrapper {
    align-items: center;
    display: inline-flex;
    gap: 0.5rem;
  }

  .history-nav-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.2rem;
    font-weight: 700;
    height: 36px;
    justify-content: center;
    transition: all 0.2s ease;
    width: 36px;
  }

  .history-nav-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .month-year-display-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.05rem;
    font-weight: 700;
    gap: 0.5rem;
    height: 36px;
    padding: 0 0.85rem;
    transition: all 0.2s ease;
  }

  .month-year-display-btn:hover,
  .month-year-display-btn.active {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .month-picker-caret {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .history-today-btn {
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.4rem 0.75rem;
    transition: all 0.2s ease;
  }

  .history-today-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .month-picker-backdrop {
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 998;
  }

  .month-year-popover {
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    left: 0;
    padding: 1rem;
    position: absolute;
    top: calc(100% + 8px);
    width: 260px;
    z-index: 999;
  }

  .year-selector-row {
    align-items: center;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .year-step-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.1rem;
    font-weight: 700;
    height: 30px;
    justify-content: center;
    transition: all 0.2s ease;
    width: 30px;
  }

  .year-step-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .year-display-text {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .months-grid-3x4 {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, 1fr);
  }

  .month-cell-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    font-size: 0.85rem;
    font-weight: 600;
    height: 36px;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .month-cell-btn:hover {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .month-cell-btn.selected {
    background: var(--noonblue) !important;
    border-color: var(--noonblue) !important;
    color: #ffffff !important;
    font-weight: 700;
  }
</style>

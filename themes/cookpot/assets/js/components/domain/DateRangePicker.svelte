<script lang="ts">
  import {
    addDays,
    formatDateRangeLabel,
    formatIsoDate,
    getCalendarMonthMatrix,
    getMondayOfWeek,
    parseIsoDate,
  } from '../../utils/dates';

  interface Props {
    startDate: string; // ISO 'YYYY-MM-DD'
    durationDays: number; // 1 to 21
    onChangeRange: (startDate: string, durationDays: number) => void;
  }

  let { startDate, durationDays, onChangeRange }: Props = $props();

  let isOpen = $state(false);

  // Popover calendar navigation state
  let viewYear = $state(new Date().getFullYear());
  let viewMonth = $state(new Date().getMonth()); // 0-indexed

  $effect(() => {
    const currentStart = parseIsoDate(startDate);
    viewYear = currentStart.getFullYear();
    viewMonth = currentStart.getMonth();
  });

  // Selection state while selecting in popover
  let selectingStart = $state<string | null>(null);
  let hoveringDate = $state<string | null>(null);

  let currentLabel = $derived(formatDateRangeLabel(startDate, durationDays));

  // Compute 2 consecutive months for popover view
  let month1Matrix = $derived(getCalendarMonthMatrix(viewYear, viewMonth));
  let month1Name = $derived(
    new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  let month2Date = $derived(new Date(viewYear, viewMonth + 1, 1));
  let month2Year = $derived(month2Date.getFullYear());
  let month2Month = $derived(month2Date.getMonth());
  let month2Matrix = $derived(getCalendarMonthMatrix(month2Year, month2Month));
  let month2Name = $derived(
    month2Date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  function prevMonth() {
    if (viewMonth === 0) {
      viewYear -= 1;
      viewMonth = 11;
    } else {
      viewMonth -= 1;
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewYear += 1;
      viewMonth = 0;
    } else {
      viewMonth += 1;
    }
  }

  function stepRange(direction: -1 | 1) {
    const start = parseIsoDate(startDate);
    const shift = direction * durationDays;
    const newStart = addDays(start, shift);
    onChangeRange(formatIsoDate(newStart), durationDays);
  }

  function togglePopover() {
    if (!isOpen) {
      const currentStart = parseIsoDate(startDate);
      viewYear = currentStart.getFullYear();
      viewMonth = currentStart.getMonth();
      selectingStart = null;
      hoveringDate = null;
    }
    isOpen = !isOpen;
  }

  function handleDateClick(dateObj: Date) {
    const clickedIso = formatIsoDate(dateObj);

    if (!selectingStart) {
      // First click: select Start Date
      selectingStart = clickedIso;
      hoveringDate = clickedIso;
    } else {
      // Second click: select End Date
      const d1 = parseIsoDate(selectingStart);
      const d2 = dateObj;

      let start = d1;
      let end = d2;
      if (d2 < d1) {
        start = d2;
        end = d1;
      }

      const diffMs = end.getTime() - start.getTime();
      let days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      if (days > 21) {
        days = 21; // Cap at 21 days
      }

      onChangeRange(formatIsoDate(start), days);
      selectingStart = null;
      hoveringDate = null;
      isOpen = false;
    }
  }

  function isDateSelected(dateObj: Date): boolean {
    const iso = formatIsoDate(dateObj);
    if (selectingStart) {
      return iso === selectingStart;
    }
    const sequence = getActiveRangeSequence();
    return sequence.includes(iso);
  }

  function isDateInRange(dateObj: Date): boolean {
    const iso = formatIsoDate(dateObj);

    if (selectingStart && hoveringDate) {
      const d1 = parseIsoDate(selectingStart);
      const dHover = parseIsoDate(hoveringDate);

      let start = d1;
      let end = dHover;
      if (dHover < d1) {
        start = dHover;
        end = d1;
      }

      const current = dateObj;
      const diffMs = end.getTime() - start.getTime();
      const capDays = Math.min(
        Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1,
        21,
      );

      const capEnd = addDays(start, capDays - 1);
      return current >= start && current <= capEnd;
    }

    const sequence = getActiveRangeSequence();
    return sequence.includes(iso);
  }

  function getActiveRangeSequence(): string[] {
    const start = parseIsoDate(startDate);
    const seq: string[] = [];
    for (let i = 0; i < durationDays; i++) {
      seq.push(formatIsoDate(addDays(start, i)));
    }
    return seq;
  }
</script>

<div class="date-range-picker-container">
  <div class="date-stepper-wrapper">
    <button
      type="button"
      class="range-stepper-btn"
      title="Previous period"
      onclick={() => stepRange(-1)}
    >
      ‹
    </button>
    <button
      type="button"
      class="range-display-btn"
      class:active={isOpen}
      onclick={togglePopover}
    >
      <span class="calendar-icon">🗓️</span>
      <span class="range-label">{currentLabel}</span>
      <span class="dropdown-caret">▾</span>
    </button>
    <button
      type="button"
      class="range-stepper-btn"
      title="Next period"
      onclick={() => stepRange(1)}
    >
      ›
    </button>
  </div>

  {#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="popover-backdrop" onclick={() => (isOpen = false)}></div>

    <div class="date-picker-popover">
      <div class="popover-header">
        <span class="popover-instruction">
          {#if !selectingStart}
            Select <strong>Start Date</strong>
          {:else}
            Select <strong>End Date</strong> (up to 21 days)
          {/if}
        </span>
        <div class="popover-month-nav">
          <button type="button" class="month-nav-btn" onclick={prevMonth}>
            ‹
          </button>
          <button type="button" class="month-nav-btn" onclick={nextMonth}>
            ›
          </button>
        </div>
      </div>

      <div class="months-grid">
        <!-- Month 1 -->
        <div class="month-block">
          <div class="month-title">{month1Name}</div>
          <div class="day-names-row">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span
              >Th</span
            ><span>Fr</span><span>Sa</span>
          </div>
          <div class="month-matrix">
            {#each month1Matrix as row}
              <div class="matrix-row">
                {#each row as cell}
                  {#if cell}
                    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                    <button
                      type="button"
                      class="calendar-cell-btn"
                      class:selected={isDateSelected(cell)}
                      class:in-range={isDateInRange(cell)}
                      onmouseover={() => (hoveringDate = formatIsoDate(cell))}
                      onclick={() => handleDateClick(cell)}
                    >
                      {cell.getDate()}
                    </button>
                  {:else}
                    <span class="cell-empty"></span>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        </div>

        <!-- Month 2 -->
        <div class="month-block">
          <div class="month-title">{month2Name}</div>
          <div class="day-names-row">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span
              >Th</span
            ><span>Fr</span><span>Sa</span>
          </div>
          <div class="month-matrix">
            {#each month2Matrix as row}
              <div class="matrix-row">
                {#each row as cell}
                  {#if cell}
                    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                    <button
                      type="button"
                      class="calendar-cell-btn"
                      class:selected={isDateSelected(cell)}
                      class:in-range={isDateInRange(cell)}
                      onmouseover={() => (hoveringDate = formatIsoDate(cell))}
                      onclick={() => handleDateClick(cell)}
                    >
                      {cell.getDate()}
                    </button>
                  {:else}
                    <span class="cell-empty"></span>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="popover-footer">
        <div class="preset-pills">
          <button
            type="button"
            class="preset-pill"
            onclick={() => {
              const start = formatIsoDate(getMondayOfWeek());
              onChangeRange(start, 5);
              isOpen = false;
            }}
          >
            This Workweek (5d)
          </button>
          <button
            type="button"
            class="preset-pill"
            onclick={() => {
              const start = formatIsoDate(getMondayOfWeek());
              onChangeRange(start, 7);
              isOpen = false;
            }}
          >
            Full Week (7d)
          </button>
          <button
            type="button"
            class="preset-pill"
            onclick={() => {
              const start = formatIsoDate(getMondayOfWeek());
              onChangeRange(start, 14);
              isOpen = false;
            }}
          >
            2 Weeks (14d)
          </button>
          <button
            type="button"
            class="preset-pill"
            onclick={() => {
              const start = formatIsoDate(getMondayOfWeek());
              onChangeRange(start, 21);
              isOpen = false;
            }}
          >
            3 Weeks (21d)
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .date-range-picker-container {
    position: relative;
  }

  .date-stepper-wrapper {
    align-items: center;
    display: inline-flex;
    gap: 0.25rem;
  }

  .range-stepper-btn {
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

  .range-stepper-btn:hover {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .range-display-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 0.9rem;
    font-weight: 600;
    gap: 0.5rem;
    height: 36px;
    padding: 0 0.85rem;
    transition: all 0.2s ease;
  }

  .range-display-btn:hover,
  .range-display-btn.active {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .dropdown-caret {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .popover-backdrop {
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 998;
  }

  .date-picker-popover {
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    left: 0;
    max-width: 600px;
    padding: 1rem;
    position: absolute;
    top: calc(100% + 8px);
    width: max-content;
    z-index: 999;
  }

  .popover-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.85rem;
    padding-bottom: 0.5rem;
  }

  .popover-instruction {
    color: var(--text-color);
    font-size: 0.9rem;
  }

  .popover-month-nav {
    display: flex;
    gap: 0.25rem;
  }

  .month-nav-btn {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-color);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.1rem;
    height: 28px;
    justify-content: center;
    width: 28px;
  }

  .month-nav-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .months-grid {
    display: flex;
    gap: 1.5rem;
  }

  .month-block {
    flex: 1;
    min-width: 220px;
  }

  .month-title {
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .day-names-row {
    display: grid;
    font-size: 0.75rem;
    font-weight: 700;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 0.35rem;
    text-align: center;
  }

  .matrix-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .calendar-cell-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    font-size: 0.85rem;
    height: 30px;
    justify-content: center;
    margin: 1px 0;
    transition: background 0.15s ease;
  }

  .calendar-cell-btn:hover {
    background: var(--noonblue-bg-light);
    color: var(--noonblue);
  }

  .calendar-cell-btn.in-range {
    background: var(--noonblue-bg-light);
    border-radius: 0;
  }

  .calendar-cell-btn.selected {
    background: var(--noonblue) !important;
    border-radius: 6px;
    color: #ffffff !important;
    font-weight: 700;
  }

  .cell-empty {
    height: 30px;
  }

  .popover-footer {
    border-top: 1px solid var(--border-subtle);
    margin-top: 1rem;
    padding-top: 0.75rem;
  }

  .preset-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-pill {
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    transition: all 0.2s ease;
  }

  .preset-pill:hover {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  @media (max-width: 600px) {
    .date-picker-popover {
      max-width: 300px;
    }
    .months-grid {
      flex-direction: column;
    }
  }
</style>

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
    let shift: number;
    if (durationDays === 1) {
      shift = direction * 1;
    } else if (durationDays >= 2 && durationDays <= 6) {
      shift = direction * 7;
    } else {
      shift = direction * durationDays;
    }
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
    }
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
    }
  }

  function applyJumpAnchor(targetStart: Date) {
    onChangeRange(formatIsoDate(targetStart), durationDays);
    selectingStart = null;
    hoveringDate = null;
    viewYear = targetStart.getFullYear();
    viewMonth = targetStart.getMonth();
  }

  function applyDurationPreset(days: number) {
    const baseStart = selectingStart
      ? parseIsoDate(selectingStart)
      : parseIsoDate(startDate);
    onChangeRange(formatIsoDate(baseStart), days);
    selectingStart = null;
    hoveringDate = null;
  }

  function isDateToday(dateObj: Date): boolean {
    return formatIsoDate(dateObj) === formatIsoDate(new Date());
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

<svelte:window onkeydown={handleKeydown} />

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
                      class:is-today={isDateToday(cell)}
                      onmouseover={() => (hoveringDate = formatIsoDate(cell))}
                      onclick={() => handleDateClick(cell)}
                    >
                      <span class="calendar-cell-num">{cell.getDate()}</span>
                      {#if isDateToday(cell)}
                        <span class="today-marker-dot"></span>
                      {/if}
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
                      class:is-today={isDateToday(cell)}
                      onmouseover={() => (hoveringDate = formatIsoDate(cell))}
                      onclick={() => handleDateClick(cell)}
                    >
                      <span class="calendar-cell-num">{cell.getDate()}</span>
                      {#if isDateToday(cell)}
                        <span class="today-marker-dot"></span>
                      {/if}
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
        <div class="presets-section">
          <div class="preset-row">
            <span class="preset-row-label">Start:</span>
            <div class="preset-pills">
              <button
                type="button"
                class="preset-pill"
                onclick={() => applyJumpAnchor(new Date())}
              >
                Today
              </button>
              <button
                type="button"
                class="preset-pill"
                onclick={() => applyJumpAnchor(getMondayOfWeek())}
              >
                This Week
              </button>
              <button
                type="button"
                class="preset-pill"
                onclick={() => applyJumpAnchor(addDays(getMondayOfWeek(), 7))}
              >
                Next Week
              </button>
            </div>
          </div>

          <div class="preset-row">
            <span class="preset-row-label">Duration:</span>
            <div class="preset-pills">
              <button
                type="button"
                class="preset-pill"
                class:active={durationDays === 5 && !selectingStart}
                onclick={() => applyDurationPreset(5)}
              >
                5 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                class:active={durationDays === 7 && !selectingStart}
                onclick={() => applyDurationPreset(7)}
              >
                7 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                class:active={durationDays === 14 && !selectingStart}
                onclick={() => applyDurationPreset(14)}
              >
                14 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                class:active={durationDays === 21 && !selectingStart}
                onclick={() => applyDurationPreset(21)}
              >
                21 Days
              </button>
            </div>
          </div>
        </div>

        <div class="popover-actions-row">
          <button
            type="button"
            class="date-picker-done-btn"
            onclick={() => (isOpen = false)}
          >
            Done
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
    max-height: 85vh;
    max-width: 600px;
    overflow-y: auto;
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
    flex-direction: column;
    font-size: 0.85rem;
    height: 30px;
    justify-content: center;
    margin: 1px 0;
    position: relative;
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

  .calendar-cell-num {
    line-height: 1;
  }

  .today-marker-dot {
    background-color: var(--noonblue);
    border-radius: 50%;
    bottom: 2px;
    height: 4px;
    position: absolute;
    width: 4px;
  }

  .calendar-cell-btn.selected .today-marker-dot {
    background-color: #ffffff;
  }

  .cell-empty {
    height: 30px;
  }

  .popover-footer {
    border-top: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
  }

  .presets-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preset-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-row-label {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 60px;
    text-transform: uppercase;
  }

  .preset-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .preset-pill {
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    transition: all 0.2s ease;
  }

  .preset-pill:hover {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .preset-pill.active {
    background: var(--noonblue);
    border-color: var(--noonblue);
    color: #ffffff;
  }

  .popover-actions-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  .date-picker-done-btn {
    background: var(--noonblue);
    border: 1px solid var(--noonblue);
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.35rem 0.9rem;
    transition: all 0.2s ease;
  }

  .date-picker-done-btn:hover {
    background: var(--noonblue-dark, #2b6cb0);
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

<script lang="ts">
  import { recipesStore } from '../../stores/recipes';
  import { getCalendarLedgerFromStorage } from '../../stores/planner';
  import { scrollable } from '../../actions/scrollable';
  import type { PlannedItem, Recipe } from '../../types';
  import {
    formatIsoDate,
    getCalendarMonthMatrix,
    parseIsoDate,
  } from '../../utils/dates';

  interface Props {
    viewYear: number;
    viewMonth: number;
    onSelectWindow: (startDate: string, durationDays: number) => void;
  }

  let { viewYear, viewMonth, onSelectWindow }: Props = $props();

  const now = new Date();

  let monthMatrix = $derived(getCalendarMonthMatrix(viewYear, viewMonth));

  let monthLabel = $derived(
    new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  let ledger = $derived(getCalendarLedgerFromStorage());

  function getRecipesForDate(cellDate: Date): PlannedItem[] {
    const iso = formatIsoDate(cellDate);
    return ledger[iso] || [];
  }

  function getRecipeByPermalink(permalink?: string): Recipe | undefined {
    if (!permalink) {
      return undefined;
    }
    return $recipesStore.find((r) => r.permalink === permalink);
  }

  // Check total meals in this month matrix
  let totalMonthMeals = $derived.by(() => {
    let count = 0;
    monthMatrix.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          const iso = formatIsoDate(cell);
          if (ledger[iso]) {
            count += ledger[iso].length;
          }
        }
      });
    });
    return count;
  });

  // Supplemental items for current month
  let monthSupplementalItems = $derived.by(() => {
    const items = ledger['supplemental'] || [];
    return items.filter((item) => {
      if (!item.createdAt) {
        return true;
      }
      const itemDate = parseIsoDate(item.createdAt);
      return (
        itemDate.getFullYear() === viewYear && itemDate.getMonth() === viewMonth
      );
    });
  });

  function handleCellClick(cellDate: Date) {
    // Navigate to Plan view starting on that day for 5 days
    const start = formatIsoDate(cellDate);
    onSelectWindow(start, 5);
  }
</script>

<div class="history-view-container">
  <!-- Monthly Calendar Matrix Card -->
  <div class="history-calendar-card">
    <div class="calendar-header-row">
      <div class="header-day">Sun</div>
      <div class="header-day">Mon</div>
      <div class="header-day">Tue</div>
      <div class="header-day">Wed</div>
      <div class="header-day">Thu</div>
      <div class="header-day">Fri</div>
      <div class="header-day">Sat</div>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="calendar-matrix-body scrollable-area"
      use:scrollable
      tabindex="0"
      role="region"
      aria-label="Calendar History Matrix"
    >
      {#each monthMatrix as row}
        <div class="calendar-matrix-row">
          {#each row as cell}
            {#if cell}
              {@const dayMeals = getRecipesForDate(cell)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="history-day-cell"
                class:is-today={formatIsoDate(cell) === formatIsoDate(now)}
                onclick={() => handleCellClick(cell)}
              >
                <div class="cell-date-bar">
                  <span class="cell-date-num">{cell.getDate()}</span>
                  <div class="cell-date-right">
                    {#if formatIsoDate(cell) === formatIsoDate(now)}
                      <span class="today-badge">Today</span>
                    {/if}
                    {#if dayMeals.length > 0}
                      <span class="day-meal-count-badge">{dayMeals.length}</span
                      >
                    {/if}
                  </div>
                </div>

                <div class="cell-recipes-list">
                  {#each getRecipesForDate(cell) as item}
                    {@const rec = getRecipeByPermalink(item.permalink)}
                    <div class="history-recipe-pill">
                      {#if rec && (rec.image90 || rec.image130)}
                        <img
                          src={rec.image90 || rec.image130}
                          alt={rec.title}
                          class="history-pill-thumb"
                        />
                      {:else}
                        <span class="history-pill-icon">🍲</span>
                      {/if}
                      <span class="history-pill-title">
                        {rec ? rec.title : item.customTitle || 'Custom Meal'}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="history-day-cell cell-padding"></div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>

    {#if totalMonthMeals === 0}
      <div class="matrix-empty-watermark">
        <span class="watermark-icon">🗓️</span>
        <span class="watermark-text">No meals logged for {monthLabel}</span>
        <span class="watermark-subtext"
          >Click any date grid cell to start planning</span
        >
      </div>
    {/if}
  </div>

  <!-- Supplemental Meals Section -->
  {#if monthSupplementalItems.length > 0}
    <details class="history-supplemental-details" open>
      <summary class="supplemental-summary">
        Anytime & Supplemental Meals ({monthSupplementalItems.length})
      </summary>
      <div class="supplemental-items-grid">
        {#each monthSupplementalItems as item}
          {@const rec = getRecipeByPermalink(item.permalink)}
          <div class="supplemental-history-card">
            {#if rec && (rec.image90 || rec.image130)}
              <img
                src={rec.image90 || rec.image130}
                alt={rec.title}
                class="supp-card-thumb"
              />
            {/if}
            <div class="supp-card-info">
              <span class="supp-card-title">
                {rec ? rec.title : item.customTitle || 'Supplemental Item'}
              </span>
              {#if item.createdAt}
                <span class="supp-card-date">Added {item.createdAt}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </details>
  {/if}
</div>

<style>
  .history-view-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .history-calendar-card {
    background: var(--font-panel-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--btn-shadow);
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  .calendar-header-row {
    background: var(--recipe-title-bg);
    border-bottom: 1px solid var(--border-subtle);
    display: grid;
    flex-shrink: 0;
    font-weight: 700;
    grid-template-columns: repeat(7, 1fr);
    scrollbar-gutter: stable;
    text-align: center;
  }

  .header-day {
    color: var(--text-muted);
    font-size: 0.85rem;
    padding: 0.6rem 0;
    text-transform: uppercase;
  }

  .calendar-matrix-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .calendar-matrix-row {
    border-bottom: 1px solid var(--border-ultra-subtle);
    display: grid;
    flex-shrink: 0;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    height: 118px;
  }

  .calendar-matrix-row:last-child {
    border-bottom: none;
  }

  .history-day-cell {
    background: var(--card-bg);
    border-right: 1px solid var(--border-ultra-subtle);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    height: 118px;
    min-width: 0;
    overflow: hidden;
    padding: 0.4rem;
    transition: background 0.2s ease;
    width: 100%;
  }

  .history-day-cell:last-child {
    border-right: none;
  }

  .history-day-cell:hover {
    background: var(--noonblue-bg-light);
  }

  .history-day-cell.is-today {
    background: var(--noonblue-bg-light);
    border: 1.5px solid var(--noonblue);
  }

  .cell-padding {
    background: var(--font-controls-bg);
    cursor: default;
    opacity: 0.5;
  }

  .cell-date-bar {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .cell-date-right {
    align-items: center;
    display: flex;
    gap: 0.35rem;
  }

  .day-meal-count-badge {
    background: var(--font-controls-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    color: var(--text-muted);
    font-size: 0.675rem;
    font-weight: 700;
    line-height: 1;
    padding: 2px 6px;
  }

  .cell-date-num {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .today-badge {
    background: var(--noonblue);
    border-radius: 4px;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 4px;
    text-transform: uppercase;
  }

  .cell-recipes-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    width: 100%;
  }

  .history-recipe-pill {
    align-items: flex-start;
    background: var(--recipe-title-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    box-sizing: border-box;
    display: flex;
    gap: 0.35rem;
    min-width: 0;
    padding: 4px 6px;
    width: 100%;
  }

  .history-pill-thumb {
    border-radius: 4px;
    flex-shrink: 0;
    height: 24px;
    object-fit: cover;
    width: 24px;
  }

  .history-pill-icon {
    flex-shrink: 0;
    font-size: 0.8rem;
  }

  .history-pill-title {
    color: var(--text-color);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .matrix-empty-watermark {
    align-items: center;
    backdrop-filter: blur(6px);
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    left: 50%;
    max-width: 90%;
    opacity: 0.95;
    padding: 1.5rem 2.25rem;
    pointer-events: none;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
  }

  .watermark-icon {
    font-size: 1.75rem;
  }

  .watermark-text {
    color: var(--text-color);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .watermark-subtext {
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  @media (max-width: 767px) {
    .today-badge {
      display: none;
    }

    .calendar-matrix-row {
      height: 70px;
    }

    .history-day-cell {
      height: 70px;
      min-height: 70px;
      padding: 0.25rem;
    }

    .history-recipe-pill {
      justify-content: center;
      padding: 2px;
    }

    .history-pill-title {
      display: none;
    }
  }
</style>

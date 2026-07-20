<script lang="ts">
  import { onMount } from 'svelte';
  import { timersStore } from '../stores/timers';
  import type { TimerState } from '../types';
  import { overlayStore } from '../stores/overlay';

  let recipeUrl = $state('');

  let timers = $derived($timersStore.list);
  let dashboardTimers = $derived(timers.filter((t) => t.recipeUrl !== recipeUrl));
  const minimized = $derived($overlayStore.isMinimized);

  let groupedTimers = $derived.by(() => {
    const groups: { url: string; title: string; list: TimerState[] }[] = [];
    dashboardTimers.forEach((t) => {
      let group = groups.find((g) => g.url === t.recipeUrl);
      if (!group) {
        const fallback = t.recipeUrl.split('/').filter(Boolean).pop() || 'Recipe';
        group = { url: t.recipeUrl, title: t.recipeTitle || fallback, list: [] };
        groups.push(group);
      }
      group.list.push(t);
    });
    return groups;
  });

  $effect(() => {
    overlayStore.setHasDashboard(dashboardTimers.length > 0);
  });

  onMount(() => {
    recipeUrl = window.location.pathname;
    timersStore.syncWithStorage();

    return () => {
      overlayStore.setHasDashboard(false);
    };
  });

  function formatTime(seconds: number): string {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hrs = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;

    let display = '';
    if (hrs > 0) {
      display += `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      display += `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return isNegative ? `-${display}` : display;
  }

  function handlePlayPause(t: TimerState) {
    timersStore.startTimer(t.recipeTitle, t.recipeUrl, t.timerIndex, t.durationLabel, t.minSeconds, t.maxSeconds);
  }

  function handleReset(t: TimerState) {
    timersStore.resetTimer(t.recipeUrl, t.timerIndex);
  }

  function handleDismiss(t: TimerState) {
    timersStore.resetTimer(t.recipeUrl, t.timerIndex);
  }

  function handleDismissAll() {
    timersStore.clearAllForRecipe(recipeUrl);
  }
</script>

{#if dashboardTimers.length > 0}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    id="cooking-dashboard"
    class="cooking-dashboard"
    class:hidden={minimized}
    tabindex="0"
  >
    <div class="dashboard-header">
      <span class="dashboard-title">Cooking Dashboard</span>
      <button
        type="button"
        id="dashboard-close-all-btn"
        class="dashboard-close-btn"
        aria-label="Dismiss all timers"
        onclick={handleDismissAll}
      >
        ✕
      </button>
    </div>

    <div class="dashboard-recipes-list">
      {#each groupedTimers as group (group.url)}
        <div class="dashboard-recipe-group">
          <a href={group.url} class="dashboard-recipe-link">{group.title}</a>
          <div class="dashboard-timer-rows">
            {#each group.list as t (t.timerIndex)}
              {@const elapsed = t.elapsedBeforeStart + (t.status === 'running' && t.startedAt !== null ? Math.floor(($timersStore.now - t.startedAt) / 1000) : 0)}
              {@const remaining = t.maxSeconds - elapsed}
              {@const isBeyond = elapsed > t.maxSeconds}
              {@const isIn = elapsed >= t.minSeconds && elapsed <= t.maxSeconds}
              <div
                class="dashboard-timer-row {isBeyond ? 'is-beyond-range' : ''} {isIn ? 'is-in-range' : ''}"
                data-recipe-url={t.recipeUrl}
                data-timer-index={t.timerIndex}
              >
                <span class="dashboard-timer-label">{t.durationLabel}</span>
                <span class="dashboard-timer-time">{formatTime(remaining)}</span>
                <div class="dashboard-timer-controls">
                  <button
                    type="button"
                    class="dashboard-timer-btn"
                    onclick={() => handlePlayPause(t)}
                    aria-label={t.status === 'running' ? 'Pause' : 'Play'}
                  >
                    {#if t.status === 'running'}
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    {/if}
                  </button>
                  <button
                    type="button"
                    class="dashboard-timer-btn"
                    onclick={() => handleReset(t)}
                    aria-label="Reset"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="dashboard-timer-btn"
                    onclick={() => handleDismiss(t)}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .hidden {
    display: none !important;
  }

  .cooking-dashboard {
    background: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    padding: 1.25rem;
    width: 320px;
    max-width: calc(100vw - 48px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease;
    pointer-events: auto;
  }

  :global(html.dark-mode) .cooking-dashboard {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .dashboard-header {
    align-items: center;
    border-bottom: 1px solid var(--border-ultra-subtle);
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.5rem;
  }

  .dashboard-title {
    color: var(--text-title);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .dashboard-close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .dashboard-close-btn:hover {
    color: var(--text-color);
  }

  .dashboard-recipes-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .dashboard-recipe-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .dashboard-recipe-link {
    color: var(--noonblue);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.2s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-recipe-link:hover {
    color: var(--noonblue);
    text-decoration: underline;
  }

  .dashboard-timer-rows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .dashboard-timer-row {
    align-items: center;
    background: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }

  .dashboard-timer-label {
    color: var(--text-color);
    font-size: 0.8rem;
    font-weight: 500;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-timer-time {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 700;
    min-width: 5.5ch;
    text-align: right;
    color: var(--noonblue);
  }

  .dashboard-timer-row.is-in-range .dashboard-timer-time {
    color: #10b981;
  }

  .dashboard-timer-row.is-beyond-range .dashboard-timer-time {
    color: #f97316;
    animation: dashboard-text-pulse 1s infinite ease-in-out;
  }

  @keyframes dashboard-text-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .dashboard-timer-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dashboard-timer-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .dashboard-timer-btn:hover {
    background-color: var(--border-ultra-subtle);
    color: var(--text-color);
  }

  .dashboard-timer-btn svg {
    display: block;
  }
</style>


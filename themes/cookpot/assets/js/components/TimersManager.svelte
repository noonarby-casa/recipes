<script lang="ts">
  import { onMount } from 'svelte';
  import { timersStore, type TimerState } from '../stores/timers';
  import { OverlayContainer } from './overlay-container';

  let recipeUrl = $state('');
  let element = $state<HTMLElement | null>(null);

  let timers = $derived($timersStore.list);
  let dashboardTimers = $derived(timers.filter((t) => t.recipeUrl !== recipeUrl));

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
    const overlay = OverlayContainer.getInstance();
    if (element) {
      if (dashboardTimers.length > 0) {
        if (!overlay.has(element)) {
          overlay.add(element);
        }
      } else {
        if (overlay.has(element)) {
          overlay.remove(element);
        }
      }
    }
  });

  onMount(() => {
    recipeUrl = window.location.pathname;
    timersStore.syncWithStorage();

    return () => {
      if (element) {
        OverlayContainer.getInstance().remove(element);
      }
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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={element}
  id="cooking-dashboard"
  class="cooking-dashboard"
  tabindex="0"
  style="display: {dashboardTimers.length > 0 ? 'block' : 'none'};"
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

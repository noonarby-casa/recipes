<script lang="ts">
  import { onMount } from 'svelte';
  import { overlayStore, overlayVisible } from '../stores/overlay';
  import { timersStore } from '../stores/timers';
  import TimersManager from './TimersManager.svelte';

  const overlayState = $derived($overlayStore);

  let dashboardFabEl = $state<HTMLButtonElement | null>(null);
  let backFabEl = $state<HTMLButtonElement | null>(null);

  onMount(() => {
    timersStore.syncWithStorage();
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      const recipeUrl = window.location.pathname;
      const dashboardTimers = $timersStore.list.filter((t) => t.recipeUrl !== recipeUrl);
      overlayStore.setHasDashboard(dashboardTimers.length > 0);
    }
  });

  // Replicate the focus shifts from the old OverlayContainer class when minimized state changes
  $effect(() => {
    const minimized = overlayState.isMinimized;
    if (minimized) {
      if (overlayState.hasDashboard && dashboardFabEl) {
        dashboardFabEl.focus();
      } else if (overlayState.backHref && backFabEl) {
        backFabEl.focus();
      }
    } else {
      const db = document.getElementById('cooking-dashboard');
      if (db) {
        db.focus();
      }
    }
  });

  // Derive dashboard FAB status reactively from timersStore
  const fabStatus = $derived.by(() => {
    let hasExpired = false;
    let hasInRange = false;
    let hasRunning = false;

    if (typeof window === 'undefined') {
      return { hasExpired, hasInRange, hasRunning };
    }
    const recipeUrl = window.location.pathname;
    const timers = $timersStore.list;
    const dashboardTimers = timers.filter((t) => t.recipeUrl !== recipeUrl);
    const now = $timersStore.now;

    dashboardTimers.forEach((t) => {
      const elapsed =
        t.elapsedBeforeStart +
        (t.status === 'running' && t.startedAt !== null
          ? Math.floor((now - t.startedAt) / 1000)
          : 0);

      if (elapsed > t.maxSeconds) {
        hasExpired = true;
      } else if (elapsed >= t.minSeconds) {
        hasInRange = true;
      } else if (t.status === 'running') {
        hasRunning = true;
      }
    });

    return { hasExpired, hasInRange, hasRunning };
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !overlayState.isMinimized && $overlayVisible) {
      overlayStore.minimize();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if $overlayVisible}
  <div id="overlay-container" class="overlay-container" class:is-minimized={overlayState.isMinimized}>
    <button
      type="button"
      class="overlay-toggle-btn"
      aria-label={overlayState.isMinimized ? 'Expand overlay' : 'Minimize overlay'}
      aria-expanded={!overlayState.isMinimized}
      onclick={() => overlayStore.toggle()}
    >
      {#if overlayState.isMinimized}
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      {/if}
    </button>

    {#if overlayState.hasDashboard}
      <button
        bind:this={dashboardFabEl}
        type="button"
        class="minimized-fab fab-dashboard"
        class:is-expired={fabStatus.hasExpired}
        class:is-in-range={fabStatus.hasInRange}
        class:is-running={fabStatus.hasRunning}
        aria-label="Restore Cooking Dashboard"
        data-tooltip="Restore Cooking Dashboard"
        onclick={() => overlayStore.expand()}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
          <line x1="12" y1="2" x2="12" y2="4"></line>
        </svg>
      </button>
    {/if}

    {#if overlayState.backHref}
      <button
        bind:this={backFabEl}
        type="button"
        class="minimized-fab fab-back"
        aria-label="Back to Meal Plan"
        data-tooltip="Back to Meal Plan"
        onclick={() => { window.location.href = overlayState.backHref!; }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <a
        href={overlayState.backHref}
        class="plan-back-btn btn-brand"
        class:hidden={overlayState.isMinimized}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Meal Plan</span>
      </a>
    {/if}

    <TimersManager />
  </div>
{/if}

<style>
  .overlay-container {
    align-items: flex-start;
    bottom: 24px;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.75rem;
    left: 24px;
    max-width: 320px;
    pointer-events: none;
    position: fixed;
    z-index: 100000;
  }

  .overlay-container > :global(*) {
    pointer-events: auto;
  }

  .overlay-toggle-btn {
    background: var(--font-panel-bg);
    border: 1.5px solid var(--border-color);
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    width: 36px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100002;
    order: 1; /* Keep toggle button at the very bottom */
  }

  .overlay-toggle-btn:hover {
    transform: scale(1.05);
    border-color: var(--noonblue);
    color: var(--noonblue);
  }

  .overlay-toggle-btn:active {
    transform: scale(0.95);
  }

  .minimized-fab {
    background: var(--font-panel-bg);
    border: 1.5px solid var(--btn-border);
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    color: var(--text-color);
    cursor: pointer;
    display: none; /* Controlled by JS show/hide */
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 40px;
    position: relative;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .minimized-fab svg {
    transition: transform 0.2s ease;
  }

  .minimized-fab:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
  }

  .minimized-fab:hover svg {
    transform: scale(1.1);
  }

  .minimized-fab:active {
    transform: translateY(0) scale(0.95);
  }

  .minimized-fab::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 48px;
    top: 50%;
    transform: translateY(-50%) scale(0.9);
    background: var(--btn-brand-bg, #005ec4);
    color: #fff;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 100001;
  }

  .minimized-fab:hover::after {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }

  .fab-dashboard.is-running {
    background: var(--noonblue-bg-light);
    border-color: var(--noonblue);
    color: var(--noonblue);
    box-shadow: 0 4px 12px var(--noonblue-shadow-subtle);
  }

  .fab-dashboard.is-in-range {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--timer-in-range-bg-start);
    color: var(--timer-in-range-bg-start);
    box-shadow: 0 4px 12px var(--timer-in-range-shadow);
    animation: fab-in-range-pulse 2s infinite;
  }

  .fab-dashboard.is-expired {
    background: rgba(249, 115, 22, 0.15);
    border-color: var(--timer-beyond-range-bg-start);
    color: var(--timer-beyond-range-bg-start);
    box-shadow: 0 4px 12px var(--timer-beyond-range-shadow);
    animation: fab-expired-pulse 1s infinite;
  }

  @keyframes fab-in-range-pulse {
    0% {
      box-shadow: 0 0 0 0 var(--timer-in-range-pulse-0);
    }
    70% {
      box-shadow: 0 0 0 8px var(--timer-in-range-pulse-50);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }

  @keyframes fab-expired-pulse {
    0% {
      box-shadow: 0 0 0 0 var(--timer-beyond-range-pulse-0);
    }
    70% {
      box-shadow: 0 0 0 10px var(--timer-beyond-range-pulse-50);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
    }
  }

  :global(#cooking-dashboard),
  .plan-back-btn {
    transition:
      opacity 0.2s ease-in-out,
      transform 0.2s ease-in-out;
  }

  .overlay-container.is-minimized :global(#cooking-dashboard),
  .overlay-container.is-minimized .plan-back-btn {
    display: none !important;
  }

  .overlay-container.is-minimized .minimized-fab {
    display: flex;
  }

  .fab-dashboard {
    order: 2;
  }
  .fab-back {
    order: 3;
  }
  :global(#cooking-dashboard) {
    order: 4;
  }
  .plan-back-btn {
    order: 5;
  }

  :global(.plan-toast-notification) {
    order: 10;
    pointer-events: auto;
  }

  .hidden {
    display: none;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { timersStore } from '../stores/timers';
  import type { TimerState } from '../types';
  import PlayIcon from './icons/PlayIcon.svelte';
  import PauseIcon from './icons/PauseIcon.svelte';
  import ResetIcon from './icons/ResetIcon.svelte';

  interface Props {
    /** The raw duration string (e.g., '10m', '1-2h', '15-20 mins'). */
    duration: string;
    /** The zero-based index of this specific timer within the recipe. */
    index: number;
    /** The parent DOM element to which this timer belongs. */
    target: HTMLElement;
  }

  let { duration, index, target }: Props = $props();

  let recipeTitle: string = $state('');
  let recipeUrl: string = $state('');

  // Parse duration
  let parsed: { minSeconds: number; maxSeconds: number } | null = $derived.by(() => {
    const str = duration.toLowerCase().trim();
    const rangeRegex = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;
    const singleRegex = /^(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;

    let minVal: number, maxVal: number, unit: string;
    let match = str.match(rangeRegex);
    if (match) {
      minVal = parseFloat(match[1]);
      maxVal = parseFloat(match[2]);
      unit = match[3];
    } else {
      match = str.match(singleRegex);
      if (match) {
        minVal = parseFloat(match[1]);
        maxVal = minVal;
        unit = match[2];
      } else {
        return null;
      }
    }

    let multiplier = 1;
    if (unit.startsWith('h')) {multiplier = 3600;}
    else if (unit.startsWith('m')) {multiplier = 60;}
    else if (unit.startsWith('s')) {multiplier = 1;}

    return {
      minSeconds: Math.round(minVal * multiplier),
      maxSeconds: Math.round(maxVal * multiplier),
    };
  });

  let timerState: TimerState | undefined = $derived($timersStore.list.find((t) => t.recipeUrl === recipeUrl && t.timerIndex === index));

  let elapsed: number = $derived.by(() => {
    if (!timerState) {return 0;}
    if (timerState.status === 'running' && timerState.startedAt !== null) {
      return timerState.elapsedBeforeStart + Math.floor(($timersStore.now - timerState.startedAt) / 1000);
    }
    return timerState.elapsedBeforeStart;
  });

  let remaining = $derived(parsed ? parsed.maxSeconds - elapsed : 0);

  let labelText = $derived.by(() => {
    if (!timerState) {return duration;}
    return formatTime(remaining);
  });

  let isBeyondRange = $derived(parsed && elapsed > parsed.maxSeconds);
  let isInRange = $derived(parsed && elapsed >= parsed.minSeconds && elapsed <= parsed.maxSeconds);
  let hasStarted = $derived(!!timerState);
  let isRunning = $derived(timerState?.status === 'running');

  // Reactively sync classes on the target element
  $effect(() => {
    if (target) {
      if (hasStarted) {target.classList.add('has-started');}
      else {target.classList.remove('has-started');}

      if (isRunning) {target.classList.add('is-running');}
      else {target.classList.remove('is-running');}

      if (isInRange) {target.classList.add('is-in-range');}
      else {target.classList.remove('is-in-range');}

      if (isBeyondRange) {target.classList.add('is-beyond-range');}
      else {target.classList.remove('is-beyond-range');}
    }
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

  function handlePlayPause(e: Event) {
    e.preventDefault();
    if (!parsed) {return;}
    timersStore.startTimer(recipeTitle, recipeUrl, index, duration, parsed.minSeconds, parsed.maxSeconds);
  }

  function handleReset(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    timersStore.resetTimer(recipeUrl, index);
  }

  onMount(() => {
    const titleEl = document.querySelector('.recipe-title-bar h1');
    recipeTitle = (titleEl ? titleEl.textContent?.trim() : '') || 'Recipe';
    recipeUrl = window.location.pathname;

    if (target && parsed) {
      const inactiveWidth = target.getBoundingClientRect().width;
      
      const span = document.createElement('span');
      span.className = 'timer-label';
      span.textContent = formatTime(parsed.maxSeconds);
      
      const mockTimer = document.createElement('span');
      mockTimer.className = 'recipe-timer btn-brand has-started';
      mockTimer.appendChild(span);
      mockTimer.style.position = 'absolute';
      mockTimer.style.visibility = 'hidden';
      document.body.appendChild(mockTimer);
      
      const activeWidth = mockTimer.getBoundingClientRect().width;
      document.body.removeChild(mockTimer);

      if (inactiveWidth > 0 && activeWidth > 0) {
        const lockedWidth = Math.ceil(Math.max(inactiveWidth, activeWidth));
        target.style.width = `${lockedWidth}px`;
      }
    }
  });
</script>

<button
  class="recipe-timer-btn"
  type="button"
  onclick={handlePlayPause}
  aria-label="Start timer {duration}"
>
  <span class="timer-icon">
    {#if isRunning}
      <PauseIcon size={14} strokeWidth={2.5} class="timer-svg-icon timer-pause-icon" />
    {:else}
      <PlayIcon size={14} strokeWidth={2.5} class="timer-svg-icon timer-play-icon" />
    {/if}
  </span>
  <span class="timer-label">{labelText}</span>
</button>

<button
  class="recipe-timer-reset"
  type="button"
  onclick={handleReset}
  aria-label="Reset timer"
  title="Reset timer"
>
  <ResetIcon size={14} strokeWidth={2.5} class="timer-svg-icon timer-reset-icon" />
</button>

<style>
  :global(.recipe-timer) {
    align-items: stretch;
    border: 1px solid transparent;
    border-radius: 20px;
    box-sizing: border-box;
    display: inline-flex;
    margin: 0 0.35rem;
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    vertical-align: middle;
  }

  :global(.recipe-timer:hover) {
    box-shadow: 0 6px 14px var(--noonblue-shadow);
    transform: translateY(-0.5px);
  }

  :global(.recipe-timer:active) {
    transform: translateY(0.5px) scale(0.97);
  }

  .recipe-timer-btn {
    align-items: center;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 0.95em;
    font-weight: 600;
    gap: 0.45rem;
    outline: none;
    padding: 0.35rem 0.85rem;
    transition: background-color 0.2s ease;
    flex-grow: 1;
    justify-content: center;
  }

  .recipe-timer-btn:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  .recipe-timer-reset {
    align-items: center;
    background: transparent;
    border: none;
    border-left: 1.5px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: none; /* Hidden by default */
    font-size: 0.95rem;
    justify-content: center;
    outline: none;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    width: 36px; /* Generous touch target for tablets */
  }

  .recipe-timer-reset:hover {
    background-color: rgba(255, 255, 255, 0.18);
    color: #fff;
  }

  /* Show reset button when active or paused */
  :global(.recipe-timer.has-started) .recipe-timer-reset {
    display: inline-flex;
  }

  /* Running State */
  :global(.recipe-timer.is-running) {
    animation: timer-pulse 2s infinite ease-in-out;
  }

  @keyframes timer-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(0, 128, 216, 0.4);
    }

    50% {
      box-shadow: 0 0 0 5px rgba(0, 128, 216, 0.15);
    }
  }

  /* Hide brand background gradient pseudo-element once timer starts */
  :global(.recipe-timer.has-started::before) {
    display: none !important;
  }

  /* Base started style (blue/running) */
  :global(.recipe-timer.has-started) {
    background: var(--btn-brand-bg) !important;
    border: 1px solid transparent !important;
    box-shadow: 0 3px 8px var(--noonblue-shadow-subtle) !important;
  }

  /* Green State: In Range / Complete */
  :global(.recipe-timer.is-in-range) {
    background-color: var(--timer-in-range-bg-start) !important;
    background-image: linear-gradient(
      135deg,
      var(--timer-in-range-bg-start),
      var(--timer-in-range-bg-end)
    ) !important;
    box-shadow: 0 4px 10px var(--timer-in-range-shadow) !important;
  }

  :global(.recipe-timer.is-in-range.is-running) {
    animation: timer-pulse-green 2s infinite ease-in-out;
  }

  @keyframes timer-pulse-green {
    0%,
    100% {
      box-shadow: 0 0 0 0 var(--timer-in-range-pulse-0);
    }

    50% {
      box-shadow: 0 0 0 5px var(--timer-in-range-pulse-50);
    }
  }

  /* Orange State: Beyond Range (Overtime) */
  :global(.recipe-timer.is-beyond-range) {
    background-color: var(--timer-beyond-range-bg-start) !important;
    background-image: linear-gradient(
      135deg,
      var(--timer-beyond-range-bg-start),
      var(--timer-beyond-range-bg-end)
    ) !important;
    box-shadow: 0 4px 10px var(--timer-beyond-range-shadow) !important;
  }

  :global(.recipe-timer.is-beyond-range.is-running) {
    animation: timer-pulse-orange 1s infinite ease-in-out;
  }

  @keyframes timer-pulse-orange {
    0%,
    100% {
      box-shadow: 0 0 0 0 var(--timer-beyond-range-pulse-0);
    }

    50% {
      box-shadow: 0 0 0 5px var(--timer-beyond-range-pulse-50);
    }
  }

  /* Unified Paused State - wins over other active states via class specificity */
  :global(.recipe-timer.has-started:not(.is-running)) {
    background: var(--timer-paused-bg) !important;
    border: 1px solid var(--timer-paused-border) !important;
    box-shadow: none !important;
  }

  :global(.recipe-timer.has-started:not(.is-running)) .recipe-timer-btn {
    color: var(--timer-paused-text) !important;
  }

  :global(.recipe-timer.has-started:not(.is-running)) .recipe-timer-reset {
    border-left-color: var(--timer-paused-border) !important;
    color: var(--timer-paused-text) !important;
  }

  :global(.recipe-timer.has-started:not(.is-running)) .recipe-timer-btn:hover,
  :global(.recipe-timer.has-started:not(.is-running)) .recipe-timer-reset:hover {
    background-color: var(--border-subtle);
  }

  /* SVG Icon support */
  .timer-icon {
    align-items: center;
    display: inline-flex;
    justify-content: center;
  }

  :global(.timer-svg-icon) {
    display: block;
    flex-shrink: 0;
  }

  /* Toggle play/pause SVG icons based on running state */
  :global(.recipe-timer) :global(.timer-pause-icon) {
    display: none;
  }

  :global(.recipe-timer.is-running) :global(.timer-play-icon) {
    display: none;
  }

  :global(.recipe-timer.is-running) :global(.timer-pause-icon) {
    display: block;
  }

  /* Prevent reflow on countdown update / negative sign */
  .timer-label {
    display: inline-block;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  :global(.recipe-timer.has-started) .timer-label {
    min-width: 6ch;
  }
</style>

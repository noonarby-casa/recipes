<script lang="ts">
  import { onMount } from 'svelte';
  import { timersStore } from '../stores/timers';
  import type { TimerState } from '../types';

  interface Props {
    duration: string;
    index: number;
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
      <svg class="timer-svg-icon timer-pause-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
      </svg>
    {:else}
      <svg class="timer-svg-icon timer-play-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
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
  <svg class="timer-svg-icon timer-reset-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
</button>

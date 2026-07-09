import {
  initAudio,
  playLowerBoundChime,
  playUpperBoundChime,
  stopAudio,
} from './audio';
import { OverlayContainer } from './components/overlay-container';

interface ParsedDuration {
  minSeconds: number;
  maxSeconds: number;
}

interface TimerState {
  recipeTitle: string;
  recipeUrl: string;
  timerIndex: number;
  durationLabel: string;
  minSeconds: number;
  maxSeconds: number;
  startedAt: number | null;
  elapsedBeforeStart: number;
  status: 'running' | 'paused';
  lowerChimePlayed: boolean;
  upperChimePlayed: boolean;
  updatedAt?: number;
}

interface InlineTimerRef {
  element: HTMLElement;
  btn: HTMLElement;
  resetBtn: HTMLElement;
  labelSpan: HTMLElement;
  minSeconds: number;
  maxSeconds: number;
  rawDuration: string;
}

const STORAGE_KEY = 'noonarby-casa-timers';

let inlineTimers: InlineTimerRef[] = [];
let recipeTitle = '';
let recipeUrl = '';
let tickIntervalId: ReturnType<typeof setInterval> | null = null;
let dashboardCard: HTMLDivElement | null = null;
let wakeLock: WakeLockSentinel | null = null;
let lastRunningTimerKeys = new Set<string>();

function parseDuration(durationStr: string): ParsedDuration | null {
  const str = durationStr.toLowerCase().trim();

  // Regex to match range, e.g. "5-7 minutes", "30-45 seconds", "1-2 hours"
  const rangeRegex =
    /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;
  // Regex to match single, e.g. "10 minutes", "45 seconds", "1.5 hours"
  const singleRegex =
    /^(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;

  let minVal: number;
  let maxVal: number;
  let unit: string;

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
  if (unit.startsWith('h')) {
    multiplier = 3600;
  } else if (unit.startsWith('m')) {
    multiplier = 60;
  } else if (unit.startsWith('s')) {
    multiplier = 1;
  }

  return {
    minSeconds: Math.round(minVal * multiplier),
    maxSeconds: Math.round(maxVal * multiplier),
  };
}

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

async function requestWakeLock(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.wakeLock) {
    return;
  }
  if (wakeLock !== null) {
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch (err) {
    console.error('Failed to acquire screen wake lock:', err);
  }
}

function releaseWakeLock(): void {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

function updateWakeLockState(timers: TimerState[]): void {
  const hasRunning = timers.some((t) => t.status === 'running');
  if (hasRunning) {
    requestWakeLock().catch((err) => {
      console.error('Failed to request wake lock:', err);
    });
  } else {
    releaseWakeLock();
  }
}

function getStoredTimers(): TimerState[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as TimerState[];
    }
  } catch (e) {
    console.error('Failed to parse stored timers:', e);
  }
  return [];
}

function saveStoredTimers(timers: TimerState[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    updateWakeLockState(timers);
  } catch (e) {
    console.error('Failed to save timers:', e);
  }
}

function cleanupStoredTimers(timers: TimerState[]): TimerState[] {
  const now = Date.now();
  return timers.filter((t) => {
    const elapsed =
      t.elapsedBeforeStart +
      (t.status === 'running' && t.startedAt !== null
        ? Math.floor((now - t.startedAt) / 1000)
        : 0);
    const isCompleted = elapsed >= t.maxSeconds;

    // 1. Completed (beyond range) for more than 2 hours
    if (isCompleted) {
      if (t.status === 'running' && t.startedAt !== null) {
        const completedTime =
          t.startedAt + (t.maxSeconds - t.elapsedBeforeStart) * 1000;
        if (now - completedTime > 2 * 60 * 60 * 1000) {
          return false;
        }
      } else {
        const updatedAt = t.updatedAt || now;
        if (now - updatedAt > 2 * 60 * 60 * 1000) {
          return false;
        }
      }
    }

    // 2. Not updated/active for more than 12 hours
    const updatedAt = t.updatedAt || t.startedAt || now;
    if (now - updatedAt > 12 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  });
}

function startGlobalTickIfNeeded(): void {
  if (tickIntervalId !== null) {
    return;
  }
  tickIntervalId = setInterval(() => {
    tick();
  }, 1000);
}

function stopGlobalTick(): void {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

function handleInlinePlayPause(index: number) {
  const timers = getStoredTimers();
  let target = timers.find(
    (t) => t.recipeUrl === recipeUrl && t.timerIndex === index,
  );
  const now = Date.now();

  if (!target) {
    const ref = inlineTimers[index];
    target = {
      recipeTitle,
      recipeUrl,
      timerIndex: index,
      durationLabel: ref.rawDuration,
      minSeconds: ref.minSeconds,
      maxSeconds: ref.maxSeconds,
      startedAt: now,
      elapsedBeforeStart: 0,
      status: 'running',
      lowerChimePlayed: false,
      upperChimePlayed: false,
      updatedAt: now,
    };
    timers.push(target);
  } else {
    if (target.status === 'running') {
      const elapsed =
        target.elapsedBeforeStart +
        (target.startedAt !== null
          ? Math.floor((now - target.startedAt) / 1000)
          : 0);
      target.status = 'paused';
      target.elapsedBeforeStart = elapsed;
      target.startedAt = null;
    } else {
      target.status = 'running';
      target.startedAt = now;
    }
    target.updatedAt = now;
  }

  saveStoredTimers(timers);
  updateUI();
  startGlobalTickIfNeeded();
}

function handleInlineReset(index: number) {
  const timers = getStoredTimers();
  const target = timers.find(
    (t) => t.recipeUrl === recipeUrl && t.timerIndex === index,
  );
  if (target) {
    target.status = 'paused';
    target.elapsedBeforeStart = 0;
    target.startedAt = null;
    target.lowerChimePlayed = false;
    target.upperChimePlayed = false;
    target.updatedAt = Date.now();
    saveStoredTimers(timers);
  }
  updateUI();
}

function handleDashboardPlayPause(url: string, index: number) {
  const timers = getStoredTimers();
  const target = timers.find(
    (t) => t.recipeUrl === url && t.timerIndex === index,
  );
  if (target) {
    const now = Date.now();
    if (target.status === 'running') {
      const elapsed =
        target.elapsedBeforeStart +
        (target.startedAt !== null
          ? Math.floor((now - target.startedAt) / 1000)
          : 0);
      target.status = 'paused';
      target.elapsedBeforeStart = elapsed;
      target.startedAt = null;
    } else {
      target.status = 'running';
      target.startedAt = now;
    }
    target.updatedAt = now;
    saveStoredTimers(timers);
    updateUI();
    startGlobalTickIfNeeded();
  }
}

function handleDashboardReset(url: string, index: number) {
  const timers = getStoredTimers();
  const target = timers.find(
    (t) => t.recipeUrl === url && t.timerIndex === index,
  );
  if (target) {
    target.status = 'paused';
    target.elapsedBeforeStart = 0;
    target.startedAt = null;
    target.lowerChimePlayed = false;
    target.upperChimePlayed = false;
    target.updatedAt = Date.now();
    saveStoredTimers(timers);
    updateUI();
  }
}

function handleDashboardDismiss(url: string, index: number) {
  let timers = getStoredTimers();
  timers = timers.filter(
    (t) => !(t.recipeUrl === url && t.timerIndex === index),
  );
  saveStoredTimers(timers);
  updateUI();
}

function updateInlineTimersUI(timers: TimerState[]): void {
  inlineTimers.forEach((ref, index) => {
    const state = timers.find(
      (t) => t.recipeUrl === recipeUrl && t.timerIndex === index,
    );

    if (!state) {
      ref.labelSpan.textContent = ref.rawDuration;
      ref.element.classList.remove(
        'has-started',
        'is-running',
        'is-in-range',
        'is-beyond-range',
      );
      return;
    }

    const now = Date.now();
    const elapsed =
      state.elapsedBeforeStart +
      (state.status === 'running' && state.startedAt !== null
        ? Math.floor((now - state.startedAt) / 1000)
        : 0);
    const remaining = state.maxSeconds - elapsed;

    ref.labelSpan.textContent = formatTime(remaining);

    if (elapsed > state.maxSeconds) {
      ref.element.classList.add('is-beyond-range');
      ref.element.classList.remove('is-in-range');
    } else if (elapsed >= state.minSeconds) {
      ref.element.classList.add('is-in-range');
      ref.element.classList.remove('is-beyond-range');
    } else {
      ref.element.classList.remove('is-in-range', 'is-beyond-range');
    }

    ref.element.classList.add('has-started');
    if (state.status === 'running') {
      ref.element.classList.add('is-running');
    } else {
      ref.element.classList.remove('is-running');
    }
  });
}

function updateDashboardUI(timers: TimerState[]): void {
  const overlay = OverlayContainer.getInstance();

  const dashboardTimers = timers.filter((t) => t.recipeUrl !== recipeUrl);

  if (dashboardTimers.length === 0) {
    if (dashboardCard) {
      overlay.remove(dashboardCard);
      dashboardCard = null;
    }
    return;
  }

  if (!dashboardCard) {
    dashboardCard = document.createElement('div');
    dashboardCard.id = 'cooking-dashboard';
    dashboardCard.className = 'cooking-dashboard';
    overlay.add(dashboardCard);
  }

  dashboardCard.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'dashboard-header';

  const title = document.createElement('span');
  title.className = 'dashboard-title';
  title.textContent = 'Cooking Dashboard';
  header.appendChild(title);

  const closeAllBtn = document.createElement('button');
  closeAllBtn.type = 'button';
  closeAllBtn.className = 'dashboard-close-btn';
  closeAllBtn.id = 'dashboard-close-all-btn';
  closeAllBtn.setAttribute('aria-label', 'Dismiss all timers');
  closeAllBtn.textContent = '✕';
  closeAllBtn.addEventListener('click', () => {
    let currentTimers = getStoredTimers();
    currentTimers = currentTimers.filter((t) => t.recipeUrl === recipeUrl);
    saveStoredTimers(currentTimers);
    updateUI();
  });
  header.appendChild(closeAllBtn);
  dashboardCard.appendChild(header);

  const listContainer = document.createElement('div');
  listContainer.className = 'dashboard-recipes-list';

  const groups: { [url: string]: { title: string; list: TimerState[] } } = {};
  dashboardTimers.forEach((t) => {
    if (!groups[t.recipeUrl]) {
      const fallbackTitle =
        t.recipeUrl.split('/').filter(Boolean).pop() || 'Recipe';
      groups[t.recipeUrl] = { title: t.recipeTitle || fallbackTitle, list: [] };
    }
    groups[t.recipeUrl].list.push(t);
  });

  const now = Date.now();

  Object.keys(groups).forEach((url) => {
    const group = groups[url];
    const groupDiv = document.createElement('div');
    groupDiv.className = 'dashboard-recipe-group';

    const recipeLink = document.createElement('a');
    recipeLink.href = url;
    recipeLink.className = 'dashboard-recipe-link';
    recipeLink.textContent = group.title;
    groupDiv.appendChild(recipeLink);

    const rowsDiv = document.createElement('div');
    rowsDiv.className = 'dashboard-timer-rows';

    group.list.forEach((t) => {
      const elapsed =
        t.elapsedBeforeStart +
        (t.status === 'running' && t.startedAt !== null
          ? Math.floor((now - t.startedAt) / 1000)
          : 0);
      const remaining = t.maxSeconds - elapsed;

      const row = document.createElement('div');
      row.className = 'dashboard-timer-row';
      row.dataset.recipeUrl = t.recipeUrl;
      row.dataset.timerIndex = t.timerIndex.toString();

      if (elapsed > t.maxSeconds) {
        row.classList.add('is-beyond-range');
      } else if (elapsed >= t.minSeconds) {
        row.classList.add('is-in-range');
      }

      const label = document.createElement('span');
      label.className = 'dashboard-timer-label';
      label.textContent = t.durationLabel;
      row.appendChild(label);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'dashboard-timer-time';
      timeSpan.textContent = formatTime(remaining);
      row.appendChild(timeSpan);

      const controls = document.createElement('div');
      controls.className = 'dashboard-timer-controls';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dashboard-timer-btn';
      playBtn.setAttribute(
        'aria-label',
        t.status === 'running' ? 'Pause' : 'Play',
      );
      playBtn.innerHTML =
        t.status === 'running'
          ? `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
          : `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      playBtn.addEventListener('click', () => {
        initAudio();
        handleDashboardPlayPause(t.recipeUrl, t.timerIndex);
      });
      controls.appendChild(playBtn);

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'dashboard-timer-btn';
      resetBtn.setAttribute('aria-label', 'Reset');
      resetBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
      resetBtn.addEventListener('click', () => {
        handleDashboardReset(t.recipeUrl, t.timerIndex);
      });
      controls.appendChild(resetBtn);

      const dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.className = 'dashboard-timer-btn';
      dismissBtn.setAttribute('aria-label', 'Dismiss');
      dismissBtn.textContent = '✕';
      dismissBtn.addEventListener('click', () => {
        handleDashboardDismiss(t.recipeUrl, t.timerIndex);
      });
      controls.appendChild(dismissBtn);

      row.appendChild(controls);
      rowsDiv.appendChild(row);
    });

    groupDiv.appendChild(rowsDiv);
    listContainer.appendChild(groupDiv);
  });

  dashboardCard.appendChild(listContainer);
}

function updateUI(): void {
  const timers = getStoredTimers();
  updateInlineTimersUI(timers);
  updateDashboardUI(timers);

  // Stop audio if a running timer is paused, reset, or dismissed (either locally or on another tab)
  const currentRunning = new Set(
    timers
      .filter((t) => t.status === 'running')
      .map((t) => `${t.recipeUrl}-${t.timerIndex}`),
  );

  let stoppedRunning = false;
  for (const key of lastRunningTimerKeys) {
    if (!currentRunning.has(key)) {
      stoppedRunning = true;
      break;
    }
  }

  // Update running timers set
  lastRunningTimerKeys = currentRunning;

  if (stoppedRunning) {
    stopAudio();
  }
}

function tick(): void {
  const timers = getStoredTimers();
  const now = Date.now();

  timers.forEach((t) => {
    if (t.status !== 'running' || t.startedAt === null) {
      return;
    }

    const elapsed =
      t.elapsedBeforeStart + Math.floor((now - t.startedAt) / 1000);

    if (t.minSeconds === t.maxSeconds) {
      if (elapsed >= t.maxSeconds && !t.upperChimePlayed) {
        const latestTimers = getStoredTimers();
        const fresh = latestTimers.find(
          (x) => x.recipeUrl === t.recipeUrl && x.timerIndex === t.timerIndex,
        );
        if (fresh && !fresh.upperChimePlayed) {
          fresh.upperChimePlayed = true;
          fresh.updatedAt = now;
          saveStoredTimers(latestTimers);
          playUpperBoundChime();
          t.upperChimePlayed = true;
        }
      }
    } else {
      if (elapsed >= t.minSeconds && !t.lowerChimePlayed) {
        const latestTimers = getStoredTimers();
        const fresh = latestTimers.find(
          (x) => x.recipeUrl === t.recipeUrl && x.timerIndex === t.timerIndex,
        );
        if (fresh && !fresh.lowerChimePlayed) {
          fresh.lowerChimePlayed = true;
          fresh.updatedAt = now;
          saveStoredTimers(latestTimers);
          playLowerBoundChime();
          t.lowerChimePlayed = true;
        }
      }
      if (elapsed >= t.maxSeconds && !t.upperChimePlayed) {
        const latestTimers = getStoredTimers();
        const fresh = latestTimers.find(
          (x) => x.recipeUrl === t.recipeUrl && x.timerIndex === t.timerIndex,
        );
        if (fresh && !fresh.upperChimePlayed) {
          fresh.upperChimePlayed = true;
          fresh.updatedAt = now;
          saveStoredTimers(latestTimers);
          playUpperBoundChime();
          t.upperChimePlayed = true;
        }
      }
    }
  });

  updateUI();

  const hasRunning = timers.some((t) => t.status === 'running');
  if (!hasRunning) {
    stopGlobalTick();
  }
}

function syncFromStorage(): void {
  const timers = getStoredTimers();

  const cleaned = cleanupStoredTimers(timers);
  if (cleaned.length !== timers.length) {
    saveStoredTimers(cleaned);
  }

  updateWakeLockState(cleaned);
  updateUI();

  const hasRunning = cleaned.some((t) => t.status === 'running');
  if (hasRunning) {
    startGlobalTickIfNeeded();
  } else {
    stopGlobalTick();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncFromStorage();
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      syncFromStorage();
    }
  });

  const unblock = () => {
    initAudio();
    document.removeEventListener('click', unblock);
    document.removeEventListener('touchstart', unblock);
  };
  document.addEventListener('click', unblock, { passive: true });
  document.addEventListener('touchstart', unblock, { passive: true });
}

export function initTimers(): void {
  const titleEl = document.querySelector('.recipe-title-bar h1');
  recipeTitle =
    (titleEl ? titleEl.textContent?.trim() : '') ||
    window.location.pathname.split('/').filter(Boolean).pop() ||
    '';
  recipeUrl = window.location.pathname;

  const timerEls = document.querySelectorAll<HTMLElement>('.recipe-timer');
  inlineTimers = [];

  timerEls.forEach((timerContainer, index) => {
    const rawDuration = timerContainer.dataset.duration;
    if (!rawDuration) {
      return;
    }

    const parsed = parseDuration(rawDuration);
    if (!parsed) {
      return;
    }

    const btn = timerContainer.querySelector<HTMLElement>('.recipe-timer-btn');
    const resetBtn = timerContainer.querySelector<HTMLElement>(
      '.recipe-timer-reset',
    );
    if (!btn || !resetBtn) {
      return;
    }

    const labelSpan = btn.querySelector<HTMLElement>('.timer-label');
    if (!labelSpan) {
      return;
    }

    // Measure inactive width of the container
    const inactiveWidth = timerContainer.getBoundingClientRect().width;

    // Temporarily apply active state to measure active width
    const originalText = labelSpan.textContent || '';
    labelSpan.textContent = formatTime(parsed.maxSeconds);
    timerContainer.classList.add('has-started');
    const activeWidth = timerContainer.getBoundingClientRect().width;

    // Restore original state
    timerContainer.classList.remove('has-started');
    labelSpan.textContent = originalText;

    // Lock width to the maximum to prevent dynamic resizing / reflows
    if (inactiveWidth > 0 && activeWidth > 0) {
      const lockedWidth = Math.ceil(Math.max(inactiveWidth, activeWidth));
      timerContainer.style.width = `${lockedWidth}px`;
    }

    inlineTimers.push({
      element: timerContainer,
      btn,
      resetBtn,
      labelSpan,
      minSeconds: parsed.minSeconds,
      maxSeconds: parsed.maxSeconds,
      rawDuration,
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      initAudio();
      handleInlinePlayPause(index);
    });

    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleInlineReset(index);
    });
  });

  syncFromStorage();
}

import { writable } from 'svelte/store';
import { playLowerBoundChime, playUpperBoundChime, stopAudio } from '../audio';
import { OverlayContainer } from '../components/overlay-container';

export interface TimerState {
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

const STORAGE_KEY = 'noonarby-casa-timers';

function getStoredTimers(): TimerState[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored timers:', e);
  }
  return [];
}

function saveStoredTimers(timers: TimerState[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
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

    const updatedAt = t.updatedAt || t.startedAt || now;
    if (now - updatedAt > 12 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  });
}

function syncOverlayUI(timers: TimerState[]) {
  if (typeof window === 'undefined') {
    return;
  }
  const recipeUrl = window.location.pathname;
  const dashboardTimers = timers.filter((t) => t.recipeUrl !== recipeUrl);
  if (dashboardTimers.length === 0) {
    return;
  }

  const now = Date.now();
  let hasExpired = false;
  let hasInRange = false;
  let hasRunning = false;

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

  OverlayContainer.getInstance().updateDashboardFabState(
    hasExpired,
    hasInRange,
    hasRunning,
  );
}

function createTimersStore() {
  const initial = getStoredTimers();
  const { subscribe, set, update } = writable<{
    list: TimerState[];
    now: number;
  }>({
    list: initial,
    now: Date.now(),
  });

  let tickIntervalId: any = null;
  let wakeLock: WakeLockSentinel | null = null;
  let lastRunningKeys = new Set<string>();

  async function requestWakeLock() {
    if (typeof navigator === 'undefined' || !navigator.wakeLock || wakeLock) {
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

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  function updateWakeLock(timers: TimerState[]) {
    const hasRunning = timers.some((t) => t.status === 'running');
    if (hasRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }

  function syncWithStorage() {
    const timers = getStoredTimers();
    const cleaned = cleanupStoredTimers(timers);
    if (cleaned.length !== timers.length) {
      saveStoredTimers(cleaned);
    }
    set({ list: cleaned, now: Date.now() });
    updateWakeLock(cleaned);
    manageTick(cleaned);
    manageAudio(cleaned);
    syncOverlayUI(cleaned);
  }

  function manageAudio(timers: TimerState[]) {
    const currentRunning = new Set(
      timers
        .filter((t) => t.status === 'running')
        .map((t) => `${t.recipeUrl}-${t.timerIndex}`),
    );
    let stoppedRunning = false;
    for (const key of lastRunningKeys) {
      if (!currentRunning.has(key)) {
        stoppedRunning = true;
        break;
      }
    }
    lastRunningKeys = currentRunning;
    if (stoppedRunning) {
      stopAudio();
    }
  }

  function manageTick(timers: TimerState[]) {
    const hasRunning = timers.some((t) => t.status === 'running');
    if (hasRunning && !tickIntervalId) {
      tickIntervalId = setInterval(() => {
        tick();
      }, 1000);
    } else if (!hasRunning && tickIntervalId) {
      clearInterval(tickIntervalId);
      tickIntervalId = null;
    }
  }

  function tick() {
    update((_state) => {
      const now = Date.now();
      const currentList = getStoredTimers();
      const nextTimers = currentList.map((t) => {
        if (t.status !== 'running' || t.startedAt === null) {
          return t;
        }

        const elapsed =
          t.elapsedBeforeStart + Math.floor((now - t.startedAt) / 1000);
        const updated = { ...t };

        if (t.minSeconds === t.maxSeconds) {
          if (elapsed >= t.maxSeconds && !t.upperChimePlayed) {
            updated.upperChimePlayed = true;
            updated.updatedAt = now;
            playUpperBoundChime();
            OverlayContainer.getInstance().expand();
          }
        } else {
          if (elapsed >= t.minSeconds && !t.lowerChimePlayed) {
            updated.lowerChimePlayed = true;
            updated.updatedAt = now;
            playLowerBoundChime();
          }
          if (elapsed >= t.maxSeconds && !t.upperChimePlayed) {
            updated.upperChimePlayed = true;
            updated.updatedAt = now;
            playUpperBoundChime();
            OverlayContainer.getInstance().expand();
          }
        }
        return updated;
      });

      saveStoredTimers(nextTimers);
      updateWakeLock(nextTimers);
      syncOverlayUI(nextTimers);
      return { list: nextTimers, now };
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        syncWithStorage();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncWithStorage();
      }
    });
  }

  return {
    subscribe,
    syncWithStorage,
    startTimer(
      recipeTitle: string,
      recipeUrl: string,
      index: number,
      rawDuration: string,
      minSec: number,
      maxSec: number,
    ) {
      update((state) => {
        const now = Date.now();
        const existingIdx = state.list.findIndex(
          (t) => t.recipeUrl === recipeUrl && t.timerIndex === index,
        );
        const next = [...state.list];

        if (existingIdx !== -1) {
          const t = { ...next[existingIdx] };
          if (t.status === 'running') {
            const elapsed =
              t.elapsedBeforeStart + Math.floor((now - t.startedAt!) / 1000);
            t.status = 'paused';
            t.elapsedBeforeStart = elapsed;
            t.startedAt = null;
          } else {
            t.status = 'running';
            t.startedAt = now;
          }
          t.updatedAt = now;
          next[existingIdx] = t;
        } else {
          next.push({
            recipeTitle,
            recipeUrl,
            timerIndex: index,
            durationLabel: rawDuration,
            minSeconds: minSec,
            maxSeconds: maxSec,
            startedAt: now,
            elapsedBeforeStart: 0,
            status: 'running',
            lowerChimePlayed: false,
            upperChimePlayed: false,
            updatedAt: now,
          });
        }
        saveStoredTimers(next);
        updateWakeLock(next);
        manageTick(next);
        manageAudio(next);
        syncOverlayUI(next);
        return { list: next, now };
      });
    },
    resetTimer(recipeUrl: string, index: number) {
      update((state) => {
        const next = state.list.filter(
          (t) => !(t.recipeUrl === recipeUrl && t.timerIndex === index),
        );
        saveStoredTimers(next);
        updateWakeLock(next);
        manageTick(next);
        manageAudio(next);
        syncOverlayUI(next);
        return { list: next, now: Date.now() };
      });
    },
    clearAllForRecipe(recipeUrl: string) {
      update((state) => {
        const next = state.list.filter((t) => t.recipeUrl !== recipeUrl);
        saveStoredTimers(next);
        updateWakeLock(next);
        manageTick(next);
        manageAudio(next);
        syncOverlayUI(next);
        return { list: next, now: Date.now() };
      });
    },
  };
}

export const timersStore = createTimersStore();

import { initAudio, playLowerBoundChime, playUpperBoundChime } from "./audio";

interface ParsedDuration {
  minSeconds: number;
  maxSeconds: number;
}

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
  if (unit.startsWith("h")) {
    multiplier = 3600;
  } else if (unit.startsWith("m")) {
    multiplier = 60;
  } else if (unit.startsWith("s")) {
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

  let display = "";
  if (hrs > 0) {
    display += `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    display += `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return isNegative ? `-${display}` : display;
}

export function initTimers(): void {
  const timers = document.querySelectorAll<HTMLElement>(".recipe-timer");

  timers.forEach((timerContainer) => {
    const rawDuration = timerContainer.dataset.duration;
    if (!rawDuration) return;

    const parsed = parseDuration(rawDuration);
    if (!parsed) {
      console.warn(`Could not parse duration: "${rawDuration}"`);
      return;
    }

    const { minSeconds, maxSeconds } = parsed;
    let elapsed = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const btn = timerContainer.querySelector<HTMLElement>(".recipe-timer-btn");
    const resetBtn = timerContainer.querySelector<HTMLElement>(
      ".recipe-timer-reset",
    );
    if (!btn || !resetBtn) return;

    const labelSpan = btn.querySelector<HTMLElement>(".timer-label");
    if (!labelSpan) return;

    function updateDisplay(): void {
      if (!labelSpan || !rawDuration) return;
      const remaining = maxSeconds - elapsed;

      if (elapsed === 0) {
        labelSpan.textContent = rawDuration;
        timerContainer.classList.remove(
          "has-started",
          "is-running",
          "is-in-range",
          "is-beyond-range",
        );
        return;
      }

      labelSpan.textContent = formatTime(remaining);

      if (elapsed > maxSeconds) {
        timerContainer.classList.add("is-beyond-range");
        timerContainer.classList.remove("is-in-range");
      } else if (elapsed >= minSeconds) {
        timerContainer.classList.add("is-in-range");
        timerContainer.classList.remove("is-beyond-range");
      } else {
        timerContainer.classList.remove("is-in-range", "is-beyond-range");
      }

      timerContainer.classList.add("has-started");
      if (intervalId) {
        timerContainer.classList.add("is-running");
      } else {
        timerContainer.classList.remove("is-running");
      }
    }

    function startTimer(): void {
      if (intervalId) return;
      intervalId = setInterval(() => {
        elapsed++;
        updateDisplay();

        // Sound alert triggers when crossing bounds
        if (minSeconds === maxSeconds) {
          if (elapsed === maxSeconds) {
            playUpperBoundChime();
          }
        } else {
          if (elapsed === minSeconds) {
            playLowerBoundChime();
          } else if (elapsed === maxSeconds) {
            playUpperBoundChime();
          }
        }
      }, 1000);
      updateDisplay();
    }

    function pauseTimer(): void {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
      updateDisplay();
    }

    function resetTimer(): void {
      pauseTimer();
      elapsed = 0;
      updateDisplay();
    }

    btn.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      initAudio(); // Initialize audio context on user interaction
      if (intervalId) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    resetBtn.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetTimer();
    });
  });
}

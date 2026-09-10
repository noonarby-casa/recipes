export interface ParsedDuration {
  minSeconds: number;
  maxSeconds: number;
}

const UNIT_MULTIPLIERS: Record<string, number> = {
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
};

/**
 * Parses a single duration segment such as "5 mins", "1.5 hours", "1 hr 15 mins", or "45s".
 */
export function parseSingleSegment(segment: string): number | null {
  const str = segment.trim().toLowerCase();
  if (!str) {
    return null;
  }

  const partRegex =
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
  let totalSeconds = 0;
  let matchedAny = false;

  const stripped = str.replace(partRegex, (_m, valStr, unitStr) => {
    matchedAny = true;
    const val = parseFloat(valStr);
    const unit = unitStr.toLowerCase();
    const multiplier = UNIT_MULTIPLIERS[unit] ?? 1;
    totalSeconds += val * multiplier;
    return '';
  });

  if (matchedAny && stripped.trim() === '') {
    return Math.round(totalSeconds);
  }

  return null;
}

/**
 * Parses a duration string (single or range) into minSeconds and maxSeconds.
 * Supports hyphens (-), en-dash (–), em-dash (—), or 'to' separators,
 * with shared or independent units (e.g. "10-15 mins", "10 to 15 mins", "45s to 1m").
 *
 * @example parseDuration("5 minutes") // { minSeconds: 300, maxSeconds: 300 }
 * @example parseDuration("10 to 15 mins") // { minSeconds: 600, maxSeconds: 900 }
 * @example parseDuration("45s to 1m") // { minSeconds: 45, maxSeconds: 60 }
 */
export function parseDuration(raw: string): ParsedDuration | null {
  const str = raw.trim().toLowerCase();
  if (!str) {
    return null;
  }

  // Check for range separators: hyphen, en-dash, em-dash, or 'to'
  const rangeRegex = /^(.*?)(?:\s*(?:-|–|—|\bto\b)\s*)(.+)$/i;
  const rangeMatch = str.match(rangeRegex);

  if (rangeMatch) {
    const leftRaw = (rangeMatch[1] ?? '').trim();
    const rightRaw = (rangeMatch[2] ?? '').trim();

    // 1. Check if both sides have explicit units (e.g., "45s to 1m", "1 hr to 90 mins")
    const leftParsed = parseSingleSegment(leftRaw);
    const rightParsed = parseSingleSegment(rightRaw);

    if (leftParsed !== null && rightParsed !== null) {
      return {
        minSeconds: Math.min(leftParsed, rightParsed),
        maxSeconds: Math.max(leftParsed, rightParsed),
      };
    }

    // 2. Check if left side is a bare number sharing the right side's unit (e.g., "10 to 15 mins", "1-2 hrs")
    const bareNumberMatch = leftRaw.match(/^(\d+(?:\.\d+)?)$/);
    if (bareNumberMatch) {
      const rightSingleMatch = rightRaw.match(
        /^(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)$/i,
      );
      if (rightSingleMatch) {
        const leftVal = parseFloat(bareNumberMatch[1] ?? '0');
        const rightVal = parseFloat(rightSingleMatch[1] ?? '0');
        const unit = (rightSingleMatch[2] ?? '').toLowerCase();
        const multiplier = UNIT_MULTIPLIERS[unit] ?? 1;

        const leftSeconds = Math.round(leftVal * multiplier);
        const rightSeconds = Math.round(rightVal * multiplier);

        return {
          minSeconds: Math.min(leftSeconds, rightSeconds),
          maxSeconds: Math.max(leftSeconds, rightSeconds),
        };
      }
    }
  }

  // 3. Fall back to parsing as a single duration
  const single = parseSingleSegment(str);
  if (single !== null) {
    return {
      minSeconds: single,
      maxSeconds: single,
    };
  }

  return null;
}

/**
 * Formats a duration in seconds to a human-readable countdown string.
 * Handles negative values (overdue timers), hours, minutes, and seconds.
 * @example formatTime(90)  // "1:30"
 * @example formatTime(-5)  // "-0:05"
 * @example formatTime(3661) // "1:01:01"
 */
export function formatTime(seconds: number): string {
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

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

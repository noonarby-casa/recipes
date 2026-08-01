/**
 * Date utility functions for the Date-Based Meal Planner & History feature.
 */

/**
 * Formats a Date object as an ISO date string: YYYY-MM-DD.
 */
export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) safely into a local Date object.
 */
export function parseIsoDate(str: string): Date {
  const parts = str.split('-').map((p) => parseInt(p, 10));
  if (parts.length < 3 || parts.some((p) => isNaN(p))) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Formats a Date object as a compact URL date string: YYYYMMDD.
 */
export function formatUrlDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Parses a compact URL date string (YYYYMMDD) into a local Date object.
 */
export function parseUrlDate(str: string): Date | null {
  if (!str || str.length !== 8) {
    return null;
  }
  const y = parseInt(str.slice(0, 4), 10);
  const m = parseInt(str.slice(4, 6), 10);
  const d = parseInt(str.slice(6, 8), 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return null;
  }
  return new Date(y, m - 1, d);
}

/**
 * Returns a new Date shifted by the given number of days (+/-).
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns the Monday of the week containing the given date.
 */
export function getMondayOfWeek(refDate?: Date): Date {
  const date = refDate ? new Date(refDate.getTime()) : new Date();
  const day = date.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns the Friday of the week containing the given date.
 */
export function getFridayOfWeek(refDate?: Date): Date {
  const mon = getMondayOfWeek(refDate);
  return addDays(mon, 4);
}

/**
 * Returns an array of ISO date strings ('YYYY-MM-DD') for a given start date & duration in days.
 */
export function getDateSequence(
  startDateStr: string,
  durationDays: number,
): string[] {
  const start = parseIsoDate(startDateStr);
  const dates: string[] = [];
  for (let i = 0; i < durationDays; i++) {
    dates.push(formatIsoDate(addDays(start, i)));
  }
  return dates;
}

/**
 * Formats a date string ('YYYY-MM-DD') for a day column header: "Monday, Aug 3".
 */
export function formatDayTitle(dateStr: string): string {
  if (dateStr === 'supplemental') {
    return 'Anytime / Supplemental';
  }
  const date = parseIsoDate(dateStr);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = date.getDate();
  return `${dayName}, ${monthName} ${dayNum}`;
}

/**
 * Formats a date range for display: e.g. "Aug 3 – Aug 7, 2026 (5 days)".
 */
export function formatDateRangeLabel(
  startDateStr: string,
  durationDays: number,
): string {
  const start = parseIsoDate(startDateStr);
  const end = addDays(start, Math.max(1, durationDays) - 1);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();

  const rangeText =
    start.getMonth() === end.getMonth()
      ? `${startMonth} ${startDay} – ${endDay}, ${year}`
      : `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;

  const dayWord = durationDays === 1 ? 'day' : 'days';
  return `${rangeText} (${durationDays} ${dayWord})`;
}

/**
 * Returns a 7-column matrix (Sunday-start) for a given year and 0-indexed month.
 * Null values represent padding cells before/after the month days.
 */
export function getCalendarMonthMatrix(
  year: number,
  monthZeroIndexed: number,
): (Date | null)[][] {
  const firstDay = new Date(year, monthZeroIndexed, 1);
  const lastDay = new Date(year, monthZeroIndexed + 1, 0);

  const matrix: (Date | null)[][] = [];
  let currentRow: (Date | null)[] = [];

  // Sunday is 0
  const startDayOfWeek = firstDay.getDay();

  // Fill initial padding
  for (let i = 0; i < startDayOfWeek; i++) {
    currentRow.push(null);
  }

  const totalDays = lastDay.getDate();
  for (let day = 1; day <= totalDays; day++) {
    currentRow.push(new Date(year, monthZeroIndexed, day));
    if (currentRow.length === 7) {
      matrix.push(currentRow);
      currentRow = [];
    }
  }

  // Fill trailing padding
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null);
    }
    matrix.push(currentRow);
  }

  return matrix;
}

import { describe, expect, it } from 'vitest';
import {
  formatDateRangeLabel,
  formatDayTitle,
  formatIsoDate,
  getCalendarMonthMatrix,
  getDateSequence,
  getMondayOfWeek,
} from './dates';

describe('dates utility', () => {
  it('formats single day range with weekday and no commas', () => {
    const label = formatDateRangeLabel('2026-08-03', 1);
    expect(label).toBe('M Aug 3 (1d)');
  });

  it('formats multi-day range within the same month', () => {
    const label = formatDateRangeLabel('2026-08-03', 5);
    expect(label).toBe('M Aug 3 – F Aug 7 (5d)');
  });

  it('formats multi-day range spanning across months', () => {
    const label = formatDateRangeLabel('2026-08-28', 7);
    expect(label).toBe('F Aug 28 – Th Sep 3 (7d)');
  });

  it('formats multi-day range spanning across years', () => {
    const label = formatDateRangeLabel('2026-12-28', 5);
    expect(label).toBe('M Dec 28 2026 – F Jan 1 2027 (5d)');
  });

  it('calculates getMondayOfWeek correctly', () => {
    // 2026-08-05 is Wednesday -> Monday is 2026-08-03
    const wed = new Date(2026, 7, 5);
    const mon = getMondayOfWeek(wed);
    expect(formatIsoDate(mon)).toBe('2026-08-03');

    // 2026-08-09 is Sunday -> Monday is 2026-08-03
    const sun = new Date(2026, 7, 9);
    const monFromSun = getMondayOfWeek(sun);
    expect(formatIsoDate(monFromSun)).toBe('2026-08-03');
  });

  it('generates date sequence for a given range', () => {
    const seq = getDateSequence('2026-08-03', 3);
    expect(seq).toEqual(['2026-08-03', '2026-08-04', '2026-08-05']);
  });

  it('generates 7-column Sunday-start month matrix', () => {
    // August 2026 starts on Saturday (Aug 1, 2026)
    const matrix = getCalendarMonthMatrix(2026, 7);
    expect(matrix.length).toBeGreaterThanOrEqual(5);
    expect(matrix[0].length).toBe(7);

    // Saturday is index 6
    expect(matrix[0][0]).toBeNull();
    expect(matrix[0][6]?.getDate()).toBe(1);
  });

  it('formats day title with 3-letter day abbreviation', () => {
    expect(formatDayTitle('2026-08-03')).toBe('Mon, Aug 3');
    expect(formatDayTitle('2026-08-04')).toBe('Tue, Aug 4');
    expect(formatDayTitle('2026-08-05')).toBe('Wed, Aug 5');
    expect(formatDayTitle('2026-08-06')).toBe('Thu, Aug 6');
    expect(formatDayTitle('2026-08-07')).toBe('Fri, Aug 7');
    expect(formatDayTitle('2026-08-08')).toBe('Sat, Aug 8');
    expect(formatDayTitle('2026-08-09')).toBe('Sun, Aug 9');
  });

  it('formats supplemental day title correctly', () => {
    expect(formatDayTitle('supplemental')).toBe('Anytime / Supplemental');
  });
});

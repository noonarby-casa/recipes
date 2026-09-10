import { describe, expect, it } from 'vitest';
import { formatTime, parseDuration, parseSingleSegment } from './timer';

describe('timer utility', () => {
  describe('formatTime', () => {
    it('formats seconds into mm:ss', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(600)).toBe('10:00');
    });

    it('formats hours into h:mm:ss', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7320)).toBe('2:02:00');
    });

    it('formats negative (overdue) seconds', () => {
      expect(formatTime(-5)).toBe('-0:05');
      expect(formatTime(-65)).toBe('-1:05');
      expect(formatTime(-3665)).toBe('-1:01:05');
    });
  });

  describe('parseSingleSegment', () => {
    it('parses seconds in various forms', () => {
      expect(parseSingleSegment('5s')).toBe(5);
      expect(parseSingleSegment('10 sec')).toBe(10);
      expect(parseSingleSegment('15 secs')).toBe(15);
      expect(parseSingleSegment('30 second')).toBe(30);
      expect(parseSingleSegment('45 seconds')).toBe(45);
    });

    it('parses minutes in various forms', () => {
      expect(parseSingleSegment('5m')).toBe(300);
      expect(parseSingleSegment('10 min')).toBe(600);
      expect(parseSingleSegment('15 mins')).toBe(900);
      expect(parseSingleSegment('20 minute')).toBe(1200);
      expect(parseSingleSegment('25 minutes')).toBe(1500);
    });

    it('parses hours in various forms', () => {
      expect(parseSingleSegment('1h')).toBe(3600);
      expect(parseSingleSegment('2 hr')).toBe(7200);
      expect(parseSingleSegment('3 hrs')).toBe(10800);
      expect(parseSingleSegment('1 hour')).toBe(3600);
      expect(parseSingleSegment('2 hours')).toBe(7200);
    });

    it('parses decimal values', () => {
      expect(parseSingleSegment('1.5 hrs')).toBe(5400);
      expect(parseSingleSegment('2.5s')).toBe(3); // Math.round(2.5) -> 3
      expect(parseSingleSegment('0.1 minutes')).toBe(6);
    });

    it('parses compound segments', () => {
      expect(parseSingleSegment('1 hour 15 mins')).toBe(4500);
      expect(parseSingleSegment('1h 30m')).toBe(5400);
      expect(parseSingleSegment('2 min 30 sec')).toBe(150);
    });

    it('returns null for invalid inputs', () => {
      expect(parseSingleSegment('')).toBeNull();
      expect(parseSingleSegment('invalid')).toBeNull();
      expect(parseSingleSegment('5')).toBeNull();
    });
  });

  describe('parseDuration', () => {
    it('parses single duration strings', () => {
      expect(parseDuration('5 seconds')).toEqual({
        minSeconds: 5,
        maxSeconds: 5,
      });
      expect(parseDuration('10m')).toEqual({
        minSeconds: 600,
        maxSeconds: 600,
      });
      expect(parseDuration('1.5 hours')).toEqual({
        minSeconds: 5400,
        maxSeconds: 5400,
      });
    });

    it('parses hyphen range strings with shared unit', () => {
      expect(parseDuration('3-6 seconds')).toEqual({
        minSeconds: 3,
        maxSeconds: 6,
      });
      expect(parseDuration('10-15 mins')).toEqual({
        minSeconds: 600,
        maxSeconds: 900,
      });
      expect(parseDuration('1-2 hrs')).toEqual({
        minSeconds: 3600,
        maxSeconds: 7200,
      });
      expect(parseDuration('1.5-3.5 seconds')).toEqual({
        minSeconds: 2,
        maxSeconds: 4,
      });
    });

    it('parses "to" range strings with shared unit', () => {
      expect(parseDuration('3 to 6 seconds')).toEqual({
        minSeconds: 3,
        maxSeconds: 6,
      });
      expect(parseDuration('10 to 15 mins')).toEqual({
        minSeconds: 600,
        maxSeconds: 900,
      });
      expect(parseDuration('15 to 20 minutes')).toEqual({
        minSeconds: 900,
        maxSeconds: 1200,
      });
      expect(parseDuration('1.5 to 2 hours')).toEqual({
        minSeconds: 5400,
        maxSeconds: 7200,
      });
      expect(parseDuration('1 to 2 hrs')).toEqual({
        minSeconds: 3600,
        maxSeconds: 7200,
      });
    });

    it('parses en-dash and em-dash range strings', () => {
      expect(parseDuration('3–6 seconds')).toEqual({
        minSeconds: 3,
        maxSeconds: 6,
      });
      expect(parseDuration('10—15 mins')).toEqual({
        minSeconds: 600,
        maxSeconds: 900,
      });
    });

    it('parses dual-unit range strings', () => {
      expect(parseDuration('45s to 1m')).toEqual({
        minSeconds: 45,
        maxSeconds: 60,
      });
      expect(parseDuration('45 sec to 1 min')).toEqual({
        minSeconds: 45,
        maxSeconds: 60,
      });
      expect(parseDuration('1 hr to 90 mins')).toEqual({
        minSeconds: 3600,
        maxSeconds: 5400,
      });
      expect(parseDuration('1 hr - 90 mins')).toEqual({
        minSeconds: 3600,
        maxSeconds: 5400,
      });
      expect(parseDuration('1 hour to 1 hour 15 mins')).toEqual({
        minSeconds: 3600,
        maxSeconds: 4500,
      });
    });

    it('returns null for unparseable strings', () => {
      expect(parseDuration('')).toBeNull();
      expect(parseDuration('undefined')).toBeNull();
      expect(parseDuration('until golden')).toBeNull();
      expect(parseDuration('5')).toBeNull();
    });
  });
});

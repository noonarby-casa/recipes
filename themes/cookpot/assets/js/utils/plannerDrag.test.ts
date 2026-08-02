// @vitest-environment jsdom
import { describe, expect, test, beforeAll } from 'vitest';
import {
  isControlTarget,
  movePlannedItem,
  findTargetDayColumn,
} from './plannerDrag';
import type { PlannedItem } from '../types';

beforeAll(() => {
  if (typeof document.elementFromPoint !== 'function') {
    document.elementFromPoint = () => null;
  }
});

describe('plannerDrag utils', () => {
  describe('isControlTarget', () => {
    test('returns false for null element', () => {
      expect(isControlTarget(null)).toBe(false);
    });

    test('returns true for button element or child of button', () => {
      const btn = document.createElement('button');
      const span = document.createElement('span');
      btn.appendChild(span);
      document.body.appendChild(btn);

      expect(isControlTarget(btn)).toBe(true);
      expect(isControlTarget(span)).toBe(true);

      document.body.removeChild(btn);
    });

    test('returns true for control classes', () => {
      const div = document.createElement('div');
      div.className = 'recipe-control-btn';
      document.body.appendChild(div);

      expect(isControlTarget(div)).toBe(true);

      document.body.removeChild(div);
    });

    test('returns false for recipe image or title', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'recipe-card-media-wrapper';
      const img = document.createElement('img');
      img.className = 'recipe-card-img';
      wrapper.appendChild(img);
      document.body.appendChild(wrapper);

      expect(isControlTarget(wrapper)).toBe(false);
      expect(isControlTarget(img)).toBe(false);

      document.body.removeChild(wrapper);
    });
  });

  describe('findTargetDayColumn', () => {
    test('finds day column by proximity when point is slightly outside rect', () => {
      const dayCol = document.createElement('div');
      dayCol.className = 'day-column';
      dayCol.dataset.day = 'tue';
      dayCol.getBoundingClientRect = () => ({
        top: 100,
        left: 100,
        bottom: 300,
        right: 250,
        width: 150,
        height: 200,
        x: 100,
        y: 100,
        toJSON: () => {},
      });
      document.body.appendChild(dayCol);

      // Point at (260, 150) is 10px right of dayCol
      const result = findTargetDayColumn(260, 150, 40);
      expect(result.dayCol).toBe(dayCol);

      document.body.removeChild(dayCol);
    });
  });

  describe('movePlannedItem', () => {
    const samplePlan: PlannedItem[] = [
      { instanceId: '1', date: 'mon', permalink: '/rec-1/', scale: 1 },
      { instanceId: '2', date: 'mon', permalink: '/rec-2/', scale: 1 },
      { instanceId: '3', date: 'tue', permalink: '/rec-3/', scale: 1 },
      { instanceId: '4', date: 'wed', permalink: '/rec-4/', scale: 1 },
    ];

    test('moves item to another day at the end of that day group', () => {
      const result = movePlannedItem(samplePlan, '1', 'tue');
      expect(result.find((p) => p.instanceId === '1')?.date).toBe('tue');
      const tueItems = result.filter((p) => (p.date || p.day) === 'tue');
      expect(tueItems.map((p) => p.instanceId)).toEqual(['3', '1']);
    });

    test('moves item to another day before a target item', () => {
      const result = movePlannedItem(samplePlan, '1', 'tue', '3');
      expect(result.find((p) => p.instanceId === '1')?.date).toBe('tue');
      const tueItems = result.filter((p) => (p.date || p.day) === 'tue');
      expect(tueItems.map((p) => p.instanceId)).toEqual(['1', '3']);
    });

    test('reorders item within the same day', () => {
      const result = movePlannedItem(samplePlan, '2', 'mon', '1');
      const monItems = result.filter((p) => (p.date || p.day) === 'mon');
      expect(monItems.map((p) => p.instanceId)).toEqual(['2', '1']);
    });

    test('moves item to empty day', () => {
      const result = movePlannedItem(samplePlan, '1', 'thu');
      expect(result.find((p) => p.instanceId === '1')?.date).toBe('thu');
      const thuItems = result.filter((p) => (p.date || p.day) === 'thu');
      expect(thuItems.map((p) => p.instanceId)).toEqual(['1']);
    });

    test('returns original plan if instanceId is not found', () => {
      const result = movePlannedItem(samplePlan, 'non-existent', 'tue');
      expect(result).toEqual(samplePlan);
    });
  });
});

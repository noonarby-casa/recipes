import { describe, expect, test } from 'vitest';
import { executePlanUrlSync, ParsePlanUrlStep } from './planSyncPipeline';

describe('planSyncPipeline', () => {
  test('executes plan URL sync step pipeline', () => {
    const result = executePlanUrlSync('', []);
    expect(result.plan).toEqual([]);
    expect(result.workWeekOnly).toBe(true);
    expect(result.activeTab).toBe('view');
    expect(result.hasValidParams).toBe(false);
  });

  test('ParsePlanUrlStep processes empty search params cleanly', () => {
    const step = new ParsePlanUrlStep();
    const result = step.process([{ searchString: '', recipes: [] }]);
    expect(result[0].parsedPlan).toEqual([]);
    expect(result[0].hasValidParams).toBe(false);
  });
});

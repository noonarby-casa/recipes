import type { PlannedItem, Recipe } from '../types';
import { RulePipeline, type RuleStep } from './RulePipeline';
import { parsePlanUrlParams } from '../stores/planUrlSync';

export interface PlanUrlSyncData {
  searchString: string;
  recipes: Recipe[];
  parsedPlan?: PlannedItem[];
  workWeekOnly?: boolean;
  activeTab?: 'edit' | 'view' | 'shop';
  hasValidParams?: boolean;
}

export class ParsePlanUrlStep implements RuleStep<PlanUrlSyncData> {
  readonly name = 'ParsePlanUrlStep';

  process(items: PlanUrlSyncData[]): PlanUrlSyncData[] {
    return items.map((item) => {
      const parsed = parsePlanUrlParams(item.recipes, item.searchString);
      return {
        ...item,
        parsedPlan: parsed.plan,
        workWeekOnly: parsed.workWeekOnly,
        activeTab: parsed.activeTab,
        hasValidParams: parsed.hasValidParams,
      };
    });
  }
}

/**
 * Pipeline for decoding, validating, and hydrating meal planner state from URL parameters.
 */
export function executePlanUrlSync(
  searchString: string,
  recipes: Recipe[],
): {
  plan: PlannedItem[];
  workWeekOnly: boolean;
  activeTab: 'edit' | 'view' | 'shop';
  hasValidParams: boolean;
} {
  const pipeline = new RulePipeline<PlanUrlSyncData>().use(
    new ParsePlanUrlStep(),
  );

  const result = pipeline.execute([{ searchString, recipes }]);
  const data = result[0];

  return {
    plan: data?.parsedPlan ?? [],
    workWeekOnly: data?.workWeekOnly ?? true,
    activeTab: data?.activeTab ?? 'view',
    hasValidParams: data?.hasValidParams ?? false,
  };
}

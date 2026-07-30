import type { RuleStep } from '../core/RulePipeline';

export class FilterIngredientsStep<T> implements RuleStep<T> {
  readonly name = 'FilterIngredientsStep';
  private predicate: (item: T) => boolean;

  constructor(predicate: (item: T) => boolean) {
    this.predicate = predicate;
  }

  process(items: T[]): T[] {
    return items.filter(this.predicate);
  }
}

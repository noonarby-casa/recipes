import type { ShoppingItem } from '../types';

export interface RuleStep<TItem = ShoppingItem> {
  /** Name of the transformation step for logging/debugging. */
  readonly name: string;
  /** Processing function that takes items and returns transformed items. */
  process(items: TItem[]): TItem[];
}

/**
 * Sequential step-by-step pipeline executor for domain item transformations.
 */
export class RulePipeline<TItem = ShoppingItem> {
  private steps: RuleStep<TItem>[] = [];

  /** Add a transformation step to the execution pipeline. */
  use(step: RuleStep<TItem>): this {
    this.steps.push(step);
    return this;
  }

  /** Execute all registered steps sequentially on the given items array. */
  execute(initialItems: TItem[]): TItem[] {
    return this.steps.reduce(
      (items, step) => step.process(items),
      initialItems,
    );
  }
}

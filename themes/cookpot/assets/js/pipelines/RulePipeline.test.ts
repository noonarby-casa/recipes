import { describe, expect, test } from 'vitest';
import { RulePipeline, type RuleStep } from './RulePipeline';

interface MockItem {
  id: number;
  val: string;
}

class AppendStep implements RuleStep<MockItem> {
  readonly name = 'AppendStep';
  private suffix: string;

  constructor(suffix: string) {
    this.suffix = suffix;
  }

  process(items: MockItem[]): MockItem[] {
    return items.map((i) => ({ ...i, val: i.val + this.suffix }));
  }
}

describe('RulePipeline', () => {
  test('executes steps sequentially in order', () => {
    const pipeline = new RulePipeline<MockItem>()
      .use(new AppendStep('-A'))
      .use(new AppendStep('-B'));

    const input: MockItem[] = [{ id: 1, val: 'start' }];
    const result = pipeline.execute(input);

    expect(result).toEqual([{ id: 1, val: 'start-A-B' }]);
  });

  test('handles empty steps list', () => {
    const pipeline = new RulePipeline<MockItem>();
    const input: MockItem[] = [{ id: 1, val: 'test' }];
    expect(pipeline.execute(input)).toEqual([{ id: 1, val: 'test' }]);
  });
});

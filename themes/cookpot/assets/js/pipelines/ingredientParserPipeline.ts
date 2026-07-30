import { parseRawUserInput, parseSimpleQty } from '../simple-parser';
import type { IngredientInput } from '../types';
import { RulePipeline, type RuleStep } from './RulePipeline';

export interface RawIngredientText {
  rawText: string;
  parsed?: Partial<IngredientInput>;
}

export class ParseRawTextStep implements RuleStep<RawIngredientText> {
  readonly name = 'ParseRawTextStep';

  process(items: RawIngredientText[]): RawIngredientText[] {
    return items.map((item) => {
      const parsed = parseRawUserInput(item.rawText);
      return {
        ...item,
        parsed: {
          item: parsed.item,
          qty: parsed.qty,
          unit: parsed.unit,
          desc: parsed.desc,
          prep: parsed.prep,
        },
      };
    });
  }
}

/**
 * Pipeline for parsing raw ingredient text into structured IngredientInput objects.
 */
export function parseIngredientText(text: string): IngredientInput {
  const pipeline = new RulePipeline<RawIngredientText>().use(
    new ParseRawTextStep(),
  );

  const result = pipeline.execute([{ rawText: text }]);
  const parsed = result[0]?.parsed ?? {};

  return {
    item: parsed.item ?? text.trim(),
    qty: parsed.qty,
    unit: parsed.unit ?? '',
    desc: parsed.desc,
    prep: parsed.prep,
  };
}

export { parseSimpleQty };

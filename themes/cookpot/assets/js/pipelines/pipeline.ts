import type {
  IngredientInput,
  ShoppingItem,
  ProcessedShoppingList,
} from '../types';
import { RulePipeline } from './RulePipeline';
import { FilterIngredientsStep } from './steps/FilterIngredientsStep';
import { StapleNormalizationStep } from './steps/StapleNormalizationStep';
import { GroupCanonicalIngredientsStep } from './steps/GroupCanonicalIngredientsStep';
import { AggregateQuantityStep } from './steps/AggregateQuantityStep';
import { PackageMatcherStep } from './steps/PackageMatcherStep';
import { getSectionForCategory } from './store-sections';
import type { StoreLayout } from '../types';

export function processShoppingList(
  ingredients: IngredientInput[],
  layout?: StoreLayout,
): ProcessedShoppingList {
  // Step 1: Filter water
  const filterStep = new FilterIngredientsStep<IngredientInput>(
    (ing) => ing.item.toLowerCase().trim() !== 'water',
  );
  const filteredIngredients = filterStep.process(ingredients);

  // Step 2: Group canonical ingredients
  const groupingStep = new GroupCanonicalIngredientsStep();
  const groupedIngredients = groupingStep.group(filteredIngredients);

  // Step 3: Aggregate quantities & notes into ShoppingItem[]
  const aggregationStep = new AggregateQuantityStep();
  const rawShoppingItems = aggregationStep.aggregate(groupedIngredients);

  // Step 4: Run post-aggregation item pipeline (PackageMatcher & StapleNormalization)
  const itemPipeline = new RulePipeline<ShoppingItem>()
    .use(new PackageMatcherStep(layout))
    .use(new StapleNormalizationStep());

  const processedShoppingItems = rawShoppingItems.map((entry) => {
    const [processed] = itemPipeline.execute([entry.item]);
    return {
      item: processed,
      isOptional: entry.isOptional,
    };
  });

  // Step 5: Partition into buy, optional, & staple items
  const buyItems: ShoppingItem[] = [];
  const optionalItems: ShoppingItem[] = [];
  const stapleItems: ShoppingItem[] = [];

  processedShoppingItems.forEach(({ item, isOptional }) => {
    if (item.staple === 'in-pantry') {
      stapleItems.push(item);
    } else if (isOptional) {
      optionalItems.push(item);
    } else {
      buyItems.push(item);
    }
  });

  // Step 6: Sort by store aisle order
  const sorter = (a: ShoppingItem, b: ShoppingItem) => {
    const secA = getSectionForCategory(a.category, layout);
    const secB = getSectionForCategory(b.category, layout);
    const orderA = secA?.order ?? 999;
    const orderB = secB?.order ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.item.localeCompare(b.item);
  };

  buyItems.sort(sorter);
  optionalItems.sort(sorter);
  stapleItems.sort(sorter);

  return { buyItems, optionalItems, stapleItems };
}

export function extractIngredientsFromDOM(
  scale: number,
  elements: NodeListOf<HTMLElement>,
): IngredientInput[] {
  const ingredients: IngredientInput[] = [];

  elements.forEach((el) => {
    const rawQty = el.dataset.qty;
    let qty: number | [number, number] | undefined = undefined;
    if (rawQty) {
      if (rawQty.includes('-') || rawQty.includes(',')) {
        const parts = rawQty.split(/[-,]/).map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          qty = [parts[0] * scale, parts[1] * scale];
        } else {
          qty = (parseFloat(rawQty) || 0) * scale;
        }
      } else {
        qty = (parseFloat(rawQty) || 0) * scale;
      }
    }

    let alt: IngredientInput['alt'] = undefined;
    if (el.dataset.altItem) {
      let altQty: number | [number, number] | undefined = undefined;
      const rawAltQty = el.dataset.altQty;
      if (rawAltQty) {
        if (rawAltQty.includes('-') || rawAltQty.includes(',')) {
          const parts = rawAltQty
            .split(/[-,]/)
            .map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            altQty = [parts[0] * scale, parts[1] * scale];
          } else {
            altQty = (parseFloat(rawAltQty) || 0) * scale;
          }
        } else {
          altQty = (parseFloat(rawAltQty) || 0) * scale;
        }
      }
      alt = {
        item: el.dataset.altItem,
        qty: altQty,
        unit: el.dataset.altUnit,
        desc: el.dataset.altDesc,
        prep: el.dataset.altPrep,
      };
    }

    ingredients.push({
      item: el.dataset.item || el.textContent?.trim() || '',
      qty,
      unit: el.dataset.unit,
      desc: el.dataset.desc,
      prep: el.dataset.prep,
      optional: el.dataset.optional === 'true',
      alt,
      recipe:
        document.querySelector('.recipe-title-bar h1')?.textContent ||
        undefined,
    });
  });

  return ingredients;
}

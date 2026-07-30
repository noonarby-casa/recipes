import type { RuleStep } from '../RulePipeline';
import type { ValidationError } from '../../types';

export interface RecipeValidationContext {
  title?: string;
  yield?: string;
  image?: string;
  instructions?: string;
  errors?: ValidationError[];
}

export class ValidateRequiredFieldsStep implements RuleStep<RecipeValidationContext> {
  readonly name = 'ValidateRequiredFieldsStep';

  process(items: RecipeValidationContext[]): RecipeValidationContext[] {
    return items.map((ctx) => {
      const errors: ValidationError[] = ctx.errors ? [...ctx.errors] : [];
      if (!ctx.title?.trim()) {
        errors.push({
          message: 'Recipe title is required.',
          field: 'title',
          severity: 'error',
        });
      }
      return { ...ctx, errors };
    });
  }
}

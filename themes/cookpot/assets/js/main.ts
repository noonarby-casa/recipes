import { initFontSize } from './fontsize';
import { initRandomRecipe } from './random';
import { initShoppingList } from './shopping-list';
import { initDarkMode } from './darkmode';
import { initRecipePagePlanIntegration } from './meal-plan';
import { initScrollable } from './components/scrollable';
import { initStoreSelector } from './store-selector';

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initStoreSelector();
  initRecipePagePlanIntegration();
  initFontSize();
  initRandomRecipe();
  initShoppingList();
  initScrollable();
});

import { initScaler } from './scaler';
import { initTimers } from './timers';
import { initFontSize } from './fontsize';
import { initSearch } from './search';
import { initRandomRecipe } from './random';
import { initShoppingList } from './shopping-list';
import { initDarkMode } from './darkmode';
import { initMealPlanner, initRecipePagePlanIntegration } from './meal-plan';
import { initScrollable } from './components/scrollable';
import { initStoreSelector } from './store-selector';

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initStoreSelector();
  initRecipePagePlanIntegration();
  initScaler();
  initTimers();
  initFontSize();
  initSearch();
  initRandomRecipe();
  initShoppingList();
  initMealPlanner();
  initScrollable();
});

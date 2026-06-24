import { initScaler } from './scaler';
import { initTimers } from './timers';
import { initFontSize } from './fontsize';
import { initSearch } from './search';
import { initRandomRecipe } from './random';
import { initShoppingList } from './shopping-list';

document.addEventListener('DOMContentLoaded', () => {
  initScaler();
  initTimers();
  initFontSize();
  initSearch();
  initRandomRecipe();
  initShoppingList();
});

import { initScaler } from './scaler.js';
import { initTimers } from './timers.js';
import { initFontSize } from './fontsize.js';
import { initSearch } from './search.js';
import { initRandomRecipe } from './random.js';
import { initShoppingList } from './shopping-list.js';

document.addEventListener('DOMContentLoaded', () => {
  initScaler();
  initTimers();
  initFontSize();
  initSearch();
  initRandomRecipe();
  initShoppingList();
});

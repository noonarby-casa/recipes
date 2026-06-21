import { initScaler } from './scaler.js';
import { initTimers } from './timers.js';
import { initFontSize } from './fontsize.js';
import { initSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
  initScaler();
  initTimers();
  initFontSize();
  initSearch();
});

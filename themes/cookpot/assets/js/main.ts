import { initScaler } from "./scaler";
import { initTimers } from "./timers";
import { initFontSize } from "./fontsize";
import { initSearch } from "./search";
import { initRandomRecipe } from "./random";
import { initShoppingList } from "./shopping-list";
import { initDarkMode } from "./darkmode";
import { initMealPlanner, initRecipePageAddToPlan } from "./meal-plan";

document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initScaler();
  initTimers();
  initFontSize();
  initSearch();
  initRandomRecipe();
  initShoppingList();
  initMealPlanner();
  initRecipePageAddToPlan();
});

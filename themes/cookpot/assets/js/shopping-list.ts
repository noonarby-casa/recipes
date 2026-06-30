import { formatCookingNumber } from "./units";
import { processShoppingList } from "./shopping-list/pipeline";
import { ShoppingItem } from "./shopping-list/types";
import { formatNotesArray } from "./shopping-list/utils";
import { initToggleGroup } from "./components/toggle";

/**
 * Initializes the shopping list feature: selects DOM elements, sets up initial
 * state, registers tab toggles, clipboard listeners, and scaling listeners.
 */
export function initShoppingList(): void {
  const container = document.querySelector(".ingredients-column");
  if (!container) return;

  const btnRecipeView = document.getElementById("btn-recipe-view");
  const btnShoppingView = document.getElementById("btn-shopping-view");
  const recipeList = document.querySelector<HTMLElement>(
    ".recipe-ingredients-list",
  );
  const shoppingWrapper = document.querySelector<HTMLElement>(
    ".shopping-list-wrapper",
  );
  const buyList = document.querySelector<HTMLElement>(".shopping-buy-list");
  const staplesList = document.querySelector<HTMLElement>(
    ".shopping-staples-list",
  );
  const copyBtn = document.getElementById("btn-copy-shopping-list");

  if (
    !btnRecipeView ||
    !btnShoppingView ||
    !recipeList ||
    !shoppingWrapper ||
    !buyList ||
    !staplesList
  )
    return;

  let currentScale = 1.0;
  let activeTab = "recipe"; // 'recipe' or 'shopping'

  // Initialize: Render the list once
  renderShoppingList(currentScale);

  // Toggle View Click Handlers
  initToggleGroup(".shopping-view-toggle", (value) => {
    if (value === "btn-recipe-view") {
      activeTab = "recipe";
      recipeList.style.display = "block";
      shoppingWrapper.style.display = "none";
    } else if (value === "btn-shopping-view") {
      activeTab = "shopping";
      recipeList.style.display = "none";
      shoppingWrapper.style.display = "block";
      renderShoppingList(currentScale);
    }
  });

  // Listen to the Servings Scaler custom event
  document.addEventListener("recipe:scale", (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && typeof customEvent.detail.factor === "number") {
      currentScale = customEvent.detail.factor;
      if (activeTab === "shopping") {
        renderShoppingList(currentScale);
      }
    }
  });

  // Copy List Button Click Handler
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const recipeTitle =
        document.querySelector(".recipe-title-bar h1")?.textContent || "Recipe";
      let text = `SHOPPING LIST: ${recipeTitle}\n\n`;

      const buyItems = buyList.querySelectorAll<HTMLElement>(".shopping-item");
      buyItems.forEach((item) => {
        const mainRow =
          item.querySelector(".shopping-item-main-row")?.textContent?.trim() ||
          "";
        const noteText =
          item.querySelector(".shopping-item-note")?.textContent?.trim() || "";
        text += `- ${mainRow}${noteText ? ` ${noteText}` : ""}\n`;
      });

      const stapleItems =
        staplesList.querySelectorAll<HTMLElement>(".shopping-item");
      if (buyItems.length > 0 && stapleItems.length > 0) {
        text += `\n---\n\n`;
      }

      stapleItems.forEach((item) => {
        const mainRow =
          item.querySelector(".shopping-item-main-row")?.textContent?.trim() ||
          "";
        const noteText =
          item.querySelector(".shopping-item-note")?.textContent?.trim() || "";
        text += `- ${mainRow}${noteText ? ` ${noteText}` : ""}\n`;
      });

      navigator.clipboard
        .writeText(text)
        .then(() => {
          // Visual feedback
          const originalHtml = copyBtn.innerHTML;
          copyBtn.classList.add("success");
          const span = copyBtn.querySelector("span");
          if (span) {
            span.textContent = "Copied!";
          }

          setTimeout(() => {
            copyBtn.classList.remove("success");
            copyBtn.innerHTML = originalHtml;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    });
  }

  /**
   * Triggers pipeline execution and renders the resulting buy list and staples list.
   * Updates display layout visibility.
   */
  function renderShoppingList(scale: number): void {
    if (!buyList || !staplesList) return;
    buyList.innerHTML = "";
    staplesList.innerHTML = "";

    const elements =
      document.querySelectorAll<HTMLElement>(".recipe-ingredient");
    const { buyItems, stapleItems } = processShoppingList(scale, elements);

    const hasBuyItems = buyItems.length > 0;
    const hasStaples = stapleItems.length > 0;

    // Render Need to Buy items
    buyItems.forEach((converted) => renderItem(converted, buyList));

    // Render Pantry Staples items
    stapleItems.forEach((converted) => renderItem(converted, staplesList));

    // Toggle staple section visibility depending on items
    const staplesSection =
      document.querySelector<HTMLElement>(".staples-section");
    if (staplesSection) {
      staplesSection.style.display = hasStaples ? "block" : "none";
    }

    const buySection = document.querySelector<HTMLElement>(".buy-section");
    if (buySection) {
      buySection.style.display = hasBuyItems ? "block" : "none";
    }

    const divider = document.querySelector<HTMLElement>(".shopping-divider");
    if (divider) {
      divider.style.display = hasBuyItems && hasStaples ? "block" : "none";
    }
  }

  /**
   * Generates DOM elements for a single converted item and appends it to targetList.
   */
  function renderItem(item: ShoppingItem, targetList: HTMLElement): void {
    const qtyStr =
      item.qty !== null
        ? `${formatCookingNumber(item.qty)}${item.unit ? " " + item.unit : ""}`
        : "";

    const noteHtml =
      item.note && item.note.length > 0
        ? `<div class="shopping-item-details">
             <span class="shopping-item-note">${formatNotesArray(item.note, !item.isStaple)}</span>
           </div>`
        : "";

    targetList.insertAdjacentHTML(
      "beforeend",
      `<li class="shopping-item">
         <div class="shopping-item-main-row">${qtyStr ? qtyStr + " " : ""}${item.rest}</div>
         ${noteHtml}
       </li>`,
    );
  }
}

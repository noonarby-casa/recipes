import { formatCookingNumber } from './units';
import {
  processShoppingList,
  extractIngredientsFromDOM,
} from './shopping-list/pipeline';
import { ShoppingItem } from './shopping-list/types';
// removed formatNotesArray
import { initToggleGroup } from './components/toggle';
import { getStoreSection } from './shopping-list/store-sections';

/**
 * Initializes the shopping list feature: selects DOM elements, sets up initial
 * state, registers tab toggles, clipboard listeners, and scaling listeners.
 */
export function initShoppingList(): void {
  const container = document.querySelector('.ingredients-column');
  if (!container) {
    return;
  }

  const btnRecipeView = document.getElementById('btn-recipe-view');
  const btnShoppingView = document.getElementById('btn-shopping-view');
  const recipeList = document.querySelector<HTMLElement>(
    '.recipe-ingredients-list',
  );
  const shoppingWrapper = document.querySelector<HTMLElement>(
    '.shopping-list-wrapper',
  );
  const buyList = document.querySelector<HTMLElement>('.shopping-buy-list');
  const optionalList = document.querySelector<HTMLElement>(
    '.shopping-optional-list',
  );
  const staplesList = document.querySelector<HTMLElement>(
    '.shopping-staples-list',
  );
  const copyBtn = document.getElementById('btn-copy-shopping-list');

  if (
    !btnRecipeView ||
    !btnShoppingView ||
    !recipeList ||
    !shoppingWrapper ||
    !buyList ||
    !staplesList
  ) {
    return;
  }

  let currentScale = 1.0;
  let activeTab = 'recipe'; // 'recipe' or 'shopping'

  // Listen to the global store layout selector change
  document.addEventListener('store-layout:change', () => {
    renderShoppingList(currentScale);
  });

  // Initialize: Render the list once
  renderShoppingList(currentScale);

  // Toggle View Click Handlers
  initToggleGroup('.shopping-view-toggle', (value) => {
    if (value === 'btn-recipe-view') {
      activeTab = 'recipe';
      recipeList.style.display = 'block';
      shoppingWrapper.style.display = 'none';
    } else if (value === 'btn-shopping-view') {
      activeTab = 'shopping';
      recipeList.style.display = 'none';
      shoppingWrapper.style.display = 'block';
      renderShoppingList(currentScale);
    }
  });

  // Listen to the Servings Scaler custom event
  document.addEventListener('recipe:scale', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && typeof customEvent.detail.factor === 'number') {
      currentScale = customEvent.detail.factor;
      if (activeTab === 'shopping') {
        renderShoppingList(currentScale);
      }
    }
  });

  // Copy List Button Click Handler
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const recipeTitle =
        document.querySelector('.recipe-title-bar h1')?.textContent || 'Recipe';
      let text = `SHOPPING LIST: ${recipeTitle}\n\n`;

      const buyItems = buyList.querySelectorAll<HTMLElement>('.shopping-item');
      if (buyItems.length > 0) {
        // Exclude headers when copying items
        buyList
          .querySelectorAll<HTMLElement>(
            '.shopping-item, .shopping-section-header',
          )
          .forEach((el) => {
            if (el.classList.contains('shopping-section-header')) {
              text += `\n[ ${el.textContent?.trim()} ]\n`;
            } else {
              const mainRow =
                el
                  .querySelector('.shopping-item-main-row')
                  ?.textContent?.trim() || '';
              const noteText =
                el.querySelector('.shopping-item-note')?.textContent?.trim() ||
                '';
              text += `- ${mainRow}${noteText ? ` ${noteText}` : ''}\n`;
            }
          });
        text += '\n';
      }

      if (optionalList) {
        const optionalItems =
          optionalList.querySelectorAll<HTMLElement>('.shopping-item');
        if (optionalItems.length > 0) {
          text += `OPTIONAL:\n`;
          optionalItems.forEach((item) => {
            const mainRow =
              item
                .querySelector('.shopping-item-main-row')
                ?.textContent?.trim() || '';
            const noteText =
              item.querySelector('.shopping-item-note')?.textContent?.trim() ||
              '';
            text += `- ${mainRow}${noteText ? ` ${noteText}` : ''}\n`;
          });
          text += '\n';
        }
      }

      const stapleItems =
        staplesList.querySelectorAll<HTMLElement>('.shopping-item');
      if (stapleItems.length > 0) {
        text += `PANTRY STAPLES:\n`;
        stapleItems.forEach((item) => {
          const mainRow =
            item
              .querySelector('.shopping-item-main-row')
              ?.textContent?.trim() || '';
          const noteText =
            item.querySelector('.shopping-item-note')?.textContent?.trim() ||
            '';
          text += `- ${mainRow}${noteText ? ` ${noteText}` : ''}\n`;
        });
      }

      navigator.clipboard
        .writeText(text)
        .then(() => {
          // Visual feedback
          const originalHtml = copyBtn.innerHTML;
          copyBtn.classList.add('success');
          const span = copyBtn.querySelector('span');
          if (span) {
            span.textContent = 'Copied!';
          }

          setTimeout(() => {
            copyBtn.classList.remove('success');
            copyBtn.innerHTML = originalHtml;
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    });
  }

  /**
   * Triggers pipeline execution and renders the resulting buy list, optional list, and staples list.
   * Updates display layout visibility.
   */
  function renderShoppingList(scale: number): void {
    if (!buyList || !staplesList) {
      return;
    }
    buyList.innerHTML = '';
    staplesList.innerHTML = '';
    if (optionalList) {
      optionalList.innerHTML = '';
    }

    const elements =
      document.querySelectorAll<HTMLElement>('.recipe-ingredient');
    const ingredients = extractIngredientsFromDOM(scale, elements);
    const { buyItems, optionalItems, stapleItems } =
      processShoppingList(ingredients);

    const hasBuyItems = buyItems.length > 0;
    const hasOptional = optionalItems.length > 0;
    const hasStaples = stapleItems.length > 0;

    // Render Need to Buy items with store section headers
    let currentSectionId = '';
    buyItems.forEach((converted) => {
      const section = getStoreSection(converted.rest, converted.item);
      if (section.id !== currentSectionId) {
        currentSectionId = section.id;
        buyList.insertAdjacentHTML(
          'beforeend',
          `<li class="shopping-section-header">${section.name}</li>`,
        );
      }
      renderItem(converted, buyList);
    });

    // Render Optional items
    if (optionalList) {
      optionalItems.forEach((converted) => renderItem(converted, optionalList));
      const optionalSection =
        document.querySelector<HTMLElement>('.optional-section');
      if (optionalSection) {
        optionalSection.style.display = hasOptional ? 'block' : 'none';
      }
    }

    // Render Pantry Staples items
    stapleItems.forEach((converted) => renderItem(converted, staplesList));

    // Toggle staple section visibility depending on items
    const staplesSection =
      document.querySelector<HTMLElement>('.staples-section');
    if (staplesSection) {
      staplesSection.style.display = hasStaples ? 'block' : 'none';
    }

    const buySection = document.querySelector<HTMLElement>('.buy-section');
    if (buySection) {
      buySection.style.display = hasBuyItems ? 'block' : 'none';
    }

    const divider = document.querySelector<HTMLElement>('.shopping-divider');
    if (divider) {
      divider.style.display =
        (hasBuyItems || hasOptional) && hasStaples ? 'block' : 'none';
    }
  }

  /**
   * Generates DOM elements for a single converted item and appends it to targetList.
   */
  function renderItem(item: ShoppingItem, targetList: HTMLElement): void {
    const qtyStr =
      item.qty !== null
        ? `${formatCookingNumber(item.qty)}${item.unit ? ' ' + item.unit : ''}`
        : '';

    // Show sizeNote if available (Edge Case 1)
    const displayRest = item.rest;

    const notesArr = item.notes || [];
    const recipes = Array.from(
      new Set(notesArr.map((n) => n.recipe).filter(Boolean)),
    );
    const alts = Array.from(
      new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
    );
    const notesStrs = [];
    if (recipes.length > 0) {
      notesStrs.push(`from ${recipes.join(', ')}`);
    }
    if (alts.length > 0) {
      notesStrs.push(`or ${alts.join(' or ')}`);
    }
    const notesStr = notesStrs.length > 0 ? notesStrs.join('; ') : '';

    const noteHtml = notesStr
      ? `<div class="shopping-item-details">
             <span class="shopping-item-note">${notesStr}</span>
           </div>`
      : '';

    targetList.insertAdjacentHTML(
      'beforeend',
      `<li class="shopping-item">
         <div class="shopping-item-main-row">${qtyStr ? qtyStr + ' ' : ''}${displayRest}</div>
         ${noteHtml}
       </li>`,
    );
  }
}

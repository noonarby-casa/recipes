import { formatItemQuantity } from './units';
import {
  processShoppingList,
  extractIngredientsFromDOM,
  getDepletedStaples,
  saveDepletedStaples,
} from './shopping-list/pipeline';
import { ShoppingItem } from './shopping-list/types';
// removed formatNotesArray
import { initToggleGroup } from './components/toggle';
import { getSectionForCategory } from './shopping-list/store-sections';

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

  function formatItemNotes(item: ShoppingItem): string {
    const notesStrs: string[] = [];
    if (item.note) {
      if (item.note.sizeNote) {
        notesStrs.push(item.note.sizeNote);
      }
      const alts = Array.from(
        new Set(
          item.note.ingredientNotes.map((n) => n.altItem).filter(Boolean),
        ),
      );
      const descriptors = Array.from(
        new Set(
          item.note.ingredientNotes.map((n) => n.descriptor).filter(Boolean),
        ),
      );

      if (descriptors.length > 0) {
        notesStrs.push(descriptors.join(', '));
      }
      if (alts.length > 0) {
        notesStrs.push(`or ${alts.join(' or ')}`);
      }
    }
    return notesStrs.length > 0 ? ` (${notesStrs.join('; ')})` : '';
  }

  function copyShoppingListToClipboard(
    format: 'markdown' | 'google-keep',
  ): void {
    const elements =
      document.querySelectorAll<HTMLElement>('.recipe-ingredient');
    const ingredients = extractIngredientsFromDOM(currentScale, elements);
    const { buyItems, optionalItems, stapleItems } =
      processShoppingList(ingredients);

    const recipeTitle =
      document.querySelector('.recipe-title-bar h1')?.textContent || 'Recipe';

    let clipboardText = '';

    if (format === 'google-keep') {
      const allItems = [...buyItems, ...optionalItems, ...stapleItems];
      const lines = allItems.map((item) => {
        const { qtyStr, itemStr } = formatItemQuantity(
          item.qty,
          item.unit,
          item.item,
        );
        return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}`;
      });
      clipboardText = lines.join('\n');
    } else {
      // Markdown format
      clipboardText = `## SHOPPING LIST: ${recipeTitle}\n`;

      if (buyItems.length > 0) {
        clipboardText += '\n### Need to Buy\n';
        let currentSectionId = '';
        buyItems.forEach((item) => {
          const section = getSectionForCategory(item.category);
          if (section.id !== currentSectionId) {
            currentSectionId = section.id;
            clipboardText += `\n[ ${section.name} ]\n`;
          }

          const { qtyStr, itemStr } = formatItemQuantity(
            item.qty,
            item.unit,
            item.item,
          );
          const notesStr = formatItemNotes(item);
          clipboardText += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}\n`;
        });
      }

      if (optionalItems.length > 0) {
        clipboardText += '\n### Optional\n';
        optionalItems.forEach((item) => {
          const { qtyStr, itemStr } = formatItemQuantity(
            item.qty,
            item.unit,
            item.item,
          );
          const notesStr = formatItemNotes(item);
          clipboardText += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}\n`;
        });
      }

      if (stapleItems.length > 0) {
        clipboardText += '\n### Pantry Staples\n';
        stapleItems.forEach((item) => {
          const { qtyStr, itemStr } = formatItemQuantity(
            item.qty,
            item.unit,
            item.item,
          );
          const notesStr = formatItemNotes(item);
          clipboardText += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${notesStr}\n`;
        });
      }
    }

    navigator.clipboard
      .writeText(clipboardText)
      .then(() => {
        if (copyBtn) {
          if (copyBtn instanceof HTMLSelectElement) {
            const copySelect = copyBtn;
            const placeholderOpt = copySelect.options[0];
            const originalText = placeholderOpt.textContent || 'Copy List';
            placeholderOpt.textContent = 'Copied!';
            copySelect.value = '';
            copySelect.classList.add('success');
            setTimeout(() => {
              placeholderOpt.textContent = originalText;
              copySelect.classList.remove('success');
            }, 2000);
          } else {
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
          }
        }
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  }

  // Copy List Button Click Handler
  if (copyBtn) {
    if (copyBtn instanceof HTMLSelectElement) {
      copyBtn.addEventListener('change', (e) => {
        const select = e.target;
        if (select instanceof HTMLSelectElement) {
          const format = select.value;
          if (format === 'markdown' || format === 'google-keep') {
            copyShoppingListToClipboard(format);
          }
        }
      });
    } else {
      copyBtn.addEventListener('click', () => {
        copyShoppingListToClipboard('markdown');
      });
    }
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
      const section = getSectionForCategory(converted.category);
      if (section.id !== currentSectionId) {
        currentSectionId = section.id;
        buyList.insertAdjacentHTML(
          'beforeend',
          `<li class="shopping-section-header compound-list-header">${section.name}</li>`,
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

    // Bind click handlers to '+' buttons on staples
    staplesList.querySelectorAll('.btn-deplete-staple').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemName = (e.currentTarget as HTMLElement).dataset.item;
        if (itemName) {
          const depleted = getDepletedStaples();
          depleted.add(itemName);
          saveDepletedStaples(depleted);
          renderShoppingList(scale);
        }
      });
    });

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
    const { qtyStr, itemStr } = formatItemQuantity(
      item.qty,
      item.unit,
      item.item,
    );

    const notesArr = item.note?.ingredientNotes || [];
    const alts = Array.from(
      new Set(notesArr.map((n) => n.altItem).filter(Boolean)),
    );
    const descriptors = Array.from(
      new Set(notesArr.map((n) => n.descriptor).filter(Boolean)),
    );
    const notesStrs = [];
    if (item.note?.sizeNote) {
      notesStrs.push(item.note.sizeNote);
    }
    if (descriptors.length > 0) {
      notesStrs.push(descriptors.join(', '));
    }
    if (alts.length > 0) {
      notesStrs.push(`or ${alts.join(' or ')}`);
    }
    const notesStr = notesStrs.length > 0 ? notesStrs.join('; ') : '';

    const noteHtml = notesStr
      ? `<div class="shopping-item-details">
             <span class="shopping-item-note">(${notesStr})</span>
           </div>`
      : '';

    const plusBtn =
      targetList === staplesList
        ? `<button type="button" class="btn-deplete-staple" data-item="${item.item}">+</button>`
        : '';

    targetList.insertAdjacentHTML(
      'beforeend',
      `<li class="shopping-item">
         <div class="shopping-item-main-row">${qtyStr ? qtyStr + ' ' : ''}${itemStr}${plusBtn}</div>
         ${noteHtml}
       </li>`,
    );
  }
}

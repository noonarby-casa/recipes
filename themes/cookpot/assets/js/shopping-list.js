import { formatCookingNumber } from './scaler.js';
import { processShoppingList } from './shopping-list/pipeline.js';

/**
 * Initializes the shopping list feature: selects DOM elements, sets up initial
 * state, registers tab toggles, clipboard listeners, and scaling listeners.
 */
export function initShoppingList() {
  const container = document.querySelector('.ingredients-column');
  if (!container) return;

  const btnRecipeView = document.getElementById('btn-recipe-view');
  const btnShoppingView = document.getElementById('btn-shopping-view');
  const recipeList = document.querySelector('.recipe-ingredients-list');
  const shoppingWrapper = document.querySelector('.shopping-list-wrapper');
  const buyList = document.querySelector('.shopping-buy-list');
  const staplesList = document.querySelector('.shopping-staples-list');
  const copyBtn = document.getElementById('btn-copy-shopping-list');
  
  if (!btnRecipeView || !btnShoppingView || !recipeList || !shoppingWrapper) return;

  let currentScale = 1.0;
  let activeTab = 'recipe'; // 'recipe' or 'shopping'

  // Initialize: Render the list once
  renderShoppingList(currentScale);

  // Toggle View Click Handlers
  btnRecipeView.addEventListener('click', () => {
    activeTab = 'recipe';
    btnRecipeView.classList.add('active');
    btnShoppingView.classList.remove('active');
    recipeList.style.display = 'block';
    shoppingWrapper.style.display = 'none';
  });

  btnShoppingView.addEventListener('click', () => {
    activeTab = 'shopping';
    btnShoppingView.classList.add('active');
    btnRecipeView.classList.remove('active');
    recipeList.style.display = 'none';
    shoppingWrapper.style.display = 'block';
    renderShoppingList(currentScale);
  });

  // Listen to the Servings Scaler custom event
  document.addEventListener('recipe:scale', (e) => {
    if (e.detail && typeof e.detail.factor === 'number') {
      currentScale = e.detail.factor;
      if (activeTab === 'shopping') {
        renderShoppingList(currentScale);
      }
    }
  });

  // Copy List Button Click Handler
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const recipeTitle = document.querySelector('.recipe-title-bar h1')?.textContent || 'Recipe';
      let text = `SHOPPING LIST: ${recipeTitle}\n\n`;

      const buyItems = buyList.querySelectorAll('.shopping-item');
      buyItems.forEach(item => {
        const mainRow = item.querySelector('.shopping-item-main-row').textContent.trim();
        text += `- ${mainRow}\n`;
      });

      const stapleItems = staplesList.querySelectorAll('.shopping-item');
      if (buyItems.length > 0 && stapleItems.length > 0) {
        text += `\n---\n\n`;
      }

      stapleItems.forEach(item => {
        const mainRow = item.querySelector('.shopping-item-main-row').textContent.trim();
        text += `- ${mainRow}\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalHtml = copyBtn.innerHTML;
        copyBtn.classList.add('success');
        copyBtn.querySelector('span').textContent = 'Copied!';
        
        setTimeout(() => {
          copyBtn.classList.remove('success');
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }

  /**
   * Triggers pipeline execution and renders the resulting buy list and staples list.
   * Updates display layout visibility.
   */
  function renderShoppingList(scale) {
    buyList.innerHTML = '';
    staplesList.innerHTML = '';

    const { buyItems, stapleItems } = processShoppingList(scale);

    const hasBuyItems = buyItems.length > 0;
    const hasStaples = stapleItems.length > 0;

    // Render Need to Buy items
    buyItems.forEach(converted => renderItem(converted, buyList));

    // Render Pantry Staples items
    stapleItems.forEach(converted => renderItem(converted, staplesList));

    // Toggle staple section visibility depending on items
    const staplesSection = document.querySelector('.staples-section');
    if (staplesSection) {
      staplesSection.style.display = hasStaples ? 'block' : 'none';
    }

    const buySection = document.querySelector('.buy-section');
    if (buySection) {
      buySection.style.display = hasBuyItems ? 'block' : 'none';
    }

    const divider = document.querySelector('.shopping-divider');
    if (divider) {
      divider.style.display = (hasBuyItems && hasStaples) ? 'block' : 'none';
    }
  }

  /**
   * Generates DOM elements for a single converted item and appends it to targetList.
   */
  function renderItem(converted, targetList) {
    const li = document.createElement('li');
    li.className = 'shopping-item';

    const mainRow = document.createElement('div');
    mainRow.className = 'shopping-item-main-row';
    
    let qtyStr = '';
    if (converted.qty !== null) {
      qtyStr = formatCookingNumber(converted.qty);
      if (converted.unit) {
        qtyStr += ` ${converted.unit}`;
      }
    }
    
    mainRow.textContent = `${qtyStr ? qtyStr + ' ' : ''}${converted.rest}`;
    li.appendChild(mainRow);

    if (converted.note) {
      const details = document.createElement('div');
      details.className = 'shopping-item-details';
      
      const noteSpan = document.createElement('span');
      noteSpan.className = 'shopping-item-note';
      noteSpan.textContent = converted.note;
      details.appendChild(noteSpan);
      li.appendChild(details);
    }

    targetList.appendChild(li);
  }
}

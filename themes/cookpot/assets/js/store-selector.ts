import {
  STORE_LAYOUTS,
  getActiveStoreLayoutId,
  setActiveStoreLayoutId,
} from './shopping-list/store-sections';
import { Modal } from './components/modal';

/**
 * Initializes the global store selector modal.
 * Manages the modal state, populates choices, and dispatches change events.
 */
export function initStoreSelector(): void {
  const btn = document.getElementById('header-store-btn');
  const modalEl = document.getElementById('store-selector-modal');
  const optionsContainer = document.getElementById(
    'global-store-layout-options',
  );

  if (!btn || !modalEl || !optionsContainer) {
    return;
  }

  const modal = new Modal(modalEl);

  // Render option buttons
  function renderOptions(): void {
    if (!optionsContainer) {
      return;
    }
    const activeId = getActiveStoreLayoutId();
    optionsContainer.innerHTML = STORE_LAYOUTS.map(
      (l) =>
        `<button type="button" class="store-layout-option-btn${l.id === activeId ? ' active' : ''}" data-id="${l.id}">${l.name}</button>`,
    ).join('');

    // Add click event listeners to the rendered buttons
    const buttons = optionsContainer.querySelectorAll<HTMLButtonElement>(
      '.store-layout-option-btn',
    );
    buttons.forEach((btnOpt) => {
      btnOpt.addEventListener('click', () => {
        const layoutId = btnOpt.dataset.id;
        if (layoutId) {
          setActiveStoreLayoutId(layoutId);
          document.dispatchEvent(
            new CustomEvent('store-layout:change', {
              detail: { layoutId },
            }),
          );
          modal.close();
          // Update button active states in DOM
          renderOptions();
        }
      });
    });
  }

  // Initial render of options
  renderOptions();

  // Open modal on button click
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.open();
  });
}

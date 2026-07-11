/**
 * Reusable helper class to manage a floating overlay area at the bottom-left of the screen.
 * Useful for displaying toasts, action buttons, and overlays.
 */
export class OverlayContainer {
  private static instance: OverlayContainer | null = null;
  private readonly element: HTMLElement;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly dashboardFab: HTMLButtonElement;
  private readonly backFab: HTMLButtonElement;
  private isMinimized: boolean = false;

  private constructor() {
    let container = document.getElementById('overlay-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'overlay-container';
      container.className = 'overlay-container';
      document.body.appendChild(container);
    } else {
      container.innerHTML = '';
    }
    this.element = container;

    this.isMinimized =
      localStorage.getItem('cooking-dashboard-minimized') === 'true';

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.type = 'button';
    this.toggleBtn.className = 'overlay-toggle-btn';
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.element.appendChild(this.toggleBtn);

    this.dashboardFab = document.createElement('button');
    this.dashboardFab.type = 'button';
    this.dashboardFab.className = 'minimized-fab fab-dashboard';
    this.dashboardFab.setAttribute('aria-label', 'Restore Cooking Dashboard');
    this.dashboardFab.setAttribute('data-tooltip', 'Restore Cooking Dashboard');
    this.dashboardFab.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
        <line x1="12" y1="2" x2="12" y2="4"></line>
      </svg>
    `;
    this.dashboardFab.addEventListener('click', () => this.expand());

    this.backFab = document.createElement('button');
    this.backFab.type = 'button';
    this.backFab.className = 'minimized-fab fab-back';
    this.backFab.setAttribute('aria-label', 'Back to Meal Plan');
    this.backFab.setAttribute('data-tooltip', 'Back to Meal Plan');
    this.backFab.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;
    this.backFab.addEventListener('click', () => {
      const originalBackBtn =
        this.element.querySelector<HTMLAnchorElement>('.plan-back-btn');
      if (originalBackBtn) {
        window.location.href = originalBackBtn.href;
      }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !this.isMinimized &&
        this.hasPersistentElements()
      ) {
        this.minimize();
      }
    });

    this.updateUI();
  }

  /**
   * Gets the single shared instance of the OverlayContainer.
   */
  static getInstance(): OverlayContainer {
    if (!OverlayContainer.instance) {
      OverlayContainer.instance = new OverlayContainer();
    }
    return OverlayContainer.instance;
  }

  private hasPersistentElements(): boolean {
    return !!(
      this.element.querySelector('#cooking-dashboard') ||
      this.element.querySelector('.plan-back-btn')
    );
  }

  /**
   * Appends an element to the container.
   */
  add(child: HTMLElement): void {
    if (child.id === 'cooking-dashboard') {
      this.element.appendChild(this.dashboardFab);
    }
    if (child.classList.contains('plan-back-btn')) {
      this.element.appendChild(this.backFab);
    }

    this.element.appendChild(child);
    this.updateUI();
  }

  /**
   * Removes an element from the container.
   */
  remove(child: HTMLElement): void {
    if (child.parentNode === this.element) {
      this.element.removeChild(child);
    }
    if (
      child.id === 'cooking-dashboard' &&
      this.dashboardFab.parentNode === this.element
    ) {
      this.element.removeChild(this.dashboardFab);
    }
    if (
      child.classList.contains('plan-back-btn') &&
      this.backFab.parentNode === this.element
    ) {
      this.element.removeChild(this.backFab);
    }
    this.updateUI();
  }

  /**
   * Checks if a child element exists in the container.
   */
  has(child: HTMLElement): boolean {
    return child.parentNode === this.element;
  }

  /**
   * Clears all elements from the container.
   */
  clear(): void {
    const toRemove = Array.from(this.element.childNodes).filter(
      (node) =>
        node !== this.toggleBtn &&
        node !== this.dashboardFab &&
        node !== this.backFab,
    );
    toRemove.forEach((node) => this.element.removeChild(node));
    this.updateUI();
  }

  /**
   * Returns the container element.
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Toggles the minimized/expanded state.
   */
  toggle(): void {
    if (this.isMinimized) {
      this.expand();
    } else {
      this.minimize();
    }
  }

  /**
   * Minimizes the overlay elements.
   */
  minimize(): void {
    this.isMinimized = true;
    localStorage.setItem('cooking-dashboard-minimized', 'true');
    this.updateUI();

    if (
      this.element.contains(this.dashboardFab) &&
      this.dashboardFab.style.display !== 'none'
    ) {
      this.dashboardFab.focus();
    } else if (
      this.element.contains(this.backFab) &&
      this.backFab.style.display !== 'none'
    ) {
      this.backFab.focus();
    }
  }

  /**
   * Expands the overlay elements.
   */
  expand(): void {
    this.isMinimized = false;
    localStorage.setItem('cooking-dashboard-minimized', 'false');
    this.updateUI();

    const originalDashboard =
      this.element.querySelector<HTMLElement>('#cooking-dashboard');
    if (originalDashboard) {
      originalDashboard.focus();
    }
  }

  /**
   * Updates the visual indicator color state on the dashboard FAB.
   */
  updateDashboardFabState(
    hasExpired: boolean,
    hasInRange: boolean,
    hasRunning: boolean,
  ): void {
    this.dashboardFab.classList.remove(
      'is-expired',
      'is-in-range',
      'is-running',
    );

    if (hasExpired) {
      this.dashboardFab.classList.add('is-expired');
    } else if (hasInRange) {
      this.dashboardFab.classList.add('is-in-range');
    } else if (hasRunning) {
      this.dashboardFab.classList.add('is-running');
    }
  }

  private updateUI(): void {
    const hasPersistent = this.hasPersistentElements();
    const hasToasts =
      this.element.querySelector('.plan-toast-notification') !== null;

    if (!hasPersistent && !hasToasts) {
      this.element.classList.remove('is-minimized');
      this.element.style.display = 'none';
      return;
    }

    this.element.style.display = 'flex';

    if (hasPersistent) {
      this.toggleBtn.style.display = 'flex';
    } else {
      this.toggleBtn.style.display = 'none';
    }

    if (this.isMinimized) {
      this.element.classList.add('is-minimized');
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.setAttribute('aria-label', 'Expand overlay');
      this.toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;

      const originalDashboard =
        this.element.querySelector<HTMLElement>('#cooking-dashboard');
      if (originalDashboard) {
        originalDashboard.setAttribute('aria-hidden', 'true');
      }
      const originalBackBtn =
        this.element.querySelector<HTMLElement>('.plan-back-btn');
      if (originalBackBtn) {
        originalBackBtn.setAttribute('aria-hidden', 'true');
      }

      if (this.element.contains(this.dashboardFab)) {
        this.dashboardFab.setAttribute('aria-expanded', 'false');
        this.dashboardFab.removeAttribute('aria-hidden');
      }
      if (this.element.contains(this.backFab)) {
        this.backFab.setAttribute('aria-expanded', 'false');
        this.backFab.removeAttribute('aria-hidden');
      }
    } else {
      this.element.classList.remove('is-minimized');
      this.toggleBtn.setAttribute('aria-expanded', 'true');
      this.toggleBtn.setAttribute('aria-label', 'Minimize overlay');
      this.toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;

      const originalDashboard =
        this.element.querySelector<HTMLElement>('#cooking-dashboard');
      if (originalDashboard) {
        originalDashboard.removeAttribute('aria-hidden');
      }
      const originalBackBtn =
        this.element.querySelector<HTMLElement>('.plan-back-btn');
      if (originalBackBtn) {
        originalBackBtn.removeAttribute('aria-hidden');
      }

      if (this.element.contains(this.dashboardFab)) {
        this.dashboardFab.setAttribute('aria-hidden', 'true');
      }
      if (this.element.contains(this.backFab)) {
        this.backFab.setAttribute('aria-hidden', 'true');
      }
    }
  }
}

/**
 * Reusable helper class to manage a floating overlay area at the bottom-left of the screen.
 * Useful for displaying toasts, action buttons, and overlays.
 */
export class OverlayContainer {
  private static instance: OverlayContainer | null = null;
  private readonly element: HTMLElement;

  private constructor() {
    let container = document.getElementById('overlay-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'overlay-container';
      container.className = 'overlay-container';
      document.body.appendChild(container);
    }
    this.element = container;
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

  /**
   * Appends an element to the container.
   */
  add(child: HTMLElement): void {
    this.element.appendChild(child);
  }

  /**
   * Removes an element from the container.
   */
  remove(child: HTMLElement): void {
    if (child.parentNode === this.element) {
      this.element.removeChild(child);
    }
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
    this.element.innerHTML = '';
  }

  /**
   * Returns the container element.
   */
  getElement(): HTMLElement {
    return this.element;
  }
}

/**
 * Reusable helper class to manage Modal components.
 * Handles opening, closing, backdrop clicks, close buttons, and Escape key triggers.
 */
export class Modal {
  private element: HTMLElement;
  private closeButtons: NodeListOf<HTMLElement>;

  constructor(modalElement: HTMLElement) {
    this.element = modalElement;
    this.closeButtons = this.element.querySelectorAll(".modal-close-btn");

    // Close when clicking any close button inside the modal
    this.closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    // Close when clicking on the backdrop area outside the modal content
    this.element.addEventListener("click", (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // Close when Escape key is pressed
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Opens the modal
   */
  public open(): void {
    this.element.classList.add("active");
  }

  /**
   * Closes the modal
   */
  public close(): void {
    this.element.classList.remove("active");
  }

  /**
   * Checks if the modal is currently open
   */
  public isOpen(): boolean {
    return this.element.classList.contains("active");
  }
}

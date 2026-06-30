/**
 * Attaches click-handlers to buttons inside a toggle-group to swap active state
 * and fire an optional callback when a state change occurs.
 */
export function initToggleGroup(
  groupSelector: string,
  callback?: (value: string, button: HTMLElement) => void,
): void {
  const groups = document.querySelectorAll(groupSelector);
  groups.forEach((group) => {
    const buttons = group.querySelectorAll<HTMLElement>(".toggle-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const val = btn.dataset.val || btn.dataset.size || btn.id;
        if (callback) {
          callback(val, btn);
        }
      });
    });
  });
}

/**
 * Initializes scrollable areas by adding dynamic scroll shadow indicators (top/bottom shades)
 * when there is content that can be scrolled up or down.
 */
export function initScrollable(selector = ".scrollable-area"): void {
  const elements = document.querySelectorAll<HTMLElement>(selector);

  elements.forEach((el) => {
    const updateShadows = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      const scrollMax = scrollHeight - clientHeight;

      // Toggle scroll shadows based on position and capacity
      if (scrollTop > 2) {
        el.classList.add("can-scroll-up");
      } else {
        el.classList.remove("can-scroll-up");
      }

      if (scrollTop < scrollMax - 2 && scrollHeight > clientHeight) {
        el.classList.add("can-scroll-down");
      } else {
        el.classList.remove("can-scroll-down");
      }
    };

    // Listen to scroll events
    el.addEventListener("scroll", updateShadows, { passive: true });

    // Initial check
    updateShadows();

    // Re-check when window resizing might alter viewport boundaries
    window.addEventListener("resize", updateShadows, { passive: true });

    // Re-check when inner content changes dynamically
    const observer = new MutationObserver(updateShadows);
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

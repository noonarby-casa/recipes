import type { Action } from 'svelte/action';

/**
 * Svelte element action: adds/removes `can-scroll-up` / `can-scroll-down`
 * classes as the element is scrolled, enabling CSS scroll-shadow indicators.
 *
 * Usage: <div class="scrollable-area" use:scrollable>
 */
export const scrollable: Action<HTMLElement> = (node) => {
  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = node;
    const scrollMax = scrollHeight - clientHeight;
    node.classList.toggle('can-scroll-up', scrollTop > 2);
    node.classList.toggle(
      'can-scroll-down',
      scrollTop < scrollMax - 2 && scrollHeight > clientHeight,
    );
  };

  node.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  const observer = new MutationObserver(update);
  observer.observe(node, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  update();

  return {
    destroy() {
      node.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    },
  };
};

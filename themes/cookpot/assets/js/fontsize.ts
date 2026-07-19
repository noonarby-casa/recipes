export function initFontSize(): void {
  const instructionsCol = document.querySelector<HTMLElement>(
    '.instructions-column',
  );
  const storageKey = 'recipe-instructions-font-size';

  if (!instructionsCol) {
    return;
  }

  const sizeMap: Record<string, string> = {
    smaller: '1.0rem',
    default: '1.2rem',
    larger: '1.45rem',
  };

  function applyFontSize(size: string): void {
    if (!instructionsCol) {
      return;
    }
    const mappedSize = sizeMap[size] || sizeMap['default'];

    // Apply font size CSS variable to instructions column
    instructionsCol.style.setProperty('--instructions-font-size', mappedSize);

    // Save preference globally for the site
    localStorage.setItem(storageKey, size);
  }

  // Load saved preference or fall back to default
  const savedFontSize = localStorage.getItem(storageKey) || 'default';
  applyFontSize(savedFontSize);

  // Initialize unified toggle behavior using custom event
  const fontControls = document.querySelector<HTMLElement>('.font-controls');
  if (fontControls) {
    fontControls.addEventListener('change', (e) => {
      const size = (e as CustomEvent).detail.value;
      applyFontSize(size);
    });
  }
}

export function initFontSize() {
  const fontBtns = document.querySelectorAll('.font-btn');
  const instructionsCol = document.querySelector('.instructions-column');
  const storageKey = 'recipe-instructions-font-size';

  if (!fontBtns.length || !instructionsCol) return;

  const sizeMap = {
    smaller: '1.0rem',
    default: '1.2rem',
    larger: '1.45rem'
  };

  function setInstructionFontSize(size) {
    if (!instructionsCol) return;
    if (!sizeMap[size]) {
      size = 'default';
    }

    // Apply font size CSS variable to instructions column
    instructionsCol.style.setProperty('--instructions-font-size', sizeMap[size]);

    // Toggle active classes on controls
    fontBtns.forEach(btn => {
      if (btn.dataset.size === size) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Save preference globally for the site
    localStorage.setItem(storageKey, size);
  }

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      setInstructionFontSize(size);
    });
  });

  // Load saved preference or fall back to default
  const savedFontSize = localStorage.getItem(storageKey) || 'default';
  setInstructionFontSize(savedFontSize);
}

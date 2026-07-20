<script lang="ts">
  import {onMount} from 'svelte';
  import {fontSizeStore} from '../stores/settings';
  import type {FontSizeOption} from '../types';

  const SIZE_MAP: Record<FontSizeOption, string> = {
    smaller: '1.0rem',
    default: '1.2rem',
    larger: '1.45rem',
  };

  // Apply font-size CSS variable whenever the store changes
  $effect(() => {
    const col = document.querySelector<HTMLElement>('.instructions-column');
    if (col) {
      col.style.setProperty(
        '--instructions-font-size',
        SIZE_MAP[$fontSizeStore],
      );
    }
  });

  onMount(() => {
    // Listen for the ToggleGroup's change CustomEvent and update the store
    const fontControls = document.querySelector<HTMLElement>('.font-controls');
    if (!fontControls) {return;}

    const handler = (e: Event) => {
      const val = (e as CustomEvent<{value: string}>).detail?.value;
      if (val === 'smaller' || val === 'default' || val === 'larger') {
        fontSizeStore.set(val);
      }
    };

    fontControls.addEventListener('change', handler);
    return () => fontControls.removeEventListener('change', handler);
  });
</script>

<!-- No visible markup – this is a side-effect-only controller component -->

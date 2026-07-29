<script lang="ts">
  import SearchIcon from './icons/SearchIcon.svelte';
  import XIcon from './icons/XIcon.svelte';

  interface Props {
    /** Bound search value string. */
    value?: string;
    /** Placeholder text for input. */
    placeholder?: string;
    /** Debounce delay in ms for onsearch callback. */
    debounceMs?: number;
    /** Callback triggered when debounced search query changes. */
    onsearch?: (query: string) => void;
    /** Callback triggered when search is cleared. */
    onclear?: () => void;
    /** HTML id attribute. */
    id?: string;
    /** Additional CSS classes. */
    class?: string;
    /** Accessibility label for input element. */
    ariaLabel?: string;
  }

  let {
    value = $bindable(''),
    placeholder = 'Search...',
    debounceMs = 200,
    onsearch,
    onclear,
    id,
    class: className = '',
    ariaLabel = 'Search recipes'
  }: Props = $props();

  let inputEl: HTMLInputElement | null = $state(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const currentVal = value;
    if (timer) {clearTimeout(timer);}
    timer = setTimeout(() => {
      onsearch?.(currentVal);
    }, debounceMs);

    return () => {
      if (timer) {clearTimeout(timer);}
    };
  });

  function handleClear() {
    value = '';
    onclear?.();
    onsearch?.('');
    inputEl?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && value) {
      handleClear();
    }
  }
</script>

<div class="search-input-wrapper {className}">
  <SearchIcon class="search-input-icon" size={18} />
  <input
    bind:this={inputEl}
    {id}
    type="text"
    class="search-input-field"
    {placeholder}
    aria-label={ariaLabel}
    bind:value={value}
    onkeydown={handleKeydown}
  />
  {#if value}
    <button
      type="button"
      class="search-input-clear-btn"
      aria-label="Clear search input"
      onclick={handleClear}
    >
      <XIcon size={16} />
    </button>
  {/if}
</div>

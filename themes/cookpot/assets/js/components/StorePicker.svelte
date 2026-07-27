<script lang="ts">
  import ToggleGroup, { type Option } from './ToggleGroup.svelte';
  import ShoppingCartIcon from './icons/ShoppingCartIcon.svelte';
  import XIcon from './icons/XIcon.svelte';

  interface Props {
    selectedId: string;
    options: Option[];
    onChange: (id: string) => void;
  }

  let { selectedId, options, onChange }: Props = $props();

  let isOpen = $state(false);

  let currentOption = $derived(
    options.find((opt) => opt.id === selectedId) || options[0]
  );

  function openSheet() {
    isOpen = true;
  }

  function closeSheet() {
    isOpen = false;
  }

  function handleSelect(id: string) {
    onChange(id);
    closeSheet();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      e.stopPropagation();
      closeSheet();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="store-picker-wrapper">
  <button
    type="button"
    class="store-picker-trigger-btn"
    onclick={openSheet}
    aria-expanded={isOpen ? 'true' : 'false'}
    aria-haspopup="dialog"
    title="Choose store layout"
  >
    <div class="store-trigger-left">
      <div class="store-trigger-icon-wrapper">
        <ShoppingCartIcon size={18} strokeWidth={2} />
      </div>
      <div class="store-trigger-text">
        <span class="store-trigger-label">{currentOption?.label ?? 'Store Layout'}</span>
        {#if currentOption?.description}
          <span class="store-trigger-description">{currentOption.description}</span>
        {/if}
      </div>
    </div>
    <span class="store-trigger-action">Change Layout ▼</span>
  </button>

  {#if isOpen}
    <!-- Viewport-Fixed Child Overlay (z-index: 2000) -->
    <div
      class="store-sheet-backdrop"
      onclick={closeSheet}
      onkeydown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          closeSheet();
        }
      }}
      role="presentation"
    >
      <div
        class="store-sheet-panel"
        role="dialog"
        tabindex={-1}
        aria-label="Store Layout Selector"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <!-- Header Row -->
        <div class="store-sheet-header">
          <span class="store-sheet-title">Select Store Layout</span>
          <button
            type="button"
            class="store-sheet-close-btn"
            onclick={closeSheet}
            aria-label="Close store picker"
          >
            <XIcon size={18} />
          </button>
        </div>

        <!-- Body: Vertical ToggleGroup -->
        <div class="store-sheet-body">
          <ToggleGroup
            {options}
            {selectedId}
            onChange={handleSelect}
            orientation="vertical"
            fullWidth={true}
          />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .store-picker-wrapper {
    display: block;
    width: 100%;
  }

  .store-picker-trigger-btn {
    align-items: center;
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    color: var(--text-body);
    cursor: pointer;
    display: flex;
    font-size: 0.85rem;
    gap: 0.75rem;
    justify-content: space-between;
    padding: 0.65rem 0.85rem;
    text-align: left;
    transition: all 0.15s ease;
    width: 100%;
  }

  .store-picker-trigger-btn:hover {
    background-color: var(--noonblue-bg-hover);
    border-color: var(--noonblue);
  }

  .store-trigger-left {
    align-items: center;
    display: flex;
    gap: 0.65rem;
    min-width: 0;
  }

  .store-trigger-icon-wrapper {
    align-items: center;
    color: var(--noonblue);
    display: flex;
    flex-shrink: 0;
    justify-content: center;
  }

  .store-trigger-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .store-trigger-label {
    color: var(--text-color);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .store-trigger-description {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .store-trigger-action {
    color: var(--noonblue);
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .store-sheet-backdrop {
    align-items: center;
    backdrop-filter: blur(2px);
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 1rem;
    position: fixed;
    z-index: 2000;
  }

  .store-sheet-panel {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 92vw;
    padding: 1.25rem;
    width: 420px;
  }

  .store-sheet-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .store-sheet-title {
    color: var(--text-body);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .store-sheet-close-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    justify-content: center;
    padding: 4px;
  }

  .store-sheet-close-btn:hover {
    background-color: var(--noonblue-bg-hover);
    color: var(--text-body);
  }

  .store-sheet-body {
    display: flex;
    flex-direction: column;
  }
</style>

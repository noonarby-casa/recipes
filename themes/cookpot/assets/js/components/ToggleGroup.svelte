<script lang="ts">
  import Button from './Button.svelte';

  export interface Option {
    id: string;
    label: string;
    description?: string;
    badgeCount?: number;
    idAttr?: string;
  }

  interface Props {
    /** The list of options available in the toggle group. */
    options: Option[];
    /** The ID of the currently selected option. */
    selectedId: string;
    /** Callback function triggered when the selection changes. */
    onChange: (id: string) => void;
    /** Orientation of the group: horizontal or vertical. */
    orientation?: 'horizontal' | 'vertical';
    /** Whether the container expands full width. */
    fullWidth?: boolean;
  }

  let {
    options,
    selectedId,
    onChange,
    orientation = 'horizontal',
    fullWidth = false,
  }: Props = $props();

  let rootElement = $state<HTMLElement>();

  function handleSelect(id: string) {
    onChange(id);
    if (rootElement) {
      rootElement.dispatchEvent(
        new CustomEvent('change', {
          bubbles: true,
          detail: { value: id },
        }),
      );
    }
  }
</script>

<div
  class="toggle-group"
  class:vertical={orientation === 'vertical'}
  class:full-width={fullWidth}
  bind:this={rootElement}
>
  {#each options as opt}
    <Button
      id={opt.idAttr}
      class="toggle-btn {opt.id === selectedId ? 'active btn-brand' : ''} {opt.description ? 'has-description' : ''}"
      onclick={() => handleSelect(opt.id)}
    >
      <div class="toggle-btn-content">
        <span class="toggle-btn-label">
          {opt.label}
          {#if opt.badgeCount !== undefined && opt.badgeCount > 0}
            <span class="shopping-count-badge-count">{opt.badgeCount}</span>
          {/if}
        </span>
        {#if opt.description}
          <span class="toggle-btn-description">{opt.description}</span>
        {/if}
      </div>
    </Button>
  {/each}
</div>

<style>
  :global(.toggle-group) {
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 10px; /* Rectangular outer wrapper */
    display: flex;
    padding: 3px;
    width: fit-content;
  }

  :global(.toggle-group.vertical) {
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  :global(.toggle-group.full-width) {
    width: 100%;
  }

  :global(.toggle-btn) {
    background: transparent;
    border: none;
    border-radius: 8px; /* Rectangular inner buttons */
    color: var(--font-btn-text);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    outline: none;
    padding: 0.45rem 1rem;
    text-align: center;
    transition: all 0.2s ease;
  }

  :global(.toggle-group.vertical .toggle-btn) {
    text-align: left;
    width: 100%;
  }

  :global(.toggle-btn.has-description) {
    padding: 0.6rem 0.85rem;
  }

  :global(.toggle-btn-content) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :global(.toggle-btn-label) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :global(.toggle-btn-description) {
    font-size: 0.75rem;
    font-weight: 400;
    opacity: 0.8;
  }

  :global(.toggle-btn:hover) {
    color: var(--noonblue);
  }

  :global(.toggle-btn:active) {
    transform: scale(0.97);
  }
</style>




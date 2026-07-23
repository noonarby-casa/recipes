<script lang="ts">
  import Button from './Button.svelte';

  interface Option {
    id: string;
    label: string;
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
  }

  let { options, selectedId, onChange }: Props = $props();
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

<div class="toggle-group" bind:this={rootElement}>
  {#each options as opt}
    <Button
      id={opt.idAttr}
      class="toggle-btn {opt.id === selectedId ? 'active btn-brand' : ''}"
      onclick={() => handleSelect(opt.id)}
    >
      {opt.label}
      {#if opt.badgeCount !== undefined && opt.badgeCount > 0}
        <span class="shopping-count-badge-count">{opt.badgeCount}</span>
      {/if}
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

  :global(.toggle-btn:hover) {
    color: var(--noonblue);
  }

  :global(.toggle-btn:active) {
    transform: scale(0.97);
  }
</style>



<script lang="ts">
  interface Props {
    /** Whether the modal is open. */
    isOpen: boolean;
    /** Callback to close the modal. */
    onClose: () => void;
    /** Optional title for the default header. */
    title?: string;
    /** Accessibility label. Defaults to title if provided. */
    ariaLabel?: string;
    /** Custom class for the backdrop. */
    backdropClass?: string;
    /** Custom class for the content container. */
    contentClass?: string;
    /** Custom styles for the content container. */
    contentStyle?: string;
    
    // Snippets
    /** Snippet to replace the default header entirely. */
    header?: import('svelte').Snippet;
    /** Snippet for the body/content. */
    children?: import('svelte').Snippet;
  }

  let {
    isOpen,
    onClose,
    title,
    ariaLabel,
    backdropClass = 'modal-backdrop',
    contentClass = 'modal-content',
    contentStyle = '',
    header,
    children
  }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class={backdropClass} 
    onclick={handleBackdropClick} 
    style="display: flex;"
  >
    <div 
      class={contentClass} 
      style={contentStyle}
      role="dialog" 
      aria-modal="true" 
      aria-label={ariaLabel || title}
    >
      {#if header}
        {@render header()}
      {:else if title || onClose}
        <div class="modal-header">
          {#if title}
            <h3 class="modal-title">{title}</h3>
          {/if}
          {#if onClose}
            <button
              type="button"
              class="modal-close-btn"
              aria-label="Close modal"
              onclick={onClose}
            >
              ✕
            </button>
          {/if}
        </div>
      {/if}

      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    align-items: center;
    backdrop-filter: blur(4px);
    background-color: rgba(0, 0, 0, 0.55);
    height: 100vh;
    justify-content: center;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 100000;
  }

  .modal-content {
    animation: modalFadeIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    width: 90%;
  }

  .modal-header {
    align-items: center;
    border-bottom: 1px solid var(--border-ultra-subtle);
    display: flex;
    justify-content: space-between;
    padding: 1.25rem 1.5rem 0.75rem 1.5rem;
  }

  .modal-title {
    color: var(--text-title);
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
  }

  .modal-close-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.5rem;
    font-weight: 300;
    height: 28px;
    justify-content: center;
    line-height: 1;
    padding: 0;
    transition: all 0.2s ease;
    width: 28px;
  }

  .modal-close-btn:hover {
    background-color: var(--font-controls-bg);
    color: var(--text-title);
  }

  @keyframes modalFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

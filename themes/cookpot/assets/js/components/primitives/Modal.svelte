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
    class="modal-backdrop {backdropClass}" 
    onclick={handleBackdropClick} 
  >
    <div 
      class="modal-content {contentClass}" 
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



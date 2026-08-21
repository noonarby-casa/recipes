<script lang="ts">
  import { toastStore } from '../../stores/toast';
  import XIcon from './icons/XIcon.svelte';

  const activeToast = $derived($toastStore);

  function handleMouseEnter() {
    toastStore.pause();
  }

  function handleMouseLeave() {
    toastStore.resume();
  }

  function handleFocusIn() {
    toastStore.pause();
  }

  function handleFocusOut() {
    toastStore.resume();
  }

  function handleActionClick() {
    if (!activeToast) {
      return;
    }
    const action = activeToast.action;
    const toastId = activeToast.id;
    if (action) {
      action.onClick();
    }
    toastStore.dismiss(toastId);
  }

  function handleDismissClick() {
    if (!activeToast) {
      return;
    }
    toastStore.dismiss(activeToast.id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && activeToast) {
      const hasOpenModal = !!document.querySelector(
        '.modal-backdrop, [role="dialog"][aria-modal="true"]',
      );
      if (!hasOpenModal) {
        toastStore.dismiss(activeToast.id);
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if activeToast}
  <aside
    id="global-toast-container"
    class="global-toast-container"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="toast-notification variant-{activeToast.variant}"
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
      onfocusin={handleFocusIn}
      onfocusout={handleFocusOut}
    >
      <div class="toast-body">
        <span class="toast-message">
          {#if activeToast.emphasisText}
            {activeToast.message} <strong>{activeToast.emphasisText}</strong>
          {:else}
            {activeToast.message}
          {/if}
        </span>
        {#if activeToast.action}
          <button
            type="button"
            class="toast-action-btn"
            onclick={handleActionClick}
          >
            {activeToast.action.label}
          </button>
        {/if}
      </div>
      <button
        type="button"
        class="toast-close-btn"
        aria-label="Dismiss notification"
        onclick={handleDismissClick}
      >
        <XIcon size={16} strokeWidth={2.5} />
      </button>
    </div>
  </aside>
{/if}

<style>
  .global-toast-container {
    bottom: 1.5rem;
    left: 50%;
    max-width: min(90vw, 440px);
    pointer-events: none;
    position: fixed;
    transform: translateX(-50%);
    width: max-content;
    z-index: 100000;
  }

  .toast-notification {
    align-items: center;
    animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-left: 4px solid var(--noonblue);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    color: var(--text-color);
    display: flex;
    font-size: 0.875rem;
    gap: 1rem;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    pointer-events: auto;
    width: 100%;
  }

  .toast-notification.variant-favorite {
    border-left-color: var(--heart-color);
  }

  .toast-notification.variant-success {
    border-left-color: var(--success-color);
  }

  .toast-notification.variant-warning {
    border-left-color: var(--warning-color);
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .toast-body {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .toast-message {
    color: var(--text-color);
    line-height: 1.4;
  }

  .toast-action-btn {
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--noonblue);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }

  .toast-action-btn:hover {
    background-color: var(--noonblue-bg-hover);
    color: var(--noonblue-hover);
  }

  .toast-notification.variant-favorite .toast-action-btn {
    color: var(--heart-color);
  }

  .toast-notification.variant-favorite .toast-action-btn:hover {
    background-color: var(--heart-bg-hover);
  }

  .toast-notification.variant-success .toast-action-btn {
    color: var(--success-color);
  }

  .toast-notification.variant-success .toast-action-btn:hover {
    background-color: rgba(16, 185, 129, 0.1);
  }

  .toast-close-btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    justify-content: center;
    padding: 0.35rem;
    transition: all 0.2s ease;
  }

  .toast-close-btn:hover {
    background-color: var(--border-subtle);
    color: var(--text-color);
  }

  .toast-action-btn:focus-visible,
  .toast-close-btn:focus-visible {
    outline: 2px solid var(--noonblue);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    .global-toast-container {
      bottom: 1rem;
      max-width: 92vw;
      width: 92vw;
    }

    .toast-notification {
      gap: 0.5rem;
      padding: 0.65rem 0.85rem;
    }
  }
</style>

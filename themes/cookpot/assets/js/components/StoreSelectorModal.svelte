<script lang="ts">
  import {onMount} from 'svelte';
  import {
    STORE_LAYOUTS,
    getActiveStoreLayoutId,
    setActiveStoreLayoutId,
  } from '../shopping-list/store-sections';

  let isOpen = $state(false);
  let activeId = $state(getActiveStoreLayoutId());

  function selectLayout(id: string) {
    setActiveStoreLayoutId(id);
    activeId = id;
    document.dispatchEvent(
      new CustomEvent('store-layout:change', {detail: {layoutId: id}}),
    );
    isOpen = false;
  }

  function close() {
    isOpen = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {close();}
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {close();}
  }

  onMount(() => {
    const btn = document.getElementById('header-store-btn');
    const handleOpen = (e: Event) => {
      e.preventDefault();
      activeId = getActiveStoreLayoutId();
      isOpen = true;
    };
    btn?.addEventListener('click', handleOpen);
    return () => btn?.removeEventListener('click', handleOpen);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="store-modal-backdrop" onclick={handleBackdropClick}>
    <div class="store-modal-content" role="dialog" aria-modal="true" aria-label="Store Layout">
      <div class="store-modal-header">
        <h3 class="store-modal-title">Store Layout</h3>
        <button
          type="button"
          class="store-modal-close-btn"
          aria-label="Close modal"
          onclick={close}
        >×</button>
      </div>
      <div class="store-modal-body">
        <span class="store-selector-label">Choose your layout route:</span>
        <div class="store-layout-options">
          {#each STORE_LAYOUTS as layout (layout.id)}
            <button
              type="button"
              class="store-layout-option-btn"
              class:active={layout.id === activeId}
              class:btn-brand={layout.id === activeId}
              onclick={() => selectLayout(layout.id)}
            >
              {layout.name}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .store-modal-backdrop {
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000;
  }

  .store-modal-content {
    animation: modalFadeIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background-color: var(--card-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    padding: 1.5rem;
    width: 90%;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .store-modal-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .store-modal-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }

  .store-modal-close-btn {
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    transition: color 0.15s;
  }

  .store-modal-close-btn:hover {
    color: var(--text-color);
  }

  .store-modal-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>

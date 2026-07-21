<script lang="ts">
  import {onMount} from 'svelte';
  import {
    STORE_LAYOUTS,
    getActiveStoreLayoutId,
    setActiveStoreLayoutId,
  } from '../shopping-list/store-sections';
  import Modal from './Modal.svelte';

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

<Modal
  {isOpen}
  onClose={close}
  backdropClass="store-modal-backdrop"
  contentClass="store-modal-content"
  ariaLabel="Store Layout"
>
  {#snippet header()}
    <div class="store-modal-header">
      <h3 class="store-modal-title">Store Layout</h3>
      <button
        type="button"
        class="store-modal-close-btn"
        aria-label="Close modal"
        onclick={close}
      >×</button>
    </div>
  {/snippet}

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
</Modal>

<style>
  :global(.store-modal-backdrop) {
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

  :global(.store-modal-content) {
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

  .store-selector-label {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .store-layout-options {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin-top: 0.35rem;
  }

  .store-layout-option-btn {
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    outline: none;
    padding: 0.65rem 1rem;
    text-align: left;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .store-layout-option-btn:hover {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue-border-light);
    color: var(--noonblue);
  }

  .store-layout-option-btn:active {
    transform: scale(0.98);
  }
</style>

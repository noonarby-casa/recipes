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
  title="Store Layout"
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content"
>
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
  .store-modal-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
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

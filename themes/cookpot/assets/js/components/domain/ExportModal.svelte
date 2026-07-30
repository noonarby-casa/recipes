<script lang="ts">
  import Modal from '../primitives/Modal.svelte';
  import ToggleGroup, { type Option } from '../primitives/ToggleGroup.svelte';
  import {
    formatShoppingListExport,
    filterExportItems,
    type ExportItem,
    type ExportFormat,
    type ItemFilter,
  } from '../../pipelines/shoppingExportPipeline';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    items: ExportItem[];
  }

  let { isOpen, onClose, title = 'Shopping List', items }: Props = $props();

  let activeFormat = $state<ExportFormat>('google-keep');
  let activeFilter = $state<ItemFilter>('unchecked');
  let activeMobileTab = $state<'options' | 'preview'>('options');
  let copySuccess = $state(false);

  const formatOptions: Option[] = [
    {
      id: 'google-keep',
      label: 'Google Keep',
      description: 'Plain text list without markdown checkboxes',
    },
    {
      id: 'markdown',
      label: 'Markdown',
      description: 'Checklist format with headers and - [ ] checkboxes',
    },
  ];

  const filterOptions: Option[] = [
    { id: 'unchecked', label: 'Unchecked' },
    { id: 'all', label: 'All Items' },
    { id: 'checked', label: 'Checked' },
  ];

  const mobileTabOptions: Option[] = $derived([
    { id: 'options', label: 'Options' },
    { id: 'preview', label: `Preview (${filterExportItems(items, activeFilter).length})` },
  ]);

  let filteredItems = $derived(filterExportItems(items, activeFilter));
  let previewText = $derived(
    formatShoppingListExport(items, title, activeFormat, activeFilter)
  );

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(previewText);
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // Reset tab state when opened
  $effect(() => {
    if (isOpen) {
      activeFormat = 'google-keep';
      activeFilter = 'unchecked';
      activeMobileTab = 'options';
      copySuccess = false;
    }
  });
</script>

<Modal
  {isOpen}
  {onClose}
  title="Export Shopping List"
  contentClass="export-modal-content"
>
  <div class="export-modal-wrapper">
    <!-- Mobile Segmented Tab Switcher -->
    <div class="export-mobile-tabs">
      <ToggleGroup
        options={mobileTabOptions}
        selectedId={activeMobileTab}
        onChange={(id) => (activeMobileTab = id as 'options' | 'preview')}
        fullWidth={true}
      />
    </div>

    <div class="export-modal-body">
      <!-- Controls Column (Options) -->
      <div
        class="export-controls-col"
        class:mobile-hidden={activeMobileTab !== 'options'}
      >
        <div class="export-section">
          <label class="export-section-label" for="export-item-filter">Items to Include</label>
          <ToggleGroup
            options={filterOptions}
            selectedId={activeFilter}
            onChange={(id) => (activeFilter = id as ItemFilter)}
            fullWidth={true}
          />
        </div>

        <div class="export-section">
          <label class="export-section-label" for="export-format-select">Export Format</label>
          <ToggleGroup
            options={formatOptions}
            selectedId={activeFormat}
            onChange={(id) => (activeFormat = id as ExportFormat)}
            orientation="vertical"
            fullWidth={true}
          />
        </div>

        <div class="export-desktop-action">
          <button
            type="button"
            class="btn btn-brand export-copy-btn"
            class:success={copySuccess}
            onclick={copyToClipboard}
          >
            {copySuccess ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>

      <!-- Preview Column -->
      <div
        class="export-preview-col"
        class:mobile-hidden={activeMobileTab !== 'preview'}
      >
        <div class="export-preview-header">
          <span class="export-preview-title">Live Preview</span>
          <span class="export-preview-count">{filteredItems.length} items</span>
        </div>
        <textarea
          class="export-preview-box"
          readonly
          value={previewText}
          aria-label="Exported shopping list preview text"
        ></textarea>
      </div>
    </div>

    <!-- Mobile Action Footer -->
    <div class="export-mobile-action">
      <button
        type="button"
        class="btn btn-brand export-copy-btn"
        class:success={copySuccess}
        onclick={copyToClipboard}
      >
        {copySuccess ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
      </button>
    </div>
  </div>
</Modal>

<style>
  :global(.export-modal-content) {
    max-width: 720px;
    width: 90vw;
  }

  .export-modal-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.25rem 1.25rem 1.25rem;
  }

  .export-mobile-tabs {
    display: none;
  }

  .export-modal-body {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 1.25rem;
    min-height: 380px;
  }

  .export-controls-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
  }

  .export-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .export-section-label {
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .export-desktop-action {
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .export-copy-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .export-copy-btn.success {
    background-color: #10b981;
    border-color: #10b981;
    color: #ffffff;
  }

  .export-preview-col {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
  }

  .export-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .export-preview-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-color);
  }

  .export-preview-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .export-preview-box {
    background-color: var(--font-controls-bg);
    border: 1px solid var(--border-ultra-subtle);
    border-radius: 8px;
    color: var(--text-color);
    font-family: monospace;
    font-size: 0.82rem;
    line-height: 1.45;
    padding: 0.85rem;
    resize: none;
    width: 100%;
    height: 100%;
    min-height: 320px;
    max-height: 420px;
    outline: none;
    box-sizing: border-box;
    scrollbar-gutter: stable;
  }

  .export-mobile-action {
    display: none;
  }

  @media (max-width: 767px) {
    :global(.export-modal-content) {
      width: 95vw;
    }

    .export-mobile-tabs {
      display: flex;
    }

    .export-modal-body {
      grid-template-columns: 1fr;
      min-height: 300px;
    }

    .export-desktop-action {
      display: none;
    }

    .export-mobile-action {
      display: block;
    }

    .mobile-hidden {
      display: none !important;
    }
  }
</style>

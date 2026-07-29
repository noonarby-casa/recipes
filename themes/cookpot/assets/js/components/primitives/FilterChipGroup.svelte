<script lang="ts">
  export interface FilterChipItem {
    id: string;
    label: string;
    count?: number;
    icon?: string;
  }

  interface Props {
    /** Filter chip items to display. */
    items: FilterChipItem[];
    /** List of currently selected item IDs. */
    selectedIds?: string[];
    /** Single selected item ID (used when multiSelect is false). */
    selectedId?: string;
    /** Whether multiple chips can be selected simultaneously. */
    multiSelect?: boolean;
    /** Callback triggered when a chip is toggled. */
    ontoggle?: (id: string) => void;
    /** Additional CSS class names. */
    class?: string;
  }

  let {
    items = [],
    selectedIds = [],
    selectedId = '',
    multiSelect = false,
    ontoggle,
    class: className = ''
  }: Props = $props();

  function isSelected(id: string): boolean {
    return multiSelect ? selectedIds.includes(id) : selectedId === id;
  }

  function handleToggle(id: string) {
    ontoggle?.(id);
  }
</script>

<div class="filter-chip-group {className}" role="group" aria-label="Filter options">
  {#each items as item (item.id)}
    {@const active = isSelected(item.id)}
    <button
      type="button"
      class="filter-chip {active ? 'active' : ''}"
      aria-pressed={active}
      onclick={() => handleToggle(item.id)}
    >
      {#if item.icon}
        <span class="filter-chip-icon">{item.icon}</span>
      {/if}
      <span class="filter-chip-label">{item.label}</span>
      {#if item.count !== undefined}
        <span class="filter-chip-count">({item.count})</span>
      {/if}
    </button>
  {/each}
</div>

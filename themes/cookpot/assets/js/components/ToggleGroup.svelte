<script lang="ts">
  interface Option {
    id: string;
    label: string;
    badgeCount?: number;
  }

  interface Props {
    options: Option[];
    selectedId: string;
    onChange: (id: string) => void;
  }

  let { options, selectedId, onChange }: Props = $props();
</script>

<div class="toggle-group">
  {#each options as opt}
    <button
      type="button"
      class="toggle-btn {opt.id === selectedId ? 'active btn-brand' : ''}"
      onclick={() => onChange(opt.id)}
    >
      {opt.label}
      {#if opt.badgeCount !== undefined && opt.badgeCount > 0}
        <span class="shopping-count-badge-count">{opt.badgeCount}</span>
      {/if}
    </button>
  {/each}
</div>

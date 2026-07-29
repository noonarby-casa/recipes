<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Additional CSS class names. */
    class?: string;
    /** Badges snippet content. */
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class="badge-group {className}">
  {#if children}
    {@render children()}
  {/if}
</div>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Visual style variant. */
    variant?: 'default' | 'primary' | 'outline' | 'dietary';
    /** Optional leading icon text/emoji. */
    icon?: string;
    /** Additional CSS class names. */
    class?: string;
    /** Badge label content snippet. */
    children?: Snippet;
  }

  let {
    variant = 'default',
    icon = '',
    class: className = '',
    children
  }: Props = $props();
</script>

<span class="badge badge-{variant} {className}">
  {#if icon}
    <span class="badge-icon" aria-hidden="true">{icon}</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</span>

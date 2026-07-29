<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Title heading for empty state. */
    title: string;
    /** Descriptive explanation text. */
    description?: string;
    /** Emoji or icon text display. */
    icon?: string;
    /** Additional CSS class names. */
    class?: string;
    /** Optional action button or link snippet. */
    action?: Snippet;
  }

  let {
    title,
    description = '',
    icon = '🔍',
    class: className = '',
    action
  }: Props = $props();
</script>

<div class="empty-state {className}">
  {#if icon}
    <div class="empty-state-icon" aria-hidden="true">{icon}</div>
  {/if}
  <h3 class="empty-state-title">{title}</h3>
  {#if description}
    <p class="empty-state-description">{description}</p>
  {/if}
  {#if action}
    <div class="empty-state-action">
      {@render action()}
    </div>
  {/if}
</div>

<script lang="ts">
  interface Props {
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: Event) => void;
    title?: string;
    disabled?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    type = 'button',
    class: className = '',
    onclick,
    title,
    disabled = false,
    children
  }: Props = $props();
</script>

<button
  {type}
  class={className}
  {title}
  {disabled}
  onclick={onclick}
>
  {#if children}
    {@render children()}
  {/if}
</button>

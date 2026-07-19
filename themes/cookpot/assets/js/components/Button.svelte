<script lang="ts">
  interface Props {
    id?: string;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: Event) => void;
    title?: string;
    disabled?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    id,
    type = 'button',
    class: className = '',
    onclick,
    title,
    disabled = false,
    children
  }: Props = $props();
</script>

<button
  {id}
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

<style>
  :global(.btn-brand) {
    background: var(--noonblue) !important;
    border-color: transparent !important;
    box-shadow: 0 3px 8px var(--noonblue-shadow-subtle) !important;
    color: #fff !important;
    isolation: isolate;
    position: relative;
    transition:
      color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease,
      border-color 0.2s ease;
  }

  :global(.btn-brand::before) {
    background: linear-gradient(
      135deg,
      var(--btn-brand-bg),
      var(--btn-brand-light)
    );
    border-radius: inherit;
    content: '';
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    transition: opacity 0.2s ease;
    width: 100%;
    z-index: -1;
  }

  :global(.btn-brand:hover::before) {
    opacity: 0;
  }

  :global(.btn-brand:hover) {
    color: var(--btn-brand-hover-text) !important;
  }
</style>



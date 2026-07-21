<script lang="ts">
  interface Props {
    /** The HTML id attribute for the button. */
    id?: string;
    /** The HTML type attribute for the button ('button', 'submit', or 'reset'). */
    type?: 'button' | 'submit' | 'reset';
    /** Custom CSS class names to apply to the button. */
    class?: string;
    /** Click event handler callback function. */
    onclick?: (e: Event) => void;
    /** Hover tooltip text or title attribute for accessibility. */
    title?: string;
    /** Whether the button is disabled and prevents user interaction. */
    disabled?: boolean;
    /** Svelte Snippet for the inner HTML/children content of the button. */
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





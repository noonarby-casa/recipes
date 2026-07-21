<script lang="ts">
  interface Props {
    /** The width and height of the icon in pixels. Default is 24. */
    size?: number;
    /** The stroke color. Default is 'currentColor'. */
    color?: string;
    /** The stroke width. Default is 2. */
    strokeWidth?: number;
    /** The fill color. Default is 'none'. */
    fill?: string;
    /** Whether to show the top watch button/line (pocket watch style). Default is false. */
    showTopButton?: boolean;
    /** CSS class names. */
    class?: string;
  }

  let {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    showTopButton = false,
    class: className = ''
  }: Props = $props();
</script>

<svg
  class="icon-clock {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
  {#if showTopButton}
    <line x1="12" y1="2" x2="12" y2="4"></line>
  {/if}
</svg>

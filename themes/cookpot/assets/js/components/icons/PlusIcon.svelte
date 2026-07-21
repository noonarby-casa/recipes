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
    /** CSS class names. */
    class?: string;
  }

  let {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    class: className = ''
  }: Props = $props();
</script>

<svg
  class="icon-plus {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <line x1="12" y1="5" x2="12" y2="19"></line>
  <line x1="5" y1="12" x2="19" y2="12"></line>
</svg>

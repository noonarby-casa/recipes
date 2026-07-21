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
  class="icon-dice {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
  <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"></circle>
</svg>

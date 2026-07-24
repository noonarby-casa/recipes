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
    class: className = '',
  }: Props = $props();
</script>

<svg
  class="icon-calendar {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8 2v4" />
  <path d="M16 2v4" />
  <rect width="18" height="18" x="3" y="4" rx="2" />
  <path d="M3 10h18" />
</svg>

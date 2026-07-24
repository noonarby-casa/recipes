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
  class="icon-edit {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  <path
    d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
  />
</svg>

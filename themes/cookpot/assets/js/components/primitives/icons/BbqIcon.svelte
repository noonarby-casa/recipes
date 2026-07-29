<script lang="ts">
  interface Props {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    fill?: string;
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
  class="icon-bbq {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 5V4" />
  <path d="m15 14 1 2" />
  <path d="M15 18H7" />
  <path d="M15 5V4" />
  <path d="M19 8H5a6 6 0 006 6h2a6 6 0 006-5.775z" />
  <path d="m9 14-3 6" />
  <path d="M9 5V4" />
  <circle cx="17" cy="18" r="2" />
</svg>

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
  class="icon-salad {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"></path>
  <path d="M7 12c-1-3 1-6 4-7 1 3-1 6-4 7z"></path>
  <path d="M17 12c1-3-1-6-4-7-1 3 1 6 4 7z"></path>
</svg>

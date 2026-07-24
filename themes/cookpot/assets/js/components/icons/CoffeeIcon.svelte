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
  class="icon-coffee {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
  <line x1="6" y1="1" x2="6" y2="4"></line>
  <line x1="10" y1="1" x2="10" y2="4"></line>
  <line x1="14" y1="1" x2="14" y2="4"></line>
</svg>

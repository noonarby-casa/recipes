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
  class="icon-pasta {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  fill={fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 19a8 8 0 0 0 16 0H4z"></path>
  <path d="M8 11c1 2 2 2 3 0s2-2 3 0"></path>
  <path d="M6 14c1 2 2 2 3 0s2-2 3 0s2 2 3 0s2-2 3 0"></path>
</svg>

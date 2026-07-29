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
  class="icon-utensils {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
  <path d="M7 2v20" />
  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
</svg>

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
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M2.95 18.43c-.2-.8 1.01-1.82 2.75-2.28 1.73-.47 3.3-.2 3.52.6.21.8-1.02 1.83-2.75 2.29-1.73.46-3.3.19-3.52-.6l-.39-1.45C1.17 11.8 4.25 6.46 9.44 5.07s10.53 1.69 11.92 6.88l.39 1.45c.21.8-1.02 1.83-2.75 2.29-1.73.46-3.3.19-3.52-.6-.21-.8 1.01-1.82 2.75-2.28 1.73-.47 3.3-.2 3.52.6"
  />
  <path d="m9.2 16.75-.4-1.45a3.25 3.25 0 0 1 6.27-1.68l.38 1.45" />
</svg>

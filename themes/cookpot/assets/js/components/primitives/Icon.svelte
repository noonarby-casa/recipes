<script lang="ts">
  import { ICON_DEFINITIONS, type IconName } from './icons';

  interface Props {
    /** The identifier of the icon to render. */
    name: IconName | string;
    /** The width and height in pixels. Defaults to 24. */
    size?: number | string;
    /** Stroke color. Defaults to 'currentColor'. */
    color?: string;
    /** Stroke width in pixels. Defaults to 2. */
    strokeWidth?: number;
    /** Fill color. Defaults to 'none'. */
    fill?: string;
    /** Additional CSS classes. */
    class?: string;
  }

  let {
    name,
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    class: className = '',
  }: Props = $props();

  let innerSvg = $derived(
    ICON_DEFINITIONS[name as IconName] || ICON_DEFINITIONS['utensils'] || '',
  );
</script>

<svg
  class="icon icon-{name} {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  stroke-width={strokeWidth}
  {fill}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html innerSvg}
</svg>

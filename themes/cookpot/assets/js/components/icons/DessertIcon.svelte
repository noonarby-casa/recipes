<script lang="ts">
  interface Props {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    class?: string;
    variant?: 'picker' | 'card';
  }

  let {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    fill = 'none',
    class: className = '',
    variant = 'picker',
  }: Props = $props();
</script>

{#if variant === 'card'}
  <svg
    class="icon-dessert icon-dessert-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Dessert Plate Base Linework -->
    <ellipse cx="60" cy="74" rx="46" ry="10" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Cake Slice Contour Linework -->
    <path d="M24 72 88 44V72H24z" stroke="var(--noonblue)" stroke-width="3.2" stroke-linejoin="round" fill="none" />
    <path d="M42 32 88 44" stroke="var(--noonblue)" stroke-width="3" fill="none" />
    <path d="M24 72 42 32l46 12" stroke="var(--noonblue)" stroke-width="3" stroke-linejoin="round" fill="none" />

    <!-- Layer Lines -->
    <path d="M24 64 88 42" stroke="var(--noonblue)" stroke-width="2.5" stroke-dasharray="6 3" fill="none" />
    <path d="M24 54 88 38" stroke="var(--noonblue)" stroke-width="2.5" stroke-dasharray="6 3" fill="none" />
    <path d="M28 46 64 36" stroke="var(--noonblue)" stroke-width="2" stroke-dasharray="4 2" opacity="0.7" fill="none" />

    <!-- Dripping Glaze Trails -->
    <path d="M42 32c0 5 2 9 4 9s2-4 3-8M56 36c0 6 2 10 4 10s2-5 3-9M72 40c0 4 2 7 3 7s2-3 3-7" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" />

    <!-- Whipped Cream & Cherry Garnish Linework -->
    <path d="M52 28c-3-2-6 0-6 3 0 3 3 5 6 5 4 0 7-3 6-6 0-3-3-4-6-2z" stroke="var(--noonblue)" stroke-width="2" fill="none" />
    <circle cx="56" cy="22" r="5.5" stroke="var(--noonblue)" stroke-width="2" fill="none" />
    <!-- Cherry Stem Curve -->
    <path d="M58 17c3-5 7-6 11-4" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" />

    <!-- Mint Leaf Linework -->
    <path d="M46 22c-3-3-7-2-9 1 2 3 6 3 9-1z" stroke="var(--noonblue)" stroke-width="1.8" fill="none" />
  </svg>
{:else}
  <svg
    class="icon-dessert {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path>
    <path d="M4 16s2-1 4-1 4 1 4 1 2-1 4-1 4 1 4 1"></path>
    <circle cx="12" cy="6" r="3"></circle>
  </svg>
{/if}

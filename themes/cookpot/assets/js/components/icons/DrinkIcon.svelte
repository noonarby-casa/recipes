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
    class="icon-drink icon-drink-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Mint Leaves Linework -->
    <path d="M42 24c-6-4-12-2-14 3 3 5 9 5 14-3z" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M46 22c-2-6 2-11 7-12-1 6-4 10-7 12z" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" />

    <!-- Lemon Wedge Slice Linework -->
    <path d="M72 26c6-6 16-6 20 0-4 10-14 12-20 0z" stroke="var(--noonblue)" stroke-width="2.5" stroke-linejoin="round" fill="none" />
    <path d="M76 25c3-2 8-2 10 0-2 4-6 5-10 0z" stroke="var(--noonblue)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8" />

    <!-- Bendy Straw Linework -->
    <path d="M40 10l12 12v54" stroke="var(--noonblue)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <line x1="42" y1="12" x2="45" y2="15" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" />

    <!-- Glass Body Linework -->
    <path d="M44 26h32l-6 52a4 4 0 0 1-4 4H54a4 4 0 0 1-4-4l-6-52z" stroke="var(--noonblue)" stroke-width="3.2" stroke-linejoin="round" fill="none" />
    
    <!-- Liquid Level Line -->
    <path d="M46 38h28" stroke="var(--noonblue)" stroke-width="2" stroke-dasharray="4 2" fill="none" opacity="0.8" />

    <!-- Floating Ice Cubes Linework -->
    <rect x="49" y="44" width="10" height="10" rx="2" stroke="var(--noonblue)" stroke-width="2" fill="none" transform="rotate(15 54 49)" />
    <rect x="60" y="56" width="9" height="9" rx="2" stroke="var(--noonblue)" stroke-width="2" fill="none" transform="rotate(-12 64 60)" />

    <!-- Glass Base Line -->
    <path d="M48 82h24" stroke="var(--noonblue)" stroke-width="3" stroke-linecap="round" />
  </svg>
{:else}
  <svg
    class="icon-drink {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path>
    <line x1="6" y1="2" x2="6" y2="4"></line>
    <line x1="10" y1="2" x2="10" y2="4"></line>
    <line x1="14" y1="2" x2="14" y2="4"></line>
  </svg>
{/if}

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
    class="icon-book icon-book-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Hardbound Cookbook Spine & Cover Outline -->
    <path d="M16 26c14-4 28 0 44 8 16-8 30-12 44-8v52c-14-4-28 0-44 8-16-8-30-12-44-8V26z" stroke="var(--noonblue)" stroke-width="3" stroke-linejoin="round" fill="none" />

    <!-- Left Page Folds -->
    <path d="M18 24c13-4 27 0 42 7v50c-15-7-29-11-42-7V24z" stroke="var(--noonblue)" stroke-width="2.2" stroke-linejoin="round" fill="none" />
    <!-- Right Page Folds -->
    <path d="M60 31c15-7 29-11 42-7v50c-13-4-27 0-42 7V31z" stroke="var(--noonblue)" stroke-width="2.2" stroke-linejoin="round" fill="none" />

    <!-- Page Center Crease -->
    <path d="M60 31v50" stroke="var(--noonblue)" stroke-width="2.8" stroke-linecap="round" fill="none" />

    <!-- Ribbon Bookmark Hanging Down -->
    <path d="M60 31v38l6-4 6 4V31" stroke="var(--noonblue)" stroke-width="2.2" stroke-linejoin="round" fill="none" />

    <!-- Left Page Recipe Text Lines -->
    <path d="M26 36h22M26 44h26M26 52h20M26 60h24" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.75" />
    <path d="M24 36c-1-2 1-4 3-3 2 1 2 4 0 5-2 1-3-2-3-2z" stroke="var(--noonblue)" stroke-width="1.5" fill="none" opacity="0.8" />

    <!-- Right Page Hand-Drawn Bowl & Lines -->
    <path d="M72 40h20M72 48h22M72 56h16" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.75" />
    <path d="M78 64c0 4 4 6 8 6s8-2 8-6h-16z" stroke="var(--noonblue)" stroke-width="2" fill="none" opacity="0.8" />
  </svg>
{:else}
  <svg
    class="icon-book {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
{/if}

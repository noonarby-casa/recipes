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
    class="icon-chef-hat icon-chef-hat-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Steam Swirls -->
    <path d="M48 14c-2-4 1-7 4-9M60 16c-2-5 2-8 5-10M72 14c-2-4 1-7 4-9" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Crossed Whisk & Wooden Spoon Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8">
      <!-- Wooden Spoon -->
      <path d="M24 74l68-52" stroke-width="3" />
      <ellipse cx="26" cy="72" rx="6" ry="4" stroke-width="2.2" transform="rotate(-35 26 72)" />
      <!-- Whisk -->
      <path d="M96 74L28 22" stroke-width="3" />
      <path d="M96 74c4-3 7-7 6-10s-6-3-9 0" stroke-width="2" />
    </g>

    <!-- Chef Toque Hat Puff Lines -->
    <path
      d="M34 54c-7 0-12-5-12-11 0-5 3-9 8-10 1-8 8-14 16-14 4 0 8 2 11 5 3-4 8-6 13-6 7 0 13 4 15 10 5 1 9 5 9 11 0 6-5 11-12 11"
      stroke="var(--noonblue)"
      stroke-width="3.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Toque Internal Pleat Lines -->
    <path d="M44 21c3 6 4 14 3 24M60 19c1 7 0 15-2 25M76 23c-2 6-4 13-6 21" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Stitched Hat Band Linework -->
    <path d="M34 54h52v12a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4V54z" stroke="var(--noonblue)" stroke-width="3" fill="none" />
    <path d="M34 62h52" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" />
    <line x1="48" y1="54" x2="48" y2="70" stroke="var(--noonblue)" stroke-width="1.8" opacity="0.7" />
    <line x1="72" y1="54" x2="72" y2="70" stroke="var(--noonblue)" stroke-width="1.8" opacity="0.7" />
  </svg>
{:else}
  <svg
    class="icon-chef-hat {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 13.8a4.5 4.5 0 1 1 .9-8.71 5 5 0 0 1 10.2 0A4.5 4.5 0 1 1 18 13.8"></path>
    <path d="M6 17h12a1 1 0 0 0 1-1v-2.2H5V16a1 1 0 0 0 1 1z"></path>
    <path d="M6 17v4h12v-4"></path>
  </svg>
{/if}

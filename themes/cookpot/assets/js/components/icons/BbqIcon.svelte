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
    class="icon-bbq icon-bbq-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Smoke Trails Above Skewers -->
    <path d="M46 16c2 4 1 8-2 11M60 14c2 5 1 9-3 13M74 16c2 4 1 8-2 11" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Sizzling Fire Flames Linework -->
    <path d="M38 52c-2-6 2-10 4-14 3 4 8 2 6 8M60 52c-2-8 3-12 5-16 4 5 8 3 6 10M80 52c-2-6 2-10 4-14 3 4 7 2 5 8" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" />

    <!-- Barbecue Skewer #1 Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="20" y1="36" x2="100" y2="36" stroke-width="3" />
      <rect x="30" y="28" width="12" height="16" rx="3" stroke-width="2.2" />
      <polygon points="48,28 58,36 48,44" stroke-width="2.2" />
      <rect x="62" y="28" width="12" height="16" rx="3" stroke-width="2.2" />
      <circle cx="82" cy="36" r="7" stroke-width="2.2" />
    </g>

    <!-- Barbecue Skewer #2 Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="24" y1="46" x2="96" y2="46" stroke-width="2.8" opacity="0.85" />
      <rect x="36" y="40" width="10" height="12" rx="2" stroke-width="2" />
      <circle cx="54" cy="46" r="5" stroke-width="2" />
      <rect x="68" y="40" width="10" height="12" rx="2" stroke-width="2" />
    </g>

    <!-- Grill Kettle Bowl Body Linework -->
    <path d="M26 52h68c0 18-15 28-34 28S26 70 26 52z" stroke="var(--noonblue)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <line x1="20" y1="52" x2="100" y2="52" stroke="var(--noonblue)" stroke-width="3.5" stroke-linecap="round" />
    <path d="M38 80l-8 10M82 80l8 10M60 80v10" stroke="var(--noonblue)" stroke-width="2.8" stroke-linecap="round" fill="none" opacity="0.8" />
  </svg>
{:else}
  <svg
    class="icon-bbq {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 2c.8 1.6.4 3-1 4.5-1.4 1.5-1.5 3-.5 4.5"></path>
    <path d="M7 3.5c.8 1.6.4 3-1 4.5"></path>
    <path d="M17 3.5c.8 1.6.4 3-1 4.5"></path>
    <path d="M3 13h18a9 9 0 0 1-18 0z"></path>
    <path d="M7 13v9"></path>
    <path d="M17 13v9"></path>
  </svg>
{/if}

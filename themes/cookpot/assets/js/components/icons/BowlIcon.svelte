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
    class="icon-bowl icon-bowl-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Steam Swirls -->
    <path d="M44 22c1.5-3 1-6-1.5-9M60 20c1.5-4 1-8-2-11M76 22c1.5-3 1-6-1.5-9" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Chopsticks Laying Across Rim -->
    <path d="M22 28l76 18M26 24l74 18" stroke="var(--noonblue)" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.85" />

    <!-- Ceramic Bowl Body -->
    <path d="M18 36h84c0 28-18 42-42 42S18 64 18 36z" stroke="var(--noonblue)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    
    <!-- Bowl Base Foot Ring -->
    <path d="M44 78h32v6H44z" stroke="var(--noonblue)" stroke-width="2.5" fill="none" />

    <!-- Bowl Rim Oval -->
    <ellipse cx="60" cy="36" rx="42" ry="7" stroke="var(--noonblue)" stroke-width="2.8" fill="none" />

    <!-- Noodle Swirls -->
    <path d="M32 37c6 2 12-1 18 1s12-1 18 1 12-1 18 1" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.75" />
    <path d="M28 40c8 2 14-1 20 1s14-1 20 1 14-1 20 1" stroke="var(--noonblue)" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.55" />

    <!-- Soft Boiled Egg Half Garnish Linework -->
    <ellipse cx="46" cy="42" rx="7" ry="5" stroke="var(--noonblue)" stroke-width="2" fill="none" />
    <circle cx="46" cy="42" r="3" stroke="var(--noonblue)" stroke-width="1.8" fill="none" />

    <!-- Scallion Specks Linework -->
    <rect x="66" y="39" width="4" height="3" rx="1" stroke="var(--noonblue)" stroke-width="1.5" fill="none" />
    <rect x="74" y="42" width="4" height="3" rx="1" stroke="var(--noonblue)" stroke-width="1.5" fill="none" />
    <rect x="60" y="44" width="4" height="3" rx="1" stroke="var(--noonblue)" stroke-width="1.5" fill="none" />
  </svg>
{:else}
  <svg
    class="icon-bowl {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M2 12h20a10 10 0 0 1-20 0z"></path>
    <path d="M6 22h12"></path>
    <path d="M12 17v5"></path>
  </svg>
{/if}

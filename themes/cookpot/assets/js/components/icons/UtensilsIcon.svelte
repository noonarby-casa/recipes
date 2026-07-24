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
    class="icon-utensils icon-utensils-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Ceramic Plate Oval Linework -->
    <ellipse cx="60" cy="50" rx="46" ry="32" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <ellipse cx="60" cy="50" rx="36" ry="24" stroke="var(--noonblue)" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" fill="none" opacity="0.6" />
    
    <!-- Folded Napkin Line Contour -->
    <path d="M30 36 78 68l12-14L42 22 30 36z" stroke="var(--noonblue)" stroke-width="1.8" stroke-linejoin="round" fill="none" opacity="0.7" />

    <!-- Detailed Fork Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M38 20c-1 6 0 12 4 16v32a3 3 0 0 0 6 0V36c4-4 5-10 4-16" stroke-width="2.8" />
      <path d="M41 18v12M44 18v12M47 18v12" stroke-width="2" />
      <path d="M39 20h10" stroke-width="2" />
      <path d="M45 42v22" stroke-width="1.5" opacity="0.7" />
    </g>

    <!-- Detailed Chef Knife Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M82 18C75 25 66 35 66 44v24a3 3 0 0 0 6 0V44c0-7 8-16 10-26z" stroke-width="2.8" />
      <circle cx="69" cy="52" r="1.5" stroke="var(--noonblue)" stroke-width="1.5" fill="none" />
      <circle cx="69" cy="60" r="1.5" stroke="var(--noonblue)" stroke-width="1.5" fill="none" />
      <path d="M80 20C73 27 67 36 67 43" stroke-width="1.5" opacity="0.7" />
    </g>

    <!-- Rosemary Garnish Sprig Linework -->
    <g stroke="var(--noonblue)" stroke-linecap="round" fill="none">
      <path d="M26 62c8-4 16-3 22 2" stroke-width="1.8" />
      <path d="M30 60c-2-3-4-3-6-2M36 58c-2-3-4-3-6-2M42 59c-1-3-3-4-5-3" stroke-width="1.6" />
    </g>
  </svg>
{:else}
  <svg
    class="icon-utensils {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M18 2v20"></path>
    <path d="M21 2v6a3 3 0 0 1-3 3v11"></path>
    <path d="M6 2v6a3 3 0 0 0 6 0V2"></path>
    <path d="M9 11v11"></path>
  </svg>
{/if}

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
    class="icon-pizza icon-pizza-card {className}"
    viewBox="0 0 120 90"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Pizza Slice Outline -->
    <path d="M22 68 60 16l38 52c-12 4-25 6-38 6s-26-2-38-6z" stroke="var(--noonblue)" stroke-width="3.2" stroke-linejoin="round" fill="none" />

    <!-- Artisan Crust Outline -->
    <path d="M18 70c12 6 26 8 42 8s30-2 42-8c-2 6-6 10-12 11-12 3-28 3-40 0-6-1-10-5-12-11z" stroke="var(--noonblue)" stroke-width="2.8" stroke-linejoin="round" fill="none" />
    <path d="M18 70c12 6 26 8 42 8s30-2 42-8" stroke="var(--noonblue)" stroke-width="2.2" stroke-linecap="round" fill="none" />

    <!-- Dripping Cheese Threads -->
    <path d="M38 68c0 4 2 8 4 8s3-4 3-8M58 70c0 5 2 9 4 9s3-4 3-9M74 68c0 3 2 6 4 6s2-3 2-6" stroke="var(--noonblue)" stroke-width="2.5" stroke-linecap="round" fill="none" />

    <!-- Pepperonis Linework -->
    <circle cx="60" cy="34" r="7" stroke="var(--noonblue)" stroke-width="2.2" fill="none" />
    <circle cx="44" cy="52" r="6" stroke="var(--noonblue)" stroke-width="2.2" fill="none" />
    <circle cx="72" cy="54" r="6.5" stroke="var(--noonblue)" stroke-width="2.2" fill="none" />
    <circle cx="48" cy="62" r="4.5" stroke="var(--noonblue)" stroke-width="2" fill="none" />

    <!-- Fresh Basil Leaves Linework -->
    <path d="M54 44c4-4 10-3 12 1-3 4-9 4-12-1z" stroke="var(--noonblue)" stroke-width="2" fill="none" />
    <path d="M36 38c3-3 8-2 10 1-2 3-7 3-10-1z" stroke="var(--noonblue)" stroke-width="2" fill="none" />
    <path d="M56 60c4-3 9-2 11 1-3 3-8 3-11-1z" stroke="var(--noonblue)" stroke-width="2" fill="none" />
  </svg>
{:else}
  <svg
    class="icon-pizza {className}"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke={color}
    stroke-width={strokeWidth}
    fill={fill}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M15 11h.01"></path>
    <path d="M11 15h.01"></path>
    <path d="M16 16h.01"></path>
    <path d="M2 16.5 12 2l10 14.5a18.3 18.3 0 0 1-20 0z"></path>
    <path d="M4.3 13.8a15.8 15.8 0 0 0 15.4 0"></path>
  </svg>
{/if}

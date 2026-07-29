<script lang="ts">
  import Badge from '../primitives/Badge.svelte';
  import TimerIcon from '../primitives/icons/TimerIcon.svelte';
  import { formatTime } from '../../utils/timer';

  interface Props {
    /** Unique timer identifier. */
    timerId: string;
    /** Optional timer label text (e.g., 'Simmer sauce'). */
    label?: string;
    /** Remaining duration in seconds. */
    remainingSeconds: number;
    /** Whether the timer countdown is currently running. */
    isRunning?: boolean;
    /** Whether the timer has reached zero / expired. */
    isExpired?: boolean;
    /** Optional click callback for toggling timer state. */
    onToggle?: () => void;
    /** Additional CSS class names. */
    class?: string;
  }

  let {
    timerId,
    label,
    remainingSeconds,
    isRunning = false,
    isExpired = false,
    onToggle,
    class: className = ''
  }: Props = $props();

  let formatted = $derived(formatTime(remainingSeconds));
  let badgeVariant: 'default' | 'primary' | 'outline' | 'dietary' = $derived(
    isExpired ? 'primary' : isRunning ? 'default' : 'outline'
  );
</script>

<button
  type="button"
  class="timer-badge-btn {className}"
  data-timer-id={timerId}
  onclick={() => onToggle?.()}
>
  <Badge variant={badgeVariant} class="timer-badge {isExpired ? 'expired' : ''} {isRunning ? 'running' : ''}">
    <TimerIcon size={14} class="timer-badge-icon" />
    {#if label}
      <span class="timer-badge-label">{label}:</span>
    {/if}
    <span class="timer-badge-countdown">{formatted}</span>
  </Badge>
</button>

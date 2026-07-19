<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { overlayStore } from '../stores/overlay';
  import { getSiteBasePath } from '../utils/site';

  onMount(() => {
    const fromPlan =
      new URLSearchParams(window.location.search).get('from') === 'plan';
    if (fromPlan) {
      overlayStore.setBackHref(getSiteBasePath() + 'plan/');
    }
  });

  onDestroy(() => {
    overlayStore.setBackHref(null);
  });
</script>

<!-- No visible markup — OverlayPanel renders the back link reactively -->

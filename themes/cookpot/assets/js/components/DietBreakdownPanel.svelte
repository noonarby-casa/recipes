<script lang="ts">
  import { recipesStore } from '../stores/recipes';
  import { plannerStore } from '../stores/planner';
  import { BREAKDOWN_CATEGORIES } from '../constants';

  let recipes = $derived($recipesStore);
  let plan = $derived($plannerStore.plan);

  let breakdownEntries = $derived.by(() => {
    if (plan.length === 0) {return [];}

    const tagCounts: Record<string, number> = {};
    plan.forEach((dm) => {
      const rec = recipes.find((r) => r.permalink === dm.permalink);
      if (!rec || !rec.tags) {return;}
      rec.tags.forEach((tag) => {
        const lower = tag.trim().toLowerCase();
        if (BREAKDOWN_CATEGORIES.includes(lower)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => `<strong>${count}</strong> ${tag}${count !== 1 ? 's' : ''}`);
  });
</script>

{#if breakdownEntries.length > 0}
  <div id="planner-balance-stats" class="planner-balance-stats">
    Plan breakdown: {@html breakdownEntries.join(', ')}
  </div>
{/if}

<style>
  .planner-balance-stats {
    display: block;
  }
</style>

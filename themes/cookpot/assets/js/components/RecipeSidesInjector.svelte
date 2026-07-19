<script lang="ts">
  import { plannerStore } from '../stores/planner';
  import { formatItemQuantity } from '../units';

  const urlParams = new URLSearchParams(window.location.search);
  const fromPlan = urlParams.get('from') === 'plan';
  const instanceId = urlParams.get('instanceId');
  const currentPath = window.location.pathname;
  const norm = (p: string) => p.replace(/\/+$/, '').replace(/^\/+/, '');

  const sides = $derived.by(() => {
    if (!fromPlan) {
      return [];
    }
    const item = $plannerStore.plan.find((p) =>
      instanceId
        ? p.instanceId === instanceId
        : p.permalink
          ? norm(p.permalink) === norm(currentPath)
          : false,
    );
    return item?.extraIngredients ?? [];
  });
</script>

{#if sides.length > 0}
  <h3 class="ingredient-category compound-list-header">Sides</h3>
  <ul class="recipe-ingredients-sublist compound-list-items">
    {#each sides as ing (ing.item)}
      {@const qtyVal =
        ing.qty !== undefined
          ? Array.isArray(ing.qty) ? ing.qty[0] : ing.qty
          : null}
      {@const formatted = formatItemQuantity(qtyVal, ing.unit ?? '', ing.item, true)}
      <li
        class="recipe-ingredient"
        data-item={ing.item}
        data-qty={qtyVal ?? undefined}
        data-unit={ing.unit ?? undefined}
        data-desc={ing.desc ?? undefined}
        data-prep={ing.prep ?? undefined}
      >
        {#if qtyVal !== null}
          <span class="recipe-quantity"
                data-base-qty={qtyVal}
                data-unit={ing.unit ?? ''}>{formatted.qtyStr}</span>{' '}
        {/if}
        {ing.desc ? `${ing.desc} ` : ''}{formatted.itemStr}{ing.prep ? `, ${ing.prep}` : ''}
      </li>
    {/each}
  </ul>
{/if}

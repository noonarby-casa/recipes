<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRecipeIngredientHTML } from '../../units';
  import { ITEM_RULES } from '../../data/rules';
  import { recipeScaleStore } from '../../stores/settings';
  import { plannerStore } from '../../stores/planner';
  import FavoriteButton from '../domain/FavoriteButton.svelte';
  import ServingsPicker from '../domain/ServingsPicker.svelte';

  interface Props {
    /** The default number of servings/portions for the recipe. */
    baseServings: number;
    /** The optional unique short ID of the recipe, used for favoriting/tracking. */
    shortId?: string;
  }

  const WEEKDAYS = [
    { key: 'mon', label: 'M', full: 'Monday' },
    { key: 'tue', label: 'T', full: 'Tuesday' },
    { key: 'wed', label: 'W', full: 'Wednesday' },
    { key: 'thu', label: 'T', full: 'Thursday' },
    { key: 'fri', label: 'F', full: 'Friday' },
    { key: 'sat', label: 'S', full: 'Saturday' },
    { key: 'sun', label: 'S', full: 'Sunday' },
  ] as const;

  let { baseServings, shortId }: Props = $props();

  let portions = $state(0);
  let currentPermalink = $state('');

  onMount(() => {
    portions = baseServings;
    currentPermalink = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const servingsParam = urlParams.get('servings');
    if (servingsParam) {
      const parsed = parseInt(servingsParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        portions = parsed;
      }
    }
  });

  $effect(() => {
    const scale = portions / baseServings;
    scaleIngredientsInDOM(scale);
    recipeScaleStore.set(scale);
    document.dispatchEvent(
      new CustomEvent('recipe:scale', { detail: { factor: scale } }),
    );
  });

  function isScheduledOn(dayKey: string): boolean {
    if (!currentPermalink) {
      return false;
    }
    return $plannerStore.plan.some(
      (item) =>
        item.permalink === currentPermalink &&
        (item.date || item.day) === dayKey,
    );
  }

  function toggleDay(dayKey: string) {
    if (!currentPermalink) {
      return;
    }
    const existing = $plannerStore.plan.find(
      (item) =>
        item.permalink === currentPermalink &&
        (item.date || item.day) === dayKey,
    );
    if (existing) {
      plannerStore.removeRecipe(existing.instanceId);
    } else {
      plannerStore.addRecipe(dayKey, currentPermalink);
    }
  }

  let hasAnyPlan = $derived(
    currentPermalink
      ? $plannerStore.plan.some((item) => item.permalink === currentPermalink)
      : false,
  );

  function scaleIngredientsInDOM(scale: number) {
    const ingredients = document.querySelectorAll('.recipe-ingredient');
    ingredients.forEach((el) => {
      const item = el.getAttribute('data-item') || '';
      const qtyAttr = el.getAttribute('data-qty') || '';
      const unit = el.getAttribute('data-unit') || '';
      const desc = el.getAttribute('data-desc') || '';
      const prep = el.getAttribute('data-prep') || '';
      const optional = el.getAttribute('data-optional') === 'true';

      const altItem = el.getAttribute('data-alt-item') || '';
      const altQtyAttr = el.getAttribute('data-alt-qty') || '';
      const altUnit = el.getAttribute('data-alt-unit') || '';
      const altDesc = el.getAttribute('data-alt-desc') || '';
      const altPrep = el.getAttribute('data-alt-prep') || '';

      let qty: number | [number, number] | null = null;
      if (qtyAttr) {
        if (qtyAttr.includes('-')) {
          const parts = qtyAttr.split('-').map(Number);
          qty = [parts[0] * scale, parts[1] * scale];
        } else {
          qty = Number(qtyAttr) * scale;
        }
      }

      let altQty: number | [number, number] | null = null;
      if (altQtyAttr) {
        if (altQtyAttr.includes('-')) {
          const parts = altQtyAttr.split('-').map(Number);
          altQty = [parts[0] * scale, parts[1] * scale];
        } else {
          altQty = Number(altQtyAttr) * scale;
        }
      }

      let alt = undefined;
      if (altItem || altQtyAttr) {
        alt = {
          qty: altQty,
          unit: altUnit,
          item: altItem,
          desc: altDesc,
          prep: altPrep,
        };
      }

      el.innerHTML = formatRecipeIngredientHTML(
        qty,
        unit,
        item,
        desc,
        prep,
        alt,
        optional,
      );

      const isDev = Boolean(
        (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV,
      );
      if (isDev) {
        const lowerItem = item.toLowerCase().trim();
        const hasRule = ITEM_RULES.some(
          (r) =>
            r.canonicalName.toLowerCase() === lowerItem ||
            r.items.some((i) =>
              typeof i === 'string'
                ? i.toLowerCase() === lowerItem
                : i.singular.toLowerCase() === lowerItem ||
                  i.plural.toLowerCase() === lowerItem ||
                  i.aliases?.some((a) => a.toLowerCase() === lowerItem),
            ),
        );
        if (!hasRule) {
          el.innerHTML += `<span class="dev-warning-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; margin-left: 6px; font-weight: 600;">⚠️ Unruled item</span>`;
        }
      }
    });
  }
</script>

<div class="recipe-controls-panel">
  <!-- Row 1: Servings Scaler & Favorite Button -->
  <div class="recipe-scale-panel">
    {#if shortId}
      <FavoriteButton {shortId} />
    {/if}
    <div class="scale-header">
      <span class="scale-label">Servings</span>
    </div>
    <div class="scale-controls">
      <ServingsPicker value={portions} onChange={(v) => (portions = v)} />
      <span class="scale-subtitle">(Original: {baseServings})</span>
    </div>
  </div>

  <!-- Row 2: Full-width Weekday Meal Plan Row -->
  <div class="recipe-meal-plan-row">
    <span class="meal-plan-row-label">Plan:</span>
    <div class="weekday-pill-group">
      {#each WEEKDAYS as day}
        {@const active = isScheduledOn(day.key)}
        <button
          type="button"
          class="weekday-pill"
          class:active
          onclick={() => toggleDay(day.key)}
          title={active
            ? `Scheduled for ${day.full} (Click to remove)`
            : `Add to ${day.full}`}
          aria-label={active
            ? `Scheduled for ${day.full}`
            : `Add to ${day.full}`}
        >
          {day.label}
        </button>
      {/each}
    </div>
    {#if hasAnyPlan}
      <a href="/plan/" class="view-plan-link" title="Open Meal Planner">
        <span class="view-plan-full">View Plan →</span>
        <span class="view-plan-short">Plan →</span>
      </a>
    {/if}
  </div>
</div>

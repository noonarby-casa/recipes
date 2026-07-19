<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRecipeIngredientHTML } from '../units';
  import FavoriteButton from './FavoriteButton.svelte';

  interface Props {
    baseServings: number;
    shortId?: string;
  }

  let { baseServings, shortId }: Props = $props();

  let portions = $state(baseServings);

  onMount(() => {
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
    scaleIngredientsInDOM(portions / baseServings);
  });

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
        optional
      );
    });
  }

  function dec() {
    portions = Math.max(1, portions - 1);
  }

  function inc() {
    portions = portions + 1;
  }
</script>

<div class="recipe-scale-panel">
  {#if shortId}
    <FavoriteButton {shortId} />
  {/if}
  <div class="scale-header">
    <span class="scale-label">Servings</span>
  </div>
  <div class="scale-controls">
    <div class="portion-picker">
      <button type="button" class="portion-btn dec-btn" id="recipe-dec-btn" onclick={dec}>−</button>
      <span class="portion-val" id="recipe-serving-count">{portions}</span>
      <button type="button" class="portion-btn inc-btn" id="recipe-inc-btn" onclick={inc}>+</button>
    </div>
    <span class="scale-subtitle">(Original: {baseServings})</span>
  </div>
</div>

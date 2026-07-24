<script lang="ts">
  import {onMount, tick} from 'svelte';
  import {SvelteMap} from 'svelte/reactivity';
  import {recipeScaleStore} from '../stores/settings';
  import {formatItemQuantity} from '../units';
  import {
    processShoppingList,
    extractIngredientsFromDOM,
  } from '../shopping-list/pipeline';
  import type {ShoppingItem} from '../types';
  import {
    getSectionForCategory,
    getActiveStoreLayout,
  } from '../shopping-list/store-sections';
  import { getIngredientKey } from '../stores/shopping';

  import ExportModal from './ExportModal.svelte';
  import type { ExportItem } from '../shopping-list/export-formatter';

  type Tab = 'recipe' | 'shopping';

  let activeTab = $state<Tab>('recipe');
  let showExportModal = $state(false);

  // Checklist state persists within the session
  const checklistStates = new SvelteMap<string, boolean>();

  // --------------------------------------------------------------------------
  // Derived shopping items — re-computed whenever scale changes
  // --------------------------------------------------------------------------

  interface ComputedList {
    buyItems: ShoppingItem[];
    optionalItems: ShoppingItem[];
  }

  let computed = $state<ComputedList>({buyItems: [], optionalItems: []});

  let exportItems = $derived<ExportItem[]>([
    ...computed.buyItems.map((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(isStaple, item.unit, item.item);
      return {
        ...item,
        isChecked: isChecked(key, isStaple),
        isOptional: false,
      };
    }),
    ...computed.optionalItems.map((item) => {
      const key = getIngredientKey(false, item.unit, item.item);
      return {
        ...item,
        isChecked: isChecked(key, false),
        isOptional: true,
      };
    }),
  ]);

  function recompute(scale: number) {
    const elements = document.querySelectorAll<HTMLElement>('.recipe-ingredient');
    const ingredients = extractIngredientsFromDOM(scale, elements);
    const activeLayout = getActiveStoreLayout();
    const {buyItems, stapleItems, optionalItems} = processShoppingList(
      ingredients,
      activeLayout,
    );

    // Merge staples into buy and sort by store section order then name
    const merged = [...buyItems, ...stapleItems].sort((a, b) => {
      const secA = getSectionForCategory(a.category);
      const secB = getSectionForCategory(b.category);
      if (secA.order !== secB.order) {return secA.order - secB.order;}
      return a.item.localeCompare(b.item);
    });

    computed = {buyItems: merged, optionalItems};
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------


  function isChecked(key: string, isStaple: boolean): boolean {
    return checklistStates.has(key) ? (checklistStates.get(key) ?? false) : isStaple;
  }

  function toggleChecked(key: string, isStaple: boolean, checked: boolean) {
    checklistStates.set(key, checked);
    // Force reactivity by reassigning computed (items re-render)
    computed = {...computed};
  }

  // --------------------------------------------------------------------------
  // Tab visibility: sync recipe-ingredients-list and shopping-list-wrapper
  // --------------------------------------------------------------------------

  function applyTabVisibility() {
    const recipeList = document.querySelector<HTMLElement>('.recipe-ingredients-list');
    const shoppingWrapper = document.querySelector<HTMLElement>('.shopping-list-wrapper');
    if (!recipeList || !shoppingWrapper) {return;}
    if (activeTab === 'recipe') {
      recipeList.style.display = 'block';
      shoppingWrapper.style.display = 'none';
    } else {
      recipeList.style.display = 'none';
      shoppingWrapper.style.display = 'block';
      recompute($recipeScaleStore);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  onMount(() => {
    // Initial compute
    recompute($recipeScaleStore);

    // Listen for scale changes from SingleRecipeScaler
    const onScale = (e: Event) => {
      const factor = (e as CustomEvent<{factor: number}>).detail?.factor;
      if (typeof factor === 'number') {
        recipeScaleStore.set(factor);
        if (activeTab === 'shopping') {recompute(factor);}
      }
    };

    // Listen for store layout changes
    const onLayout = () => {
      if (activeTab === 'shopping') {recompute($recipeScaleStore);}
    };

    // Listen for the ToggleGroup's change event from the shopping-view-toggle
    const viewToggle = document.querySelector<HTMLElement>('.shopping-view-toggle');
    const onViewToggle = (e: Event) => {
      const val = (e as CustomEvent<{value: string}>).detail?.value;
      if (val === 'recipe' || val === 'shopping') {
        activeTab = val as Tab;
        tick().then(applyTabVisibility);
      }
    };

    document.addEventListener('recipe:scale', onScale);
    document.addEventListener('store-layout:change', onLayout);
    viewToggle?.addEventListener('change', onViewToggle);

    return () => {
      document.removeEventListener('recipe:scale', onScale);
      document.removeEventListener('store-layout:change', onLayout);
      viewToggle?.removeEventListener('change', onViewToggle);
    };
  });
</script>

<!--
  RecipeShoppingList mounts inside .shopping-list-wrapper in the Hugo layout.
  The wrapper's display is toggled by the ToggleGroup above it.
  We render the shopping list content reactively.
-->
<div class="shopping-actions">
  <button
    type="button"
    id="btn-copy-shopping-list"
    class="btn btn-secondary btn-export-list"
    onclick={() => (showExportModal = true)}
  >
    Export List...
  </button>
</div>

<ExportModal
  isOpen={showExportModal}
  onClose={() => (showExportModal = false)}
  title={typeof document !== 'undefined' ? (document.querySelector('.recipe-title-bar h1')?.textContent || 'Recipe') : 'Recipe'}
  items={exportItems}
/>

<div class="shopping-section buy-section" style:display={computed.buyItems.length ? 'block' : 'none'}>
  <h4 class="shopping-section-title">Need to Buy</h4>
  <ul class="shopping-buy-list compound-list">
    {#each computed.buyItems as item (item.item + item.unit)}
      {@const isStaple = item.staple === 'in-pantry'}
      {@const key = getIngredientKey(isStaple, item.unit, item.item)}
      {@const checked = isChecked(key, isStaple)}
      {@const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item)}
      {@const notesArr = item.note?.ingredientNotes ?? []}
      {@const alts = [...new Set(notesArr.map((n) => n.altItem).filter(Boolean))]}
      {@const descs = [...new Set(notesArr.map((n) => n.descriptor).filter(Boolean))]}
      {#if item.category !== computed.buyItems[computed.buyItems.indexOf(item) - 1]?.category}
        <li class="shopping-section-header compound-list-header">
          {getSectionForCategory(item.category).name}
        </li>
      {/if}
      <li class="checklist-item" class:checked>
        <label class="checklist-item-label">
          <input
            type="checkbox"
            class="checklist-item-checkbox"
            data-key={key}
            data-item={item.item}
            {checked}
            onchange={(e) => toggleChecked(key, isStaple, (e.currentTarget as HTMLInputElement).checked)}
          />
          <span>
            {qtyStr ? qtyStr + ' ' : ''}{itemStr}
            {#if item.note?.sizeNote || descs.length || alts.length}
              <div class="checklist-item-details">
                {#if item.note?.sizeNote}
                  <span class="checklist-item-note">{item.note.sizeNote}</span>
                {/if}
                {#if descs.length}
                  <span class="checklist-item-note">{descs.join(', ')}</span>
                {/if}
                {#if alts.length}
                  <span class="checklist-item-note">or {alts.join(' or ')}</span>
                {/if}
              </div>
            {/if}
          </span>
        </label>
      </li>
    {/each}
  </ul>
</div>

<div class="shopping-section optional-section" style:display={computed.optionalItems.length ? 'block' : 'none'}>
  <h4 class="shopping-section-title">Optional</h4>
  <ul class="shopping-optional-list">
    {#each computed.optionalItems as item (item.item + item.unit)}
      {@const key = getIngredientKey(false, item.unit, item.item)}
      {@const checked = isChecked(key, false)}
      {@const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item)}
      <li class="checklist-item" class:checked>
        <label class="checklist-item-label">
          <input
            type="checkbox"
            class="checklist-item-checkbox"
            data-key={key}
            data-item={item.item}
            {checked}
            onchange={(e) => toggleChecked(key, false, (e.currentTarget as HTMLInputElement).checked)}
          />
          <span>{qtyStr ? qtyStr + ' ' : ''}{itemStr}</span>
        </label>
      </li>
    {/each}
  </ul>
</div>



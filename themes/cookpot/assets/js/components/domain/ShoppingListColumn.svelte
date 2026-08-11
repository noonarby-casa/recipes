<script lang="ts">
  import {
    combinedShoppingList,
    shoppingCheckedStore,
    shoppingAltSelectionsStore,
    getIngredientKey,
    isItemChecked,
  } from '../../stores/shopping';
  import { scrollable } from '../../actions/scrollable';
  import type { ShoppingItem } from '../../types';
  import {
    STORE_LAYOUTS,
    getSectionForCategory,
  } from '../../data/store-sections';
  import { storeLayout } from '../../stores/shopping';
  import ShoppingListItemRow from './ShoppingListItemRow.svelte';

  let items = $derived($combinedShoppingList.combinedBuyItems);
  let optionalItems = $derived($combinedShoppingList.optionalItems);

  let groupedBuyItems = $derived.by(() => {
    const sections: { id: string; name: string; items: ShoppingItem[] }[] = [];
    let currentSectionId = '';
    let currentSection: (typeof sections)[0] | null = null;
    const activeLayout =
      STORE_LAYOUTS.find((l) => l.id === $storeLayout) || STORE_LAYOUTS[0];

    items.forEach((item) => {
      const section = getSectionForCategory(item.category, activeLayout);
      if (section.id !== currentSectionId) {
        currentSectionId = section.id;
        currentSection = { id: section.id, name: section.name, items: [] };
        sections.push(currentSection);
      }
      currentSection?.items.push(item);
    });

    return sections;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="ingredients-column scrollable-area"
  use:scrollable
  id="col-shopping"
  tabindex="0"
  role="region"
  aria-label="Combined Shopping List"
>
  <div class="column-titlebar">
    <div class="column-title-group">
      <h2>Combined Shopping List</h2>
      <span class="column-subtitle"
        >Check off items you already have on hand. Pantry staples are pre-checked.</span
      >
    </div>
  </div>

  <div class="shopping-list-wrapper">
    <div class="shopping-section buy-section">
      <ul id="combined-buy-list" class="compound-list">
        {#if items.length === 0}
          <li class="planner-empty-state">No items needed.</li>
        {:else}
          {#each groupedBuyItems as section}
            <li class="shopping-section-header compound-list-header">{section.name}</li>
            {#each section.items as item}
              {@const isStaple = item.staple === 'in-pantry'}
              {@const key = getIngredientKey(isStaple, item.unit, item.item)}
              {@const isChecked = isItemChecked(key, isStaple, $shoppingCheckedStore)}
              <ShoppingListItemRow
                {item}
                {isChecked}
                onToggleChecked={() => shoppingCheckedStore.toggle(key, isStaple)}
                onToggleAlt={(recId, altSlug) =>
                  shoppingAltSelectionsStore.toggleAlt(recId, altSlug)}
              />
            {/each}
          {/each}
        {/if}
      </ul>
    </div>

    {#if optionalItems.length > 0}
      <div class="shopping-section optional-section">
        <h3>Optional</h3>
        <ul id="combined-optional-list">
          {#each optionalItems as item}
            {@const key = getIngredientKey(false, item.unit, item.item)}
            {@const isChecked = isItemChecked(key, false, $shoppingCheckedStore)}
            <ShoppingListItemRow
              {item}
              {isChecked}
              onToggleChecked={() => shoppingCheckedStore.toggle(key, false)}
              onToggleAlt={(recId, altSlug) =>
                shoppingAltSelectionsStore.toggleAlt(recId, altSlug)}
            />
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

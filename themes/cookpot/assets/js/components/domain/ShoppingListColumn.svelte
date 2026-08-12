<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
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

  const collapsedSections = new SvelteSet<string>();

  function toggleSection(sectionId: string) {
    if (collapsedSections.has(sectionId)) {
      collapsedSections.delete(sectionId);
    } else {
      collapsedSections.add(sectionId);
    }
  }

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

  let totalSectionsCount = $derived(
    groupedBuyItems.length + (optionalItems.length > 0 ? 1 : 0),
  );

  let allCollapsed = $derived(
    totalSectionsCount > 0 &&
      groupedBuyItems.every((sec) => collapsedSections.has(sec.id)) &&
      (optionalItems.length === 0 || collapsedSections.has('optional')),
  );

  function toggleAllSections() {
    if (allCollapsed) {
      collapsedSections.clear();
    } else {
      groupedBuyItems.forEach((sec) => collapsedSections.add(sec.id));
      if (optionalItems.length > 0) {
        collapsedSections.add('optional');
      }
    }
  }

  function getSectionCheckedInfo(sectionItems: ShoppingItem[]) {
    const total = sectionItems.length;
    const checked = sectionItems.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getIngredientKey(isStaple, item.unit, item.item);
      return isItemChecked(key, isStaple, $shoppingCheckedStore);
    }).length;
    return { checked, total, isComplete: total > 0 && checked === total };
  }
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
    {#if totalSectionsCount > 0}
      <div class="column-actions">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          onclick={toggleAllSections}
        >
          {allCollapsed ? 'Expand All' : 'Collapse All'}
        </button>
      </div>
    {/if}
  </div>

  <div class="shopping-list-wrapper">
    <div class="shopping-section buy-section">
      <ul id="combined-buy-list" class="compound-list">
        {#if items.length === 0}
          <li class="planner-empty-state">No items needed.</li>
        {:else}
          {#each groupedBuyItems as section}
            {@const info = getSectionCheckedInfo(section.items)}
            {@const isCollapsed = collapsedSections.has(section.id)}
            <li class="shopping-section-header compound-list-header">
              <button
                type="button"
                class="section-toggle-btn"
                aria-expanded={!isCollapsed}
                aria-controls={`section-buy-${section.id}`}
                onclick={() => toggleSection(section.id)}
              >
                <span class="section-toggle-title">
                  <span
                    class="section-chevron"
                    class:collapsed={isCollapsed}
                    aria-hidden="true">▼</span
                  >
                  <span>{section.name}</span>
                </span>
                <span class="section-count" class:completed={info.isComplete}>
                  {#if info.isComplete}
                    ✓ {info.total}/{info.total}
                  {:else}
                    {info.checked}/{info.total}
                  {/if}
                </span>
              </button>
            </li>
            {#if !isCollapsed}
              {#each section.items as item}
                {@const isStaple = item.staple === 'in-pantry'}
                {@const key = getIngredientKey(isStaple, item.unit, item.item)}
                {@const isChecked = isItemChecked(
                  key,
                  isStaple,
                  $shoppingCheckedStore,
                )}
                <ShoppingListItemRow
                  {item}
                  {isChecked}
                  onToggleChecked={() =>
                    shoppingCheckedStore.toggle(key, isStaple)}
                  onToggleAlt={(recId, altSlug) =>
                    shoppingAltSelectionsStore.toggleAlt(recId, altSlug)}
                />
              {/each}
            {/if}
          {/each}
        {/if}
      </ul>
    </div>

    {#if optionalItems.length > 0}
      {@const info = getSectionCheckedInfo(optionalItems)}
      {@const isCollapsed = collapsedSections.has('optional')}
      <div class="shopping-section optional-section">
        <ul id="combined-optional-list" class="compound-list">
          <li class="shopping-section-header compound-list-header">
            <button
              type="button"
              class="section-toggle-btn"
              aria-expanded={!isCollapsed}
              aria-controls="combined-optional-items"
              onclick={() => toggleSection('optional')}
            >
              <span class="section-toggle-title">
                <span
                  class="section-chevron"
                  class:collapsed={isCollapsed}
                  aria-hidden="true">▼</span
                >
                <span>Optional</span>
              </span>
              <span class="section-count" class:completed={info.isComplete}>
                {#if info.isComplete}
                  ✓ {info.total}/{info.total}
                {:else}
                  {info.checked}/{info.total}
                {/if}
              </span>
            </button>
          </li>
          {#if !isCollapsed}
            {#each optionalItems as item}
              {@const key = getIngredientKey(false, item.unit, item.item)}
              {@const isChecked = isItemChecked(
                key,
                false,
                $shoppingCheckedStore,
              )}
              <ShoppingListItemRow
                {item}
                {isChecked}
                onToggleChecked={() => shoppingCheckedStore.toggle(key, false)}
                onToggleAlt={(recId, altSlug) =>
                  shoppingAltSelectionsStore.toggleAlt(recId, altSlug)}
              />
            {/each}
          {/if}
        </ul>
      </div>
    {/if}
  </div>
</div>


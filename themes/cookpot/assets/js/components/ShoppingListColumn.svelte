<script lang="ts">
  import { combinedShoppingList, shoppingCheckedStore, getIngredientKey, isItemChecked } from '../stores/shopping';
  import { formatItemQuantity } from '../units';
  import { scrollable } from '../actions/scrollable';
  import type { ShoppingItem } from '../types';
  import { STORE_LAYOUTS } from '../shopping-list/store-sections';
  import { storeLayout } from '../stores/shopping';

  interface GroupedNote {
    descriptor?: string;
    altItem?: string;
    recipes: string[];
  }

  function getGroupedNotes(item: ShoppingItem): {
    sizeNote?: string;
    details: GroupedNote[];
    fallbackRecipes: string[];
  } {
    const details: GroupedNote[] = [];
    const fallbackRecipes: string[] = [];

    if (!item.note) {
      return { details, fallbackRecipes };
    }

    const sizeNote = item.note.sizeNote;
    const groups: Record<string, GroupedNote> = {};

    (item.note.ingredientNotes || []).forEach((n) => {
      const desc = n.descriptor || '';
      const alt = n.altItem || '';
      const recipe = n.recipe;

      if (!desc && !alt) {
        if (recipe && !fallbackRecipes.includes(recipe)) {
          fallbackRecipes.push(recipe);
        }
      } else {
        const key = `${desc}|${alt}`;
        if (!groups[key]) {
          groups[key] = {
            descriptor: n.descriptor,
            altItem: n.altItem,
            recipes: [],
          };
        }
        if (recipe && !groups[key].recipes.includes(recipe)) {
          groups[key].recipes.push(recipe);
        }
      }
    });

    return {
      sizeNote,
      details: Object.values(groups),
      fallbackRecipes,
    };
  }

  function getSection(category: string, layoutId: string) {
    const activeLayout = STORE_LAYOUTS.find((l) => l.id === layoutId) || STORE_LAYOUTS[0];
    const section = activeLayout.sections.find((s) => s.categories.includes(category));
    return (
      section ||
      activeLayout.sections.find((s) => s.id === 'other') ||
      activeLayout.sections[activeLayout.sections.length - 1]
    );
  }

  let items = $derived($combinedShoppingList.combinedBuyItems);
  let optionalItems = $derived($combinedShoppingList.optionalItems);

  let groupedBuyItems = $derived.by(() => {
    const sections: { id: string; name: string; items: ShoppingItem[] }[] = [];
    let currentSectionId = '';
    let currentSection: typeof sections[0] | null = null;

    items.forEach((item) => {
      const section = getSection(item.category, $storeLayout);
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
              {@const notes = getGroupedNotes(item)}
              {@const formatted = formatItemQuantity(item.qty, item.unit, item.item)}
              <li class="shopping-item {isChecked ? 'checked' : ''}">
                <label class="shopping-item-label">
                  <input
                    type="checkbox"
                    class="shopping-item-checkbox"
                    data-key={key}
                    data-item={item.item}
                    checked={isChecked}
                    onchange={() => shoppingCheckedStore.toggle(key, isStaple)}
                  />
                  <span>
                    {formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{formatted.itemStr}
                    
                    {#if notes.sizeNote || notes.details.length > 0 || notes.fallbackRecipes.length > 0}
                      <div class="shopping-item-details">
                        {#if notes.sizeNote}
                          <span class="shopping-item-note">{notes.sizeNote}</span>
                        {/if}
                        {#each notes.details as detail}
                          {@const detailText = `${detail.descriptor || ''} ${detail.altItem ? 'or ' + detail.altItem : ''}`.trim()}
                          <span class="shopping-item-note">
                            {detailText} {detail.recipes.length > 0 ? 'for ' + detail.recipes.join(', ') : ''}
                          </span>
                        {/each}
                        {#if notes.fallbackRecipes.length > 0}
                          <span class="shopping-item-note muted">for {notes.fallbackRecipes.join(', ')}</span>
                        {/if}
                      </div>
                    {/if}
                  </span>
                </label>
              </li>
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
            {@const notes = getGroupedNotes(item)}
            {@const formatted = formatItemQuantity(item.qty, item.unit, item.item)}
            <li class="shopping-item {isChecked ? 'checked' : ''}">
              <label class="shopping-item-label">
                <input
                  type="checkbox"
                  class="shopping-item-checkbox"
                  data-key={key}
                  data-item={item.item}
                  checked={isChecked}
                  onchange={() => shoppingCheckedStore.toggle(key, false)}
                />
                <span>
                  {formatted.qtyStr ? formatted.qtyStr + ' ' : ''}{formatted.itemStr}
                  
                  {#if notes.sizeNote || notes.details.length > 0 || notes.fallbackRecipes.length > 0}
                    <div class="shopping-item-details">
                      {#if notes.sizeNote}
                        <span class="shopping-item-note">{notes.sizeNote}</span>
                      {/if}
                      {#each notes.details as detail}
                        {@const detailText = `${detail.descriptor || ''} ${detail.altItem ? 'or ' + detail.altItem : ''}`.trim()}
                        <span class="shopping-item-note">
                          {detailText} {detail.recipes.length > 0 ? 'for ' + detail.recipes.join(', ') : ''}
                        </span>
                      {/each}
                      {#if notes.fallbackRecipes.length > 0}
                        <span class="shopping-item-note muted">for {notes.fallbackRecipes.join(', ')}</span>
                      {/if}
                    </div>
                  {/if}
                </span>
              </label>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

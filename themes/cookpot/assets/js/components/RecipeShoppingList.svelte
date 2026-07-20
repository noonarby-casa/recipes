<script lang="ts">
  import {onMount, tick} from 'svelte';
  import {SvelteMap} from 'svelte/reactivity';
  import {recipeScaleStore} from '../stores/settings';
  import {formatItemQuantity} from '../units';
  import {
    processShoppingList,
    extractIngredientsFromDOM,
  } from '../shopping-list/pipeline';
  import type {ShoppingItem} from '../shopping-list/types';
  import {
    getSectionForCategory,
    getActiveStoreLayout,
  } from '../shopping-list/store-sections';

  type Tab = 'recipe' | 'shopping';
  type CopyFormat = 'markdown' | 'google-keep';

  let activeTab = $state<Tab>('recipe');
  let copySuccess = $state(false);
  let copyFormat = $state('');

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

  function getKey(isStaple: boolean, unit: string, item: string): string {
    const stapleStr = isStaple ? 'staple' : 'buy';
    return `${stapleStr}_${unit.trim().toLowerCase()}_${item.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  }

  function isChecked(key: string, isStaple: boolean): boolean {
    return checklistStates.has(key) ? (checklistStates.get(key) ?? false) : isStaple;
  }

  function toggleChecked(key: string, isStaple: boolean, checked: boolean) {
    checklistStates.set(key, checked);
    // Force reactivity by reassigning computed (items re-render)
    computed = {...computed};
  }

  function formatNotes(item: ShoppingItem): string {
    if (!item.note) {return '';}
    const parts: string[] = [];
    if (item.note.sizeNote) {parts.push(item.note.sizeNote);}
    const descs = [...new Set(item.note.ingredientNotes.map((n) => n.descriptor).filter(Boolean))];
    const alts = [...new Set(item.note.ingredientNotes.map((n) => n.altItem).filter(Boolean))];
    if (descs.length) {parts.push(descs.join(', '));}
    if (alts.length) {parts.push(`or ${alts.join(' or ')}`);}
    return parts.length ? ` (${parts.join('; ')})` : '';
  }

  // --------------------------------------------------------------------------
  // Clipboard
  // --------------------------------------------------------------------------

  async function copyToClipboard(format: CopyFormat) {
    const scale = $recipeScaleStore;
    const elements = document.querySelectorAll<HTMLElement>('.recipe-ingredient');
    const ingredients = extractIngredientsFromDOM(scale, elements);
    const activeLayout = getActiveStoreLayout();
    const {buyItems, stapleItems, optionalItems} = processShoppingList(ingredients, activeLayout);

    const combinedBuy = [...buyItems, ...stapleItems].sort((a, b) => {
      const secA = getSectionForCategory(a.category);
      const secB = getSectionForCategory(b.category);
      if (secA.order !== secB.order) {return secA.order - secB.order;}
      return a.item.localeCompare(b.item);
    });

    const filteredBuy = combinedBuy.filter((item) => {
      const isStaple = item.staple === 'in-pantry';
      const key = getKey(isStaple, item.unit, item.item);
      return !isChecked(key, isStaple);
    });

    const filteredOptional = optionalItems.filter((item) => {
      const key = getKey(false, item.unit, item.item);
      return !isChecked(key, false);
    });

    const recipeTitle =
      document.querySelector('.recipe-title-bar h1')?.textContent || 'Recipe';

    let text: string;

    if (format === 'google-keep') {
      const lines = [
        ...filteredBuy.map((item) => {
          const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item);
          return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatNotes(item)}`;
        }),
        ...filteredOptional.map((item) => {
          const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item);
          return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatNotes(item)} (optional)`;
        }),
      ];
      text = lines.join('\n');
    } else {
      text = `## SHOPPING LIST: ${recipeTitle}\n`;
      if (filteredBuy.length) {
        text += '\n### Need to Buy\n';
        let currentSectionId = '';
        for (const item of filteredBuy) {
          const section = getSectionForCategory(item.category);
          if (section.id !== currentSectionId) {
            currentSectionId = section.id;
            text += `\n[ ${section.name} ]\n`;
          }
          const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item);
          text += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatNotes(item)}\n`;
        }
      }
      if (filteredOptional.length) {
        text += '\n### Optional\n';
        for (const item of filteredOptional) {
          const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item);
          text += `- [ ] ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatNotes(item)}\n`;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
        copyFormat = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function handleCopySelect(e: Event) {
    const select = e.currentTarget as HTMLSelectElement;
    const format = select.value as CopyFormat;
    if (format === 'markdown' || format === 'google-keep') {
      copyToClipboard(format);
    }
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
        activeTab = val;
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
  <select
    id="btn-copy-shopping-list"
    class="dropdown-select"
    class:success={copySuccess}
    aria-label="Copy shopping list options"
    value={copyFormat}
    onchange={handleCopySelect}
  >
    <option value="" disabled selected hidden>
      {copySuccess ? 'Copied!' : 'Copy Unchecked'}
    </option>
    <option value="markdown">Markdown</option>
    <option value="google-keep">Google Keep</option>
  </select>
</div>

<div class="shopping-section buy-section" style:display={computed.buyItems.length ? 'block' : 'none'}>
  <h4 class="shopping-section-title">Need to Buy</h4>
  <ul class="shopping-buy-list compound-list">
    {#each computed.buyItems as item (item.item + item.unit)}
      {@const isStaple = item.staple === 'in-pantry'}
      {@const key = getKey(isStaple, item.unit, item.item)}
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
      <li class="shopping-item" class:checked>
        <label class="shopping-item-label">
          <input
            type="checkbox"
            class="shopping-item-checkbox"
            data-key={key}
            data-item={item.item}
            {checked}
            onchange={(e) => toggleChecked(key, isStaple, (e.currentTarget as HTMLInputElement).checked)}
          />
          <span>
            {qtyStr ? qtyStr + ' ' : ''}{itemStr}
            {#if item.note?.sizeNote || descs.length || alts.length}
              <div class="shopping-item-details">
                {#if item.note?.sizeNote}
                  <span class="shopping-item-note">{item.note.sizeNote}</span>
                {/if}
                {#if descs.length}
                  <span class="shopping-item-note">{descs.join(', ')}</span>
                {/if}
                {#if alts.length}
                  <span class="shopping-item-note">or {alts.join(' or ')}</span>
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
      {@const key = getKey(false, item.unit, item.item)}
      {@const checked = isChecked(key, false)}
      {@const {qtyStr, itemStr} = formatItemQuantity(item.qty, item.unit, item.item)}
      <li class="shopping-item" class:checked>
        <label class="shopping-item-label">
          <input
            type="checkbox"
            class="shopping-item-checkbox"
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

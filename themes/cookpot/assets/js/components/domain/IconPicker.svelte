<script lang="ts">
  import UtensilsIcon from '../primitives/icons/UtensilsIcon.svelte';
  import ChefHatIcon from '../primitives/icons/ChefHatIcon.svelte';
  import BookIcon from '../primitives/icons/BookIcon.svelte';
  import PizzaIcon from '../primitives/icons/PizzaIcon.svelte';
  import BowlIcon from '../primitives/icons/BowlIcon.svelte';
  import BbqIcon from '../primitives/icons/BbqIcon.svelte';
  import DrinkIcon from '../primitives/icons/DrinkIcon.svelte';
  import DessertIcon from '../primitives/icons/DessertIcon.svelte';
  import SaladIcon from '../primitives/icons/SaladIcon.svelte';
  import SandwichIcon from '../primitives/icons/SandwichIcon.svelte';
  import BreakfastIcon from '../primitives/icons/BreakfastIcon.svelte';
  import PastaIcon from '../primitives/icons/PastaIcon.svelte';
  import SeafoodIcon from '../primitives/icons/SeafoodIcon.svelte';
  import TacosIcon from '../primitives/icons/TacosIcon.svelte';
  import BreadIcon from '../primitives/icons/BreadIcon.svelte';
  import SnackIcon from '../primitives/icons/SnackIcon.svelte';
  import CoffeeIcon from '../primitives/icons/CoffeeIcon.svelte';
  import RiceIcon from '../primitives/icons/RiceIcon.svelte';
  import SearchIcon from '../primitives/icons/SearchIcon.svelte';
  import XIcon from '../primitives/icons/XIcon.svelte';

  interface Props {
    selectedIcon?: string;
    onChange: (icon: string) => void;
  }

  let { selectedIcon = 'utensils', onChange }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let activeCategory = $state<string>('all');

  const ICONS = [
    { id: 'utensils', label: 'Utensils', category: 'mains', component: UtensilsIcon },
    { id: 'chef-hat', label: 'Chef Hat', category: 'mains', component: ChefHatIcon },
    { id: 'book', label: 'Recipe Book', category: 'bakery', component: BookIcon },
    { id: 'pizza', label: 'Pizza', category: 'mains', component: PizzaIcon },
    { id: 'bowl', label: 'Soup / Bowl', category: 'mains', component: BowlIcon },
    { id: 'bbq', label: 'Grill / BBQ', category: 'mains', component: BbqIcon },
    { id: 'drink', label: 'Beverage', category: 'drinks', component: DrinkIcon },
    { id: 'dessert', label: 'Dessert', category: 'desserts', component: DessertIcon },
    { id: 'salad', label: 'Salad', category: 'sides', component: SaladIcon },
    { id: 'sandwich', label: 'Sandwich', category: 'mains', component: SandwichIcon },
    { id: 'breakfast', label: 'Breakfast', category: 'mains', component: BreakfastIcon },
    { id: 'pasta', label: 'Pasta', category: 'mains', component: PastaIcon },
    { id: 'seafood', label: 'Seafood', category: 'mains', component: SeafoodIcon },
    { id: 'tacos', label: 'Tacos', category: 'mains', component: TacosIcon },
    { id: 'bread', label: 'Bakery / Bread', category: 'bakery', component: BreadIcon },
    { id: 'snack', label: 'Snack', category: 'sides', component: SnackIcon },
    { id: 'coffee', label: 'Coffee / Tea', category: 'drinks', component: CoffeeIcon },
    { id: 'rice', label: 'Rice / Grain Bowl', category: 'mains', component: RiceIcon },
  ];

  const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'mains', label: 'Mains' },
    { id: 'sides', label: 'Sides' },
    { id: 'bakery', label: 'Bakery' },
    { id: 'drinks', label: 'Drinks' },
    { id: 'desserts', label: 'Desserts' },
  ];

  let currentItem = $derived(
    ICONS.find((item) => item.id === (selectedIcon || 'utensils')) || ICONS[0]
  );
  let CurrentIcon = $derived(currentItem.component);

  let filteredIcons = $derived.by(() => {
    return ICONS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || item.label.toLowerCase().includes(q) || item.id.includes(q);
      return matchesCategory && matchesSearch;
    });
  });

  function handleSelect(id: string) {
    onChange(id);
    closeSheet();
  }

  function openSheet() {
    searchQuery = '';
    activeCategory = 'all';
    isOpen = true;
  }

  function closeSheet() {
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      closeSheet();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="icon-picker-trigger-wrapper">
  <button
    type="button"
    class="icon-picker-trigger-btn"
    onclick={openSheet}
    aria-expanded={isOpen ? 'true' : 'false'}
    aria-haspopup="dialog"
    title="Choose icon"
  >
    <div class="picker-trigger-left">
      <CurrentIcon size={18} strokeWidth={2} />
      <span class="picker-trigger-label">{currentItem.label}</span>
    </div>
    <span class="picker-trigger-action">Change Icon ▼</span>
  </button>

  {#if isOpen}
    <!-- Viewport-Fixed Child Overlay (z-index: 2000) -->
    <div
      class="icon-sheet-backdrop"
      onclick={closeSheet}
      onkeydown={(e) => {
        if (e.key === 'Escape') {closeSheet();}
      }}
      role="presentation"
    >
      <div
        class="icon-sheet-panel"
        role="dialog"
        tabindex={-1}
        aria-label="Icon Selector Sheet"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <!-- Header Row -->
        <div class="icon-sheet-header">
          <span class="icon-sheet-title">Choose Recipe Icon</span>
          <button
            type="button"
            class="icon-sheet-close-btn"
            onclick={closeSheet}
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="icon-sheet-search-wrapper">
          <div class="search-input-icon">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            class="icon-sheet-search-input"
            placeholder="Search icons (e.g. tacos, coffee, pizza)..."
            bind:value={searchQuery}
          />
        </div>

        <!-- Category Tabs -->
        <div class="icon-sheet-categories">
          {#each CATEGORIES as cat}
            <button
              type="button"
              class="icon-sheet-cat-pill {activeCategory === cat.id ? 'active' : ''}"
              onclick={() => (activeCategory = cat.id)}
            >
              {cat.label}
            </button>
          {/each}
        </div>

        <!-- 6-Column Icon Tile Matrix -->
        <div class="icon-sheet-grid">
          {#if filteredIcons.length === 0}
            <div class="icon-sheet-empty">No matching icons found</div>
          {:else}
            {#each filteredIcons as item}
              {@const IconComp = item.component}
              {@const isSelected = (selectedIcon || 'utensils') === item.id}
              <button
                type="button"
                class="icon-sheet-tile {isSelected ? 'selected' : ''}"
                onclick={() => handleSelect(item.id)}
                title={item.label}
              >
                <IconComp size={20} strokeWidth={2} />
              </button>
            {/each}
          {/if}
        </div>

        <!-- Selected Footer Bar -->
        <div class="icon-sheet-footer">
          <span class="icon-sheet-selected-name">
            Selected: <strong>{currentItem.label}</strong>
          </span>
          <button
            type="button"
            class="icon-sheet-done-btn"
            onclick={closeSheet}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .icon-picker-trigger-wrapper {
    display: inline-block;
  }

  .icon-picker-trigger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-subtle);
    background-color: var(--card-bg);
    color: var(--text-body);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 170px;
  }

  .icon-picker-trigger-btn:hover {
    border-color: var(--noonblue);
  }

  .picker-trigger-left {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .picker-trigger-label {
    font-weight: 500;
  }

  .picker-trigger-action {
    font-size: 0.72rem;
    color: var(--noonblue);
    font-weight: 600;
  }

  /* Viewport-Fixed Child Overlay (z-index: 2000) */
  .icon-sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    backdrop-filter: blur(2px);
  }

  .icon-sheet-panel {
    width: 350px;
    max-width: 92vw;
    background-color: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .icon-sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .icon-sheet-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-body);
  }

  .icon-sheet-close-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .icon-sheet-close-btn:hover {
    color: var(--text-body);
    background-color: var(--noonblue-bg-hover);
  }

  .icon-sheet-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input-icon {
    position: absolute;
    left: 0.6rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .icon-sheet-search-input {
    width: 100%;
    padding: 0.45rem 0.6rem 0.45rem 2.2rem;
    border-radius: 6px;
    border: 1px solid var(--border-subtle);
    background-color: var(--bg-color);
    color: var(--text-body);
    font-size: 0.8rem;
    outline: none;
  }

  .icon-sheet-search-input:focus {
    border-color: var(--noonblue);
  }

  .icon-sheet-categories {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .icon-sheet-cat-pill {
    padding: 0.2rem 0.55rem;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background-color: var(--bg-color);
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .icon-sheet-cat-pill.active {
    background-color: var(--noonblue);
    color: #ffffff;
    border-color: var(--noonblue);
  }

  .icon-sheet-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.4rem;
    min-height: 125px;
  }

  .icon-sheet-empty {
    grid-column: span 6;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
    padding: 1.5rem 0;
  }

  .icon-sheet-tile {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    background-color: var(--bg-color);
    color: var(--text-body);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-sheet-tile:hover {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue-border-light);
    color: var(--noonblue);
  }

  .icon-sheet-tile.selected {
    background-color: var(--noonblue);
    color: #ffffff;
    border-color: var(--noonblue);
    box-shadow: 0 2px 6px rgba(0, 81, 140, 0.3);
  }

  .icon-sheet-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  .icon-sheet-selected-name {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .icon-sheet-selected-name strong {
    color: var(--noonblue);
  }

  .icon-sheet-done-btn {
    padding: 0.3rem 0.85rem;
    border-radius: 6px;
    border: none;
    background-color: var(--noonblue);
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .icon-sheet-done-btn:hover {
    background-color: var(--noonblue-hover);
  }
</style>

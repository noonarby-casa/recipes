<script lang="ts">
  import UtensilsIcon from './icons/UtensilsIcon.svelte';
  import ChefHatIcon from './icons/ChefHatIcon.svelte';
  import BookIcon from './icons/BookIcon.svelte';
  import PizzaIcon from './icons/PizzaIcon.svelte';
  import BowlIcon from './icons/BowlIcon.svelte';
  import BbqIcon from './icons/BbqIcon.svelte';
  import DrinkIcon from './icons/DrinkIcon.svelte';
  import DessertIcon from './icons/DessertIcon.svelte';
  import SaladIcon from './icons/SaladIcon.svelte';
  import SandwichIcon from './icons/SandwichIcon.svelte';
  import BreakfastIcon from './icons/BreakfastIcon.svelte';
  import PastaIcon from './icons/PastaIcon.svelte';
  import SeafoodIcon from './icons/SeafoodIcon.svelte';
  import TacosIcon from './icons/TacosIcon.svelte';
  import BreadIcon from './icons/BreadIcon.svelte';
  import SnackIcon from './icons/SnackIcon.svelte';
  import CoffeeIcon from './icons/CoffeeIcon.svelte';
  import RiceIcon from './icons/RiceIcon.svelte';

  interface Props {
    selectedIcon?: string;
    onChange: (icon: string) => void;
  }

  let { selectedIcon = 'utensils', onChange }: Props = $props();

  let isOpen = $state(false);

  const ICONS = [
    { id: 'utensils', label: 'Utensils', component: UtensilsIcon },
    { id: 'chef-hat', label: 'Chef Hat', component: ChefHatIcon },
    { id: 'book', label: 'Recipe Book', component: BookIcon },
    { id: 'pizza', label: 'Pizza', component: PizzaIcon },
    { id: 'bowl', label: 'Soup / Bowl', component: BowlIcon },
    { id: 'bbq', label: 'Grill / BBQ', component: BbqIcon },
    { id: 'drink', label: 'Beverage', component: DrinkIcon },
    { id: 'dessert', label: 'Dessert', component: DessertIcon },
    { id: 'salad', label: 'Salad', component: SaladIcon },
    { id: 'sandwich', label: 'Sandwich', component: SandwichIcon },
    { id: 'breakfast', label: 'Breakfast', component: BreakfastIcon },
    { id: 'pasta', label: 'Pasta', component: PastaIcon },
    { id: 'seafood', label: 'Seafood', component: SeafoodIcon },
    { id: 'tacos', label: 'Tacos', component: TacosIcon },
    { id: 'bread', label: 'Bakery / Bread', component: BreadIcon },
    { id: 'snack', label: 'Snack', component: SnackIcon },
    { id: 'coffee', label: 'Coffee / Tea', component: CoffeeIcon },
    { id: 'rice', label: 'Rice / Grain Bowl', component: RiceIcon },
  ];

  let currentItem = $derived(
    ICONS.find((item) => item.id === (selectedIcon || 'utensils')) || ICONS[0]
  );
  let CurrentIcon = $derived(currentItem.component);

  function handleSelect(id: string) {
    onChange(id);
    isOpen = false;
  }

  function toggleOpen() {
    isOpen = !isOpen;
  }

  function handleWindowClick(e: MouseEvent) {
    if (isOpen && !(e.target as HTMLElement)?.closest('.icon-picker-wrapper')) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="icon-picker-wrapper">
  <button
    type="button"
    class="icon-picker-trigger"
    onclick={toggleOpen}
    aria-expanded={isOpen ? 'true' : 'false'}
    aria-haspopup="dialog"
    title="Choose icon"
  >
    <div class="trigger-left">
      <CurrentIcon size={18} strokeWidth={2} />
      <span class="trigger-label">{currentItem.label}</span>
    </div>
    <span class="trigger-chevron">{isOpen ? '▲' : '▼'}</span>
  </button>

  {#if isOpen}
    <div class="icon-picker-popover" role="dialog" aria-label="Icon Selector">
      <div class="popover-header">Select Icon</div>
      <div class="popover-grid">
        {#each ICONS as item}
          {@const IconComp = item.component}
          {@const isSelected = (selectedIcon || 'utensils') === item.id}
          <button
            type="button"
            class="popover-item-btn {isSelected ? 'selected' : ''}"
            onclick={() => handleSelect(item.id)}
            title={item.label}
          >
            <IconComp size={20} strokeWidth={2} />
            <span class="popover-item-label">{item.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .icon-picker-wrapper {
    position: relative;
    display: inline-block;
  }

  .icon-picker-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-subtle);
    background-color: var(--card-bg);
    color: var(--text-body);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 140px;
  }

  .icon-picker-trigger:hover {
    border-color: var(--noonblue);
  }

  .trigger-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .trigger-label {
    font-weight: 500;
  }

  .trigger-chevron {
    font-size: 0.65rem;
    color: var(--text-muted);
  }

  .icon-picker-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 1000;
    width: 230px;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .popover-header {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .popover-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .popover-item-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.55rem;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    background-color: var(--bg-color);
    color: var(--text-body);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .popover-item-btn:hover {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue-border-light);
    color: var(--noonblue);
  }

  .popover-item-btn.selected {
    background-color: var(--noonblue);
    color: #ffffff;
    border-color: var(--noonblue);
  }

  .popover-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

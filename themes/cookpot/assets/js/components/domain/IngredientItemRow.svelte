<script lang="ts">
  import Badge from '../primitives/Badge.svelte';

  interface Props {
    /** Name of the ingredient item. */
    name: string;
    /** Scaled quantity value. */
    quantity?: number | string;
    /** Unit string (e.g., 'cups', 'g', 'tbsp'). */
    unit?: string;
    /** Store section or aisle category (e.g., 'Produce', 'Dairy'). */
    storeSection?: string;
    /** Whether the row includes an interactive completion checkbox. */
    checkable?: boolean;
    /** Whether the ingredient is checked/completed. */
    checked?: boolean;
    /** Callback triggered when checkbox state changes. */
    onToggleCheck?: (checked: boolean) => void;
    /** Additional CSS class names. */
    class?: string;
  }

  let {
    name,
    quantity,
    unit,
    storeSection,
    checkable = false,
    checked = false,
    onToggleCheck,
    class: className = ''
  }: Props = $props();

  function handleCheckChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onToggleCheck?.(target.checked);
  }
</script>

<div class="ingredient-item-row {checked ? 'checked' : ''} {className}">
  {#if checkable}
    <input
      type="checkbox"
      class="ingredient-item-checkbox"
      {checked}
      onchange={handleCheckChange}
      aria-label="Mark {name} as purchased"
    />
  {/if}

  <span class="ingredient-item-details">
    {#if quantity !== undefined && quantity !== ''}
      <strong class="ingredient-item-qty">{quantity}</strong>
    {/if}
    {#if unit}
      <span class="ingredient-item-unit">{unit}</span>
    {/if}
    <span class="ingredient-item-name">{name}</span>
  </span>

  {#if storeSection}
    <Badge variant="outline" class="ingredient-item-section">
      {storeSection}
    </Badge>
  {/if}
</div>

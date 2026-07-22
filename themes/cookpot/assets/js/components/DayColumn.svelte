<script lang="ts">
  import type { PlannedItem } from '../types';
  import { plannerStore } from '../stores/planner';
  import RecipeCard from './RecipeCard.svelte';
  import { recipesStore } from '../stores/recipes';

  interface Props {
    /** The abbreviation of the day of the week (e.g. 'mon', 'tue'). */
    day: string;
    /** The full display name of the day (e.g. 'Monday'). */
    dayName: string;
    /** Whether the meal planner is currently in edit mode. */
    editMode: boolean;
    /** Callback triggered when adding a new recipe to this specific day. */
    onAddRecipe: () => void;
    /** Callback triggered when swapping an existing recipe on this day. */
    onSwapRecipe: (item: PlannedItem) => void;
    /** Callback triggered when editing the portions or scale details of a recipe on this day. */
    onEditDetails: (item: PlannedItem) => void;
  }

  let { day, dayName, editMode, onAddRecipe, onSwapRecipe, onEditDetails }: Props = $props();

  let items = $derived($plannerStore.plan.filter((p) => p.day === day));

  let isDragOver = $state(false);

  function handleDragStart(e: DragEvent, item: PlannedItem) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', item.instanceId);
      e.dataTransfer.effectAllowed = 'move';
    }
    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'flex';
    }
  }

  function handleDragEnd() {
    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'none';
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(e: DragEvent, targetItem?: PlannedItem) {
    e.preventDefault();
    isDragOver = false;

    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'none';
    }

    const draggedId = e.dataTransfer?.getData('text/plain');
    if (!draggedId) {return;}

    const allItems = [...$plannerStore.plan];
    const draggedIdx = allItems.findIndex((p) => p.instanceId === draggedId);
    if (draggedIdx === -1) {return;}

    const item = { ...allItems[draggedIdx], day };
    allItems.splice(draggedIdx, 1);

    if (targetItem) {
      const targetIdx = allItems.findIndex((p) => p.instanceId === targetItem.instanceId);
      if (targetIdx !== -1) {
        allItems.splice(targetIdx, 0, item);
      } else {
        allItems.push(item);
      }
    } else {
      allItems.push(item);
    }

    plannerStore.reorderRecipes(allItems);
  }

  let dayTotalMin = $derived.by(() => {
    let prep = 0;
    let cook = 0;
    items.forEach((dm) => {
      const r = $recipesStore.find((rec) => rec.permalink === dm.permalink);
      if (!r) {return;}
      r.times.forEach((t) => {
        const min = parseInt(t.time) || 0;
        if (t.step.toLowerCase() === 'prep') {prep += min;}
        if (t.step.toLowerCase() === 'cook') {cook += min;}
      });
    });
    return prep + cook;
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="day-column"
  class:drag-over={isDragOver}
  data-day={day}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={(e) => handleDrop(e)}
>
  <div class="day-header">
    <span class="day-title">{dayName}</span>
    {#if dayTotalMin > 0}
      <span class="day-time-badge">{dayTotalMin} min</span>
    {/if}
  </div>

  <div class="day-recipes-list" data-day={day}>
    {#each items as item (item.instanceId)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="drag-wrapper"
        draggable={editMode ? "true" : "false"}
        ondragstart={(e) => handleDragStart(e, item)}
        ondragend={handleDragEnd}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={(e) => { e.stopPropagation(); handleDrop(e, item); }}
      >
        <RecipeCard
          {item}
          variant="planner"
          {editMode}
          onRemove={() => plannerStore.removeRecipe(item.instanceId)}
          onSwap={() => onSwapRecipe(item)}
          onEditDetails={() => onEditDetails(item)}
        />
      </div>
    {/each}
  </div>

  {#if editMode}
    <div class="empty-slot-box" data-day={day} title="Add recipe to {dayName}" onclick={onAddRecipe}>
      <span class="empty-slot-plus">+</span>
    </div>
  {/if}
</div>

<style>
  .day-column {
    background-color: var(--recipe-title-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 150px;
    padding: 0.75rem;
    transition: all 0.2s ease;
  }

  .day-column:hover {
    border-color: var(--border-color);
  }

  .day-header {
    align-items: baseline;
    border-bottom: 1px solid var(--border-ultra-subtle);
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.4rem;
  }

  .day-title {
    color: var(--text-title);
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: capitalize;
  }

  .day-time-badge {
    color: var(--text-muted);
    font-size: 0.7rem;
    font-weight: 600;
  }

  .day-recipes-list {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 0.6rem;
    min-height: 40px;
  }

  .empty-slot-box {
    align-items: center;
    background-color: transparent;
    border: 1.5px dashed var(--btn-border);
    border-radius: 8px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    gap: 1rem;
    justify-content: center;
    min-height: 44px;
    padding: 0.6rem;
    transition: all 0.2s ease;
  }

  .day-recipes-list .empty-slot-box {
    height: 60px;
    min-height: 60px;
  }

  .empty-slot-box:hover {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue);
  }

  .empty-slot-plus {
    color: var(--text-muted);
    font-size: 1.2rem;
    font-weight: 700;
    transition: all 0.2s ease;
    user-select: none;
  }

  .empty-slot-box:hover .empty-slot-plus {
    color: var(--noonblue);
  }

  .empty-slot-random {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    box-sizing: border-box;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.1rem;
    justify-content: center;
    min-height: 38px;
    min-width: 38px;
    padding: 0.5rem;
    transition: all 0.2s ease;
  }

  .empty-slot-random:hover {
    background-color: rgba(255, 145, 0, 0.15);
    color: #ff9100;
  }

  .empty-slot-box.dinner-empty-slot {
    border-color: var(--border-subtle);
    border-width: 2.5px;
  }

  .empty-slot-box.dinner-empty-slot:hover {
    border-color: var(--noonblue);
  }

  :global(.empty-slot-box.drag-over) {
    background-color: var(--noonblue-bg-light);
    border-color: var(--noonblue);
  }

  @media (max-width: 767px) {
    .day-column {
      min-height: auto;
      padding: 0.75rem 1rem;
    }

    .day-recipes-list :global(.recipe-card-unified) {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .day-recipes-list :global(.recipe-card-title) {
      font-size: 0.85rem;
      line-height: 1.3;
    }
  }
</style>


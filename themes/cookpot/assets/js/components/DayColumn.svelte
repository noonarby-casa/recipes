<script lang="ts">
  import type { PlannedItem } from '../types';
  import { plannerStore } from '../stores/planner';
  import PlannedRecipeCard from './PlannedRecipeCard.svelte';
  import { recipesStore } from '../stores/recipes';

  interface Props {
    day: string;
    dayName: string;
    editMode: boolean;
    onAddRecipe: () => void;
    onSwapRecipe: (item: PlannedItem) => void;
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
        draggable={editMode ? "true" : "false"}
        ondragstart={(e) => handleDragStart(e, item)}
        ondragend={handleDragEnd}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={(e) => { e.stopPropagation(); handleDrop(e, item); }}
        style="display: contents;"
      >
        <PlannedRecipeCard
          {item}
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

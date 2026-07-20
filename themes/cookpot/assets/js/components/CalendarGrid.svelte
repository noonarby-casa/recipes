<script lang="ts">
  import { settingsStore } from '../stores/settings';
  import { plannerStore } from '../stores/planner';
  import { scrollable } from '../actions/scrollable';
  import type { PlannedItem } from '../types';
  import DayColumn from './DayColumn.svelte';
  import PlannedRecipeCard from './PlannedRecipeCard.svelte';
  import DietBreakdownPanel from './DietBreakdownPanel.svelte';

  interface Props {
    editMode: boolean;
    onAddRecipe: (day: string) => void;
    onSwapRecipe: (item: PlannedItem) => void;
    onEditDetails: (item: PlannedItem) => void;
  }

  let { editMode, onAddRecipe, onSwapRecipe, onEditDetails }: Props = $props();

  const DAYS_ALL = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY_NAMES: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
  };

  let activeDays = $derived($settingsStore.workWeekOnly ? DAYS_ALL.slice(0, 5) : DAYS_ALL);

  let supplementalItems = $derived($plannerStore.plan.filter((p) => p.day === 'supplemental'));

  let isDragOverSupp = $state(false);

  function handleDragOverSupp(e: DragEvent) {
    e.preventDefault();
    isDragOverSupp = true;
  }

  function handleDragLeaveSupp() {
    isDragOverSupp = false;
  }

  function handleDropSupp(e: DragEvent, targetItem?: PlannedItem) {
    e.preventDefault();
    isDragOverSupp = false;

    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'none';
    }

    const draggedId = e.dataTransfer?.getData('text/plain');
    if (!draggedId) {return;}

    const allItems = [...$plannerStore.plan];
    const draggedIdx = allItems.findIndex((p) => p.instanceId === draggedId);
    if (draggedIdx === -1) {return;}

    const item = { ...allItems[draggedIdx], day: 'supplemental' };
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

  function handleDragStartSupp(e: DragEvent, item: PlannedItem) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', item.instanceId);
      e.dataTransfer.effectAllowed = 'move';
    }
    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'flex';
    }
  }

  function handleDragEndSupp() {
    const trashZone = document.getElementById('planner-trash-zone');
    if (trashZone) {
      trashZone.style.display = 'none';
    }
  }
</script>

<div
  class="planner-column scrollable-area"
  use:scrollable
  id="col-planner"
  tabindex="0"
  role="region"
  aria-label="Meal Planner Calendar"
>
  <div id="planned-recipes-list-grid" class="planned-recipes-grid">
    {#each activeDays as day}
      <DayColumn
        {day}
        dayName={DAY_NAMES[day]}
        {editMode}
        onAddRecipe={() => onAddRecipe(day)}
        {onSwapRecipe}
        {onEditDetails}
      />
    {/each}
  </div>

  <!-- Trash Zone -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    id="planner-trash-zone"
    class="planner-trash-zone"
    style="display: none;"
    ondragover={(e) => e.preventDefault()}
    ondrop={(e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer?.getData('text/plain');
      if (draggedId) {
        plannerStore.removeRecipe(draggedId);
      }
      const trashZone = document.getElementById('planner-trash-zone');
      if (trashZone) {
        trashZone.style.display = 'none';
      }
    }}
  >
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
    <span>Drop here to delete</span>
  </div>

  {#if editMode || supplementalItems.length > 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="supplemental-section" id="supplemental-section">
      <h2 class="supplemental-title">Anytime / Supplemental</h2>
      <div
        class="supplemental-recipes-list"
        class:drag-over={isDragOverSupp}
        id="supplemental-recipes-list"
        ondragover={handleDragOverSupp}
        ondragleave={handleDragLeaveSupp}
        ondrop={(e) => handleDropSupp(e)}
      >
        {#each supplementalItems as item (item.instanceId)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            draggable={editMode ? "true" : "false"}
            ondragstart={(e) => handleDragStartSupp(e, item)}
            ondragend={handleDragEndSupp}
            ondragover={handleDragOverSupp}
            ondragleave={handleDragLeaveSupp}
            ondrop={(e) => { e.stopPropagation(); handleDropSupp(e, item); }}
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

        {#if editMode}
          <div class="empty-slot-box" data-day="supplemental" title="Add supplemental recipe" onclick={() => onAddRecipe('supplemental')}>
            <span class="empty-slot-plus">+</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <DietBreakdownPanel />
</div>

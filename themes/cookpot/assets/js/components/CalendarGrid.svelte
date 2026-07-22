<script lang="ts">
  import { settingsStore } from '../stores/settings';
  import { plannerStore } from '../stores/planner';
  import { scrollable } from '../actions/scrollable';
  import type { PlannedItem } from '../types';
  import DayColumn from './DayColumn.svelte';
  import RecipeCard from './RecipeCard.svelte';
  import DietBreakdownPanel from './DietBreakdownPanel.svelte';
  import TrashIcon from './icons/TrashIcon.svelte';

  interface Props {
    /** Whether the meal planner is currently in edit mode (allowing adding/moving/removing/editing recipes). */
    editMode: boolean;
    /** Callback triggered when requesting to add a recipe to a specific day. */
    onAddRecipe: (day: string) => void;
    /** Callback triggered when requesting to swap a specific planned recipe. */
    onSwapRecipe: (item: PlannedItem) => void;
    /** Callback triggered when requesting to edit detailed portions or scale of a planned recipe. */
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
  let isDragOverTrash = $state(false);
</script>

<div
  class="planner-column scrollable-area"
  use:scrollable
  id="col-planner"
  tabindex="0"
  role="region"
  aria-label="Meal Planner Calendar"
>
  <div id="planned-recipes-list-grid" class="planned-recipes-grid" class:grid-5day={$settingsStore.workWeekOnly}>
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
              class="drag-wrapper"
              draggable={editMode ? "true" : "false"}
              ondragstart={(e) => handleDragStartSupp(e, item)}
              ondragend={handleDragEndSupp}
              ondragover={handleDragOverSupp}
              ondragleave={handleDragLeaveSupp}
              ondrop={(e) => { e.stopPropagation(); handleDropSupp(e, item); }}
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

          {#if editMode}
            <div class="empty-slot-box" data-day="supplemental" title="Add supplemental recipe" onclick={() => onAddRecipe('supplemental')}>
              <span class="empty-slot-plus">+</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Trash Zone -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    id="planner-trash-zone"
    class="planner-trash-zone"
    class:drag-over={isDragOverTrash}
    ondragenter={(e) => {
      e.preventDefault();
      isDragOverTrash = true;
    }}
    ondragover={(e) => {
      e.preventDefault();
      isDragOverTrash = true;
    }}
    ondragleave={() => {
      isDragOverTrash = false;
    }}
    ondrop={(e) => {
      e.preventDefault();
      isDragOverTrash = false;
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
    <TrashIcon size={20} strokeWidth={2} />
    <span>Drop here to delete</span>
  </div>

  <DietBreakdownPanel />
</div>

<style>
  .planned-recipes-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    margin-bottom: 1.5rem;
  }

  .planned-recipes-grid.grid-5day {
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .planned-recipes-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .planned-recipes-grid.grid-5day {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .planned-recipes-grid .supplemental-section {
      grid-column: 3 / span 3;
      margin-top: 0;
    }

    .planned-recipes-grid.grid-5day .supplemental-section {
      grid-column: 1 / span 5;
      margin-top: 0;
    }
  }

  .supplemental-section {
    background-color: var(--recipe-title-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    margin-top: 1.5rem;
    padding: 0.75rem;
    transition: all 0.2s ease;
    width: 100%;
  }

  .supplemental-title {
    border-bottom: 1px solid var(--border-ultra-subtle);
    color: var(--text-title);
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    padding-bottom: 0.4rem;
  }

  .supplemental-recipes-list {
    box-sizing: border-box;
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.75rem;
  }

  .supplemental-recipes-list :global(.planned-recipe-item) {
    flex: 0 0 160px;
    margin: 0;
  }

  .supplemental-recipes-list .empty-slot-box {
    align-items: center;
    align-self: stretch;
    display: flex;
    flex: 0 0 160px;
    justify-content: center;
    min-height: 120px;
  }

  .planner-trash-zone {
    align-items: center;
    background-color: rgba(255, 74, 74, 0.05);
    border: 2px dashed #ff4a4a;
    border-radius: 12px;
    color: #ff4a4a;
    display: none;
    font-size: 0.9rem;
    font-weight: 700;
    gap: 0.6rem;
    justify-content: center;
    margin-top: 1rem;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .planner-trash-zone.drag-over {
    background-color: rgba(255, 74, 74, 0.15);
    transform: scale(1.01);
  }
</style>


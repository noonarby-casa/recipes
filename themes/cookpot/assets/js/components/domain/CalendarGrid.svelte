<script lang="ts">
  import { settingsStore } from '../../stores/settings';
  import { plannerStore } from '../../stores/planner';
  import { scrollable } from '../../actions/scrollable';
  import type { PlannedItem } from '../../types';
  import DayColumn from './DayColumn.svelte';
  import DietBreakdownPanel from './DietBreakdownPanel.svelte';
  import TrashIcon from '../primitives/icons/TrashIcon.svelte';
  import { formatDayTitle, getDateSequence, formatIsoDate, getMondayOfWeek } from '../../utils/dates';

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

  let startDateStr = $derived($settingsStore.startDate || formatIsoDate(getMondayOfWeek()));
  let durationDays = $derived($settingsStore.durationDays || 5);

  let activeDays = $derived(getDateSequence(startDateStr, durationDays));

  let supplementalItems = $derived(
    $plannerStore.plan.filter((p) => (p.date || p.day) === 'supplemental'),
  );

  let isDragOverTrash = $state(false);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="planner-column scrollable-area"
  use:scrollable
  id="col-planner"
  tabindex="0"
  role="region"
  aria-label="Meal Planner Calendar"
>
  <div
    id="planned-recipes-list-grid"
    class="planned-recipes-grid"
    class:grid-5day={$settingsStore.workWeekOnly}
  >
    {#each activeDays as dateStr}
      <DayColumn
        day={dateStr}
        dayName={formatDayTitle(dateStr)}
        {editMode}
        onAddRecipe={() => onAddRecipe(dateStr)}
        {onSwapRecipe}
        {onEditDetails}
      />
    {/each}

    {#if editMode || supplementalItems.length > 0}
      <DayColumn
        day="supplemental"
        dayName="Anytime / Supplemental"
        {editMode}
        onAddRecipe={() => onAddRecipe('supplemental')}
        {onSwapRecipe}
        {onEditDetails}
      />
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

    .planned-recipes-grid :global(.day-column[data-day='supplemental']) {
      grid-column: 1 / span 5;
    }

    .planned-recipes-grid.grid-5day
      :global(.day-column[data-day='supplemental']) {
      grid-column: 1 / span 5;
    }
  }

  .planner-trash-zone {
    align-items: center;
    background-color: rgba(239, 68, 68, 0.05);
    border: 2px dashed var(--danger-color);
    border-radius: 12px;
    color: var(--danger-color);
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

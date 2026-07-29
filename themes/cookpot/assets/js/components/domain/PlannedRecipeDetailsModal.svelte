<script lang="ts">
  import { recipesStore } from '../../stores/recipes';
  import { favoritesStore } from '../../stores/favorites';
  import { plannerStore } from '../../stores/planner';
  import { scrollable } from '../../actions/scrollable';
  import type { PlannedItem, IngredientInput } from '../../types';
  import Modal from '../primitives/Modal.svelte';
  import ServingsPicker from './ServingsPicker.svelte';
  import HeartIcon from '../primitives/icons/HeartIcon.svelte';
  import IconPicker from './IconPicker.svelte';
  import IngredientsEditor from './IngredientsEditor.svelte';

  interface Props {
    /** Whether the details editor modal is open and visible. */
    isOpen: boolean;
    /** The planned item (recipe or custom food item) whose details are being edited. */
    item: PlannedItem;
    /** Callback function to close the details editor modal. */
    onClose: () => void;
  }

  let { isOpen, item, onClose }: Props = $props();

  let currentItem = $derived(
    $plannerStore.plan.find((p) => p.instanceId === item.instanceId) || item
  );
  let recipes = $derived($recipesStore);
  let rec = $derived(
    currentItem.permalink
      ? recipes.find((r) => r.permalink === currentItem.permalink)
      : undefined
  );
  let title = $derived(
    rec ? rec.title : currentItem.customTitle || 'Custom Item'
  );
  let defaultServings = $derived(rec ? rec.servings : 4);
  let portions = $derived(Math.round(currentItem.scale * defaultServings));
  let isFav = $derived(
    rec && rec.shortId ? $favoritesStore.includes(rec.shortId) : false
  );

  let extras = $derived(currentItem.extraIngredients || []);

  function toggleFavorite() {
    if (rec && rec.shortId) {
      favoritesStore.toggle(rec.shortId);
    }
  }

  function handleIngredientsChange(next: IngredientInput[]) {
    plannerStore.updateExtraIngredients(currentItem.instanceId, next);
  }
</script>

<Modal
  {isOpen}
  {onClose}
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content"
  contentStyle="max-height: 85vh; height: auto;"
>
  {#snippet header()}
    <div class="planner-modal-header details-modal-header">
      <h3>Edit Details: {title}</h3>
      <button type="button" class="modal-close-btn" onclick={onClose}>✕</button>
    </div>
  {/snippet}

  <div class="planner-modal-body scrollable-area" use:scrollable>
    {#if !rec}
      <h4 class="details-section-title">Title</h4>
      <input
        type="text"
        value={currentItem.customTitle || ''}
        onchange={(e) => plannerStore.updateCustomTitle(currentItem.instanceId, e.currentTarget.value)}
        class="title-input"
      />

      <div class="details-inline-row">
        <div class="details-inline-group">
          <h4 class="details-section-title">Icon</h4>
          <IconPicker
            selectedIcon={currentItem.icon || 'utensils'}
            onChange={(nextIcon) => plannerStore.updateIcon(currentItem.instanceId, nextIcon)}
          />
        </div>

        <div class="details-inline-group">
          <h4 class="details-section-title">Servings</h4>
          <ServingsPicker
            value={portions}
            onChange={(nextVal) => plannerStore.updateScale(currentItem.instanceId, nextVal / defaultServings)}
          />
        </div>
      </div>
    {:else}
      <h4 class="details-section-title">Servings</h4>
      <div class="portions-row">
        <ServingsPicker
          value={portions}
          onChange={(nextVal) => plannerStore.updateScale(currentItem.instanceId, nextVal / defaultServings)}
        />

        {#if rec && rec.shortId}
          <button
            type="button"
            class="recipe-favorite-btn {isFav ? 'is-favorite' : ''}"
            onclick={toggleFavorite}
            aria-label="Favorite recipe"
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon fill={isFav ? 'var(--heart-color)' : 'none'} size={22} color={isFav ? 'var(--heart-color)' : 'var(--text-muted)'} />
          </button>
        {/if}
      </div>
    {/if}

    <IngredientsEditor
      ingredients={extras}
      onChange={handleIngredientsChange}
      title="Ingredients & Sides"
      emptyLabel="No ingredients or sides added yet."
    />
  </div>
</Modal>

<style>
  .details-modal-header {
    gap: 0.5rem;
  }
  .details-modal-header h3 {
    margin: 0;
  }
  .details-section-title {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: var(--text-title);
  }
  .title-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    background-color: var(--card-bg);
    color: var(--text-body);
    margin-bottom: 1rem;
  }
  .details-inline-row {
    display: flex;
    align-items: flex-end;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .details-inline-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .details-inline-group .details-section-title {
    margin-bottom: 0;
  }
  .portions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
</style>

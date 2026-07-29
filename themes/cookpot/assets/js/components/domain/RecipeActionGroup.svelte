<script lang="ts">
  import FavoriteButton from './FavoriteButton.svelte';
  import Button from '../primitives/Button.svelte';
  import CalendarIcon from '../primitives/icons/CalendarIcon.svelte';

  interface Props {
    /** Unique recipe identifier or path slug. */
    recipeId: string;
    /** Human-readable title of recipe for accessibility. */
    recipeTitle: string;
    /** Whether to display the meal planner schedule toggle action. */
    showPlannerAction?: boolean;
    /** Whether the recipe is currently scheduled in the meal plan. */
    isInPlanner?: boolean;
    /** Callback triggered when user toggles the meal planner action button. */
    onTogglePlanner?: () => void;
    /** Additional CSS class names. */
    class?: string;
  }

  let {
    recipeId,
    recipeTitle,
    showPlannerAction = true,
    isInPlanner = false,
    onTogglePlanner,
    class: className = ''
  }: Props = $props();
</script>

<div class="recipe-action-group {className}">
  <FavoriteButton shortId={recipeId} />

  {#if showPlannerAction}
    <Button
      class="btn-action-planner {isInPlanner ? 'active' : ''}"
      title={isInPlanner ? `Remove ${recipeTitle} from meal plan` : `Add ${recipeTitle} to meal plan`}
      onclick={() => onTogglePlanner?.()}
    >
      <CalendarIcon size={18} />
    </Button>
  {/if}
</div>

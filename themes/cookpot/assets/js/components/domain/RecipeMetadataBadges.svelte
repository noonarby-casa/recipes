<script lang="ts">
  import BadgeGroup from '../primitives/BadgeGroup.svelte';
  import Badge from '../primitives/Badge.svelte';
  import ClockIcon from '../primitives/icons/ClockIcon.svelte';
  import { formatAbbreviatedTime } from '../../units';

  interface Props {
    /** Preparation time in minutes. */
    prepTime?: number;
    /** Cooking time in minutes. */
    cookTime?: number;
    /** List of dietary tag strings (e.g., 'vegetarian', 'vegan', 'gluten-free'). */
    dietaryTags?: string[];
    /** Course or meal category tag (e.g., 'Dinner', 'Dessert'). */
    course?: string;
    /** Additional CSS class names. */
    class?: string;
  }

  let {
    prepTime,
    cookTime,
    dietaryTags = [],
    course,
    class: className = ''
  }: Props = $props();

  let totalTime = $derived((prepTime || 0) + (cookTime || 0));
</script>

<BadgeGroup class="recipe-metadata-badges {className}">
  {#if totalTime > 0}
    <Badge variant="default" class="badge-time">
      <ClockIcon size={14} class="badge-icon-svg" />
      <span>{formatAbbreviatedTime(`${totalTime}m`)}</span>
    </Badge>
  {/if}

  {#if course}
    <Badge variant="primary" class="badge-course">
      {course}
    </Badge>
  {/if}

  {#each dietaryTags as tag (tag)}
    <Badge variant="dietary" class="badge-dietary-{tag.toLowerCase().replace(/\s+/g, '-')}">
      {tag}
    </Badge>
  {/each}
</BadgeGroup>

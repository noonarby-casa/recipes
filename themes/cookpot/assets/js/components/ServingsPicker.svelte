<script lang="ts">
  interface Props {
    /** The current number of servings selected. */
    value?: number;
    /** The minimum allowable value for the servings picker (defaults to 1). */
    min?: number;
    /** The maximum allowable value for the servings picker (defaults to 99). */
    max?: number;
    /** Callback function triggered when the servings value changes. */
    onChange: (servings: number) => void;
  }

  let { value = 4, min = 1, max = 99, onChange }: Props = $props();

  function dec() {
    if (value > min) {
      onChange(value - 1);
    }
  }

  function inc() {
    if (value < max) {
      onChange(value + 1);
    }
  }
</script>

<div class="servings-picker">
  <button type="button" class="servings-btn dec-btn" onclick={dec} aria-label="Decrease servings">-</button>
  <span class="servings-val">{value}</span>
  <button type="button" class="servings-btn inc-btn" onclick={inc} aria-label="Increase servings">+</button>
</div>

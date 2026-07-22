<script lang="ts">
  interface Props {
    /** The current number of portions/servings selected. */
    value: number;
    /** The minimum allowable value for the portion picker (defaults to 1). */
    min?: number;
    /** Callback function triggered when the portion value changes. */
    onChange: (value: number) => void;
  }

  let { value, min = 1, onChange }: Props = $props();

  function dec() {
    onChange(Math.max(min, value - 1));
  }

  function inc() {
    onChange(value + 1);
  }
</script>

<div class="portion-picker">
  <button type="button" class="portion-btn dec-btn" onclick={dec}>-</button>
  <span class="portion-val">{value}</span>
  <button type="button" class="portion-btn inc-btn" onclick={inc}>+</button>
</div>




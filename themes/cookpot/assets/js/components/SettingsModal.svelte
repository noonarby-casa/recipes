<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import ToggleGroup, { type Option } from './ToggleGroup.svelte';
  import {
    getThemePreference,
    setThemePreference,
    type ThemeOption,
  } from '../darkmode';
  import { fontSizeStore, timerMutedStore } from '../stores/settings';
  import {
    STORE_LAYOUTS,
    getActiveStoreLayoutId,
    setActiveStoreLayoutId,
  } from '../shopping-list/store-sections';
  import type { FontSizeOption } from '../types';

  let isOpen = $state(false);

  let theme = $state<ThemeOption>('system');
  let fontSize = $state<FontSizeOption>('default');
  let timerMuted = $state<boolean>(false);
  let activeStoreId = $state<string>('standard');

  const themeOptions: Option[] = [
    { id: 'light', label: '☀️ Light' },
    { id: 'dark', label: '🌙 Dark' },
    { id: 'system', label: '🖥️ System' },
  ];

  const fontSizeOptions: Option[] = [
    { id: 'smaller', label: 'A- Smaller' },
    { id: 'default', label: 'A Default' },
    { id: 'larger', label: 'A+ Larger' },
  ];

  const timerSoundOptions: Option[] = [
    { id: 'sound', label: '🔔 Sound On' },
    { id: 'muted', label: '🔇 Muted' },
  ];

  let storeLayoutOptions = $derived<Option[]>(
    STORE_LAYOUTS.map((layout) => ({
      id: layout.id,
      label: layout.name,
      description: layout.sections.map((s) => s.name).join(' → '),
    }))
  );

  function handleThemeChange(id: string) {
    theme = id as ThemeOption;
    setThemePreference(theme);
  }

  function handleFontSizeChange(id: string) {
    fontSize = id as FontSizeOption;
    fontSizeStore.set(fontSize);
  }

  function handleTimerSoundChange(id: string) {
    timerMuted = id === 'muted';
    timerMutedStore.set(timerMuted);
  }

  function handleStoreLayoutChange(id: string) {
    activeStoreId = id;
    setActiveStoreLayoutId(id);
    document.dispatchEvent(
      new CustomEvent('store-layout:change', { detail: { layoutId: id } })
    );
  }

  function close() {
    isOpen = false;
  }

  onMount(() => {
    theme = getThemePreference();
    activeStoreId = getActiveStoreLayoutId();

    const unsubFont = fontSizeStore.subscribe((val) => {
      fontSize = val;
    });

    const unsubMuted = timerMutedStore.subscribe((val) => {
      timerMuted = val;
    });

    const btn = document.getElementById('header-settings-btn');
    const handleOpen = (e: Event) => {
      e.preventDefault();
      theme = getThemePreference();
      activeStoreId = getActiveStoreLayoutId();
      isOpen = true;
    };
    btn?.addEventListener('click', handleOpen);

    return () => {
      btn?.removeEventListener('click', handleOpen);
      unsubFont();
      unsubMuted();
    };
  });
</script>

<Modal
  {isOpen}
  onClose={close}
  title="Settings"
  backdropClass="planner-modal-backdrop"
  contentClass="planner-modal-content settings-modal-content"
>
  <div class="settings-modal-body">
    <section class="settings-group">
      <h4 class="settings-group-title">Appearance</h4>
      <div class="settings-row">
        <span class="settings-label">Theme</span>
        <ToggleGroup
          options={themeOptions}
          selectedId={theme}
          onChange={handleThemeChange}
        />
      </div>
      <div class="settings-row">
        <span class="settings-label">Recipe Text Size</span>
        <ToggleGroup
          options={fontSizeOptions}
          selectedId={fontSize}
          onChange={handleFontSizeChange}
        />
      </div>
    </section>

    <hr class="settings-divider" />

    <section class="settings-group">
      <h4 class="settings-group-title">Cooking & Shopping</h4>
      <div class="settings-row">
        <span class="settings-label">Timer Sound Alerts</span>
        <ToggleGroup
          options={timerSoundOptions}
          selectedId={timerMuted ? 'muted' : 'sound'}
          onChange={handleTimerSoundChange}
        />
      </div>
      <div class="settings-column">
        <div class="settings-label-wrapper">
          <span class="settings-label">Store Layout</span>
          <span class="settings-description">
            Reorder shopping list items to match your supermarket route.
          </span>
        </div>
        <ToggleGroup
          options={storeLayoutOptions}
          selectedId={activeStoreId}
          onChange={handleStoreLayoutChange}
          orientation="vertical"
          fullWidth={true}
        />
      </div>
    </section>
  </div>
</Modal>

<style>
  .settings-modal-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem 1.75rem 1.5rem;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .settings-group-title {
    color: var(--text-title);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin: 0;
    text-transform: uppercase;
  }

  .settings-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
  }

  .settings-column {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .settings-label-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .settings-label {
    color: var(--text-color);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .settings-description {
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 400;
  }

  .settings-divider {
    border: 0;
    border-top: 1px solid var(--border-subtle);
    margin: 0;
  }
</style>

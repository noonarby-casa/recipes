import { writable } from 'svelte/store';

const SETTINGS_KEY = 'noonarby-meal-plan-settings';

export interface SettingsState {
  activeTab: 'edit' | 'view' | 'shop';
  workWeekOnly: boolean;
}

function loadSettings(): SettingsState {
  let workWeekOnly = true;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.workWeekOnly !== undefined) {
          workWeekOnly = !!parsed.workWeekOnly;
        }
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
  return {
    activeTab: 'view',
    workWeekOnly,
  };
}

export const settingsStore = writable<SettingsState>(loadSettings());

settingsStore.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    try {
      const settings = {
        workWeekOnly: state.workWeekOnly,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
});

import { writable } from 'svelte/store';
import type { Recipe } from '../types';

export const recipesStore = writable<Recipe[]>([]);

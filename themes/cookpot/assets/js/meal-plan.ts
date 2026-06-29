import { parseIngredientText } from "./scaler";
import { processShoppingList } from "./shopping-list/pipeline";
import { formatCookingNumber } from "./units";
import { ShoppingItem } from "./shopping-list/types";
import { formatNotesArray } from "./shopping-list/utils";

// TS interfaces matching our data schema
interface RecipeTime {
  step: string;
  time: string;
}

interface Recipe {
  title: string;
  permalink: string;
  dateMachine: string;
  dateHuman: string;
  times?: RecipeTime[];
  recipeSource?: string;
  servings: number; // Linked to front matter servings
  tags?: string[];
  ingredients?: string[];
  summary: string;
  image?: string;
  image90?: string;
  image130?: string;
  image180?: string;
  image260?: string;
}

interface PlannedRecipe {
  instanceId: string;
  permalink: string;
  scale: number;
}

// Client State
let planState: PlannedRecipe[] = [];
let recipesIndex: Recipe[] = [];
const selectedTags: Set<string> = new Set();
let searchQuery = "";
const checkedIngredients: Set<string> = new Set();
let staplesExpanded = false;
let keyboardFocusedIndex = -1;

// Storage keys
const STORAGE_KEY = "noonarby-meal-plan";
const BACKUP_KEY = "noonarby-meal-plan-backup";

/**
 * Normalizes permalink to extract slug
 */
function getSlug(permalink: string): string {
  const parts = permalink.replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Resolves a slug back to a full permalink in our index
 */
function getPermalinkFromSlug(slug: string): string | null {
  for (const r of recipesIndex) {
    if (getSlug(r.permalink) === slug) {
      return r.permalink;
    }
  }
  return null;
}

/**
 * Gets base path of the site for navigation
 */
function getSiteBasePath(): string {
  const homeLink = document.querySelector("header h1 a");
  const basePath = homeLink ? homeLink.getAttribute("href") : "/";
  return basePath ? (basePath.endsWith("/") ? basePath : basePath + "/") : "/";
}

/**
 * Main initialization for the planner page
 */
export function initMealPlanner(): void {
  const container = document.getElementById("meal-planner");
  if (!container) return;

  // Add the layout class to the body to lock viewport on desktop
  document.body.classList.add("meal-planner-layout");

  // Fetch index.json search index immediately
  const basePath = getSiteBasePath();
  fetch(`${basePath}index.json`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load search index");
      return res.json();
    })
    .then((data: Recipe[]) => {
      recipesIndex = data;
      setupMealPlanner();
    })
    .catch((err) => {
      console.error("Meal planner loading error:", err);
    });
}

/**
 * Setup components once search index data is available
 */
function setupMealPlanner(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const recipesParam = urlParams.get("recipes");

  // Read LocalStorage plan
  let localPlan: PlannedRecipe[] = [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      localPlan = JSON.parse(stored);
    } catch (e) {
      console.error("Error reading LocalStorage plan:", e);
    }
  }

  if (recipesParam) {
    // Parse URL parameter recipes
    const urlPlan: PlannedRecipe[] = [];
    const entries = recipesParam.split(",");
    entries.forEach((entry, idx) => {
      const parts = entry.split(":");
      const slug = parts[0];
      const scale = parseFloat(parts[1] || "1");
      const permalink = getPermalinkFromSlug(slug);
      if (permalink) {
        urlPlan.push({
          instanceId: `rec_url_${idx}_${Date.now()}`,
          permalink,
          scale: isNaN(scale) ? 1.0 : scale,
        });
      }
    });

    // Check conflict: URL plan loaded, but user has a different active plan locally
    const urlSlugs = urlPlan
      .map((p) => `${getSlug(p.permalink)}:${p.scale}`)
      .join(",");
    const localSlugs = localPlan
      .map((p) => `${getSlug(p.permalink)}:${p.scale}`)
      .join(",");

    if (localPlan.length > 0 && urlSlugs !== localSlugs) {
      // Back up local plan and display conflict banner
      localStorage.setItem(BACKUP_KEY, JSON.stringify(localPlan));
      const banner = document.getElementById("plan-conflict-banner");
      if (banner) banner.style.display = "flex";
    }

    planState = urlPlan;
    saveStateToStorageAndUrl(false); // Update active state, keep address bar clean without immediately committing LS
  } else {
    // Fall back to LocalStorage
    planState = localPlan;
  }

  // Setup Event Listeners
  setupEventListeners();

  // Render Page
  renderUI();
}

/**
 * Saves planned recipes state to LocalStorage and URL query params
 */
function saveStateToStorageAndUrl(syncUrl = true): void {
  // Update LocalStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));

  // Update URL Query parameters
  if (syncUrl) {
    const urlParams = new URLSearchParams(window.location.search);
    if (planState.length > 0) {
      const recipesString = planState
        .map((item) => `${getSlug(item.permalink)}:${item.scale}`)
        .join(",");
      urlParams.set("recipes", recipesString);
    } else {
      urlParams.delete("recipes");
    }
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? "?" + urlParams.toString() : "");
    window.history.replaceState({}, "", newUrl);
  }
}

/**
 * Event listeners setups
 */
function setupEventListeners(): void {
  // Conflict banner listeners
  const btnMerge = document.getElementById("btn-banner-merge");
  const btnDiscard = document.getElementById("btn-banner-discard");
  const btnDismiss = document.getElementById("btn-banner-dismiss");
  const banner = document.getElementById("plan-conflict-banner");

  if (btnMerge) {
    btnMerge.addEventListener("click", () => {
      const backupStr = localStorage.getItem(BACKUP_KEY);
      if (backupStr) {
        try {
          const backupPlan: PlannedRecipe[] = JSON.parse(backupStr);
          // Combine: append backup items to plan
          planState = [...planState, ...backupPlan];
          saveStateToStorageAndUrl(true);
        } catch (e) {
          console.error("Error parsing backup plan:", e);
        }
      }
      localStorage.removeItem(BACKUP_KEY);
      if (banner) banner.style.display = "none";
      renderUI();
    });
  }

  if (btnDiscard) {
    btnDiscard.addEventListener("click", () => {
      const backupStr = localStorage.getItem(BACKUP_KEY);
      if (backupStr) {
        try {
          planState = JSON.parse(backupStr);
          saveStateToStorageAndUrl(true);
        } catch (e) {
          console.error("Error parsing backup plan:", e);
        }
      }
      localStorage.removeItem(BACKUP_KEY);
      if (banner) banner.style.display = "none";
      renderUI();
    });
  }

  if (btnDismiss || banner) {
    const dismissHandler = () => {
      localStorage.removeItem(BACKUP_KEY);
      if (banner) banner.style.display = "none";
      saveStateToStorageAndUrl(true); // Commit the URL parameter plan to LS
    };
    if (btnDismiss) btnDismiss.addEventListener("click", dismissHandler);
  }

  // Mobile Tabs Toggling
  const tabEdit = document.getElementById("tab-edit-plan");
  const tabShopping = document.getElementById("tab-shopping-list");
  const colPlanner = document.getElementById("col-planner");
  const colShopping = document.getElementById("col-shopping");

  if (tabEdit && tabShopping && colPlanner && colShopping) {
    tabEdit.addEventListener("click", () => {
      tabEdit.classList.add("active");
      tabShopping.classList.remove("active");
      colPlanner.style.display = "block";
      colShopping.style.display = "none";
    });

    tabShopping.addEventListener("click", () => {
      tabShopping.classList.add("active");
      tabEdit.classList.remove("active");
      colPlanner.style.display = "none";
      colShopping.style.display = "block";
    });
  }

  // Autocomplete Search input
  const searchInput = document.getElementById(
    "planner-search-input",
  ) as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      keyboardFocusedIndex = -1;
      updateFilterResults();
    });

    searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
      const shelf = document.getElementById("planner-browse-shelf");
      if (!shelf) return;
      const cards = shelf.querySelectorAll<HTMLElement>(".browse-card");
      if (cards.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        keyboardFocusedIndex++;
        if (keyboardFocusedIndex >= cards.length) keyboardFocusedIndex = 0;
        updateKeyboardFocusedCard(cards);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        keyboardFocusedIndex--;
        if (keyboardFocusedIndex < 0) keyboardFocusedIndex = cards.length - 1;
        updateKeyboardFocusedCard(cards);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (keyboardFocusedIndex >= 0 && keyboardFocusedIndex < cards.length) {
          const focusedCard = cards[keyboardFocusedIndex];
          const addBtn =
            focusedCard.querySelector<HTMLButtonElement>(".browse-add-btn");
          if (addBtn) addBtn.click();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        searchInput.value = "";
        searchQuery = "";
        keyboardFocusedIndex = -1;
        searchInput.blur();
        updateFilterResults();
      }
    });
  }

  // Add Random button next to search input
  const btnAddRandom = document.getElementById("btn-add-random");
  if (btnAddRandom) {
    btnAddRandom.addEventListener("click", () => {
      addRandomRecipeToPlan();
    });
  }

  // Toggle Filters button
  const btnToggleFilters = document.getElementById("btn-toggle-filters");
  const tagFilters = document.getElementById("planner-tag-filters");
  let filtersExpanded = false;

  if (btnToggleFilters && tagFilters) {
    btnToggleFilters.addEventListener("click", () => {
      filtersExpanded = !filtersExpanded;
      if (filtersExpanded) {
        btnToggleFilters.classList.add("active");
        tagFilters.classList.add("expanded");
      } else {
        btnToggleFilters.classList.remove("active");
        tagFilters.classList.remove("expanded");
      }
    });
  }

  // Clear Plan button
  const btnClear = document.getElementById("btn-clear-plan");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear your current meal plan?")) {
        planState = [];
        checkedIngredients.clear();
        saveStateToStorageAndUrl(true);
        renderUI();
      }
    });
  }

  // Share Plan button
  const btnShare = document.getElementById("btn-share-plan");
  if (btnShare) {
    btnShare.addEventListener("click", () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          const originalText = btnShare.textContent;
          btnShare.textContent = "Link Copied!";
          btnShare.classList.add("success");
          setTimeout(() => {
            btnShare.textContent = originalText;
            btnShare.classList.remove("success");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy link:", err);
        });
    });
  }

  // Copy shopping list button
  const btnCopyList = document.getElementById("btn-copy-combined-list");
  if (btnCopyList) {
    btnCopyList.addEventListener("click", () => {
      const omitChecked =
        (document.getElementById("chk-omit-completed") as HTMLInputElement)
          ?.checked || false;
      const text = generateCopyableListMarkdown(omitChecked);
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const originalHtml = btnCopyList.innerHTML;
          btnCopyList.classList.add("success");
          const span = btnCopyList.querySelector("span");
          if (span) span.textContent = "Copied!";
          setTimeout(() => {
            btnCopyList.classList.remove("success");
            btnCopyList.innerHTML = originalHtml;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy shopping list:", err);
        });
    });
  }

  // Reset checkboxes button
  const btnResetList = document.getElementById("btn-reset-shopping-list");
  if (btnResetList) {
    btnResetList.addEventListener("click", () => {
      checkedIngredients.clear();
      renderShoppingList();
    });
  }

  // Staples accordion header toggle
  const staplesHeader = document.getElementById("btn-toggle-staples");
  const staplesList = document.getElementById("combined-staples-list");
  if (staplesHeader && staplesList) {
    staplesHeader.addEventListener("click", () => {
      staplesExpanded = !staplesExpanded;
      if (staplesExpanded) {
        staplesHeader.classList.add("expanded");
        staplesList.style.display = "block";
      } else {
        staplesHeader.classList.remove("expanded");
        staplesList.style.display = "none";
      }
    });
  }
}

/**
 * Cycles keyboard highlighted class for accessibility cycling
 */
function updateKeyboardFocusedCard(cards: NodeListOf<HTMLElement>): void {
  cards.forEach((card, idx) => {
    if (idx === keyboardFocusedIndex) {
      card.classList.add("keyboard-focused");
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      card.classList.remove("keyboard-focused");
    }
  });
}

/**
 * Adds a random recipe to the meal plan from the index
 */
function addRandomRecipeToPlan(): void {
  if (recipesIndex.length === 0) return;

  // 1. Get recipes matching active tag filters
  let available = recipesIndex.filter((r) =>
    Array.from(selectedTags).every((tag) => r.tags && r.tags.includes(tag)),
  );

  // 2. Further filter by active search query text if present
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    available = available.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }

  // 3. Filter out recipes that are already in the plan to avoid duplicates, if possible
  const plannedPermalinks = new Set(planState.map((p) => p.permalink));
  let finalAvailable = available.filter(
    (r) => !plannedPermalinks.has(r.permalink),
  );
  if (finalAvailable.length === 0) {
    finalAvailable = available; // Fallback to all matching recipes if all are already planned
  }

  // 4. If nothing matches the filter criteria, fallback to the entire index
  if (finalAvailable.length === 0) {
    finalAvailable = recipesIndex.filter(
      (r) => !plannedPermalinks.has(r.permalink),
    );
    if (finalAvailable.length === 0) {
      finalAvailable = recipesIndex;
    }
  }

  const randomIdx = Math.floor(Math.random() * finalAvailable.length);
  const selected = finalAvailable[randomIdx];

  const instanceId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  planState.push({
    instanceId,
    permalink: selected.permalink,
    scale: 1.0, // Default to 1.0x servings scale
  });

  saveStateToStorageAndUrl(true);
  renderUI(instanceId); // Flash highlight the newly added recipe card
}

/**
 * Processes dynamic faceted counts and updates list suggestions
 */
function updateFilterResults(): void {
  const shelf = document.getElementById("planner-browse-shelf");
  const filtersContainer = document.getElementById("planner-tag-filters");
  if (!shelf || !filtersContainer) return;

  // Update active filters badge on the toggle button
  const filterBadge = document.getElementById("filter-active-count");
  if (filterBadge) {
    if (selectedTags.size > 0) {
      filterBadge.textContent = selectedTags.size.toString();
      filterBadge.style.display = "inline-flex";
    } else {
      filterBadge.style.display = "none";
    }
  }

  // 1. Filter recipes matching selected tags
  let filtered = recipesIndex.filter((r) =>
    Array.from(selectedTags).every((tag) => r.tags && r.tags.includes(tag)),
  );

  // 2. Filter by typed search text query if present
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }

  // 3. Compute tag counts on the tag-filtered subset (ignoring search queries so tags update counts for intersections)
  const tagCounts: Record<string, number> = {};
  const tagFilteredSubset = recipesIndex.filter((r) =>
    Array.from(selectedTags).every((tag) => r.tags && r.tags.includes(tag)),
  );

  tagFilteredSubset.forEach((r) => {
    if (r.tags) {
      r.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Render tag pills dynamically
  const uniqueTags = Array.from(
    new Set(recipesIndex.flatMap((r) => r.tags || [])),
  ).sort();

  filtersContainer.innerHTML = "";
  uniqueTags.forEach((tag) => {
    const count = tagCounts[tag] || 0;
    const isSelected = selectedTags.has(tag);

    // Only render if count > 0 OR it is currently selected (so the user can deselect it)
    if (count > 0 || isSelected) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `tag-pill${isSelected ? " active" : ""}`;
      pill.dataset.tag = tag;
      pill.innerHTML = `${tag} <span class="tag-count">(${count})</span>`;
      pill.addEventListener("click", () => {
        if (isSelected) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
        keyboardFocusedIndex = -1;
        updateFilterResults();
      });
      filtersContainer.appendChild(pill);
    }
  });

  // Render browse shelf results
  shelf.innerHTML = "";
  if (filtered.length === 0) {
    shelf.innerHTML =
      '<div style="font-size:0.85rem;color:var(--text-muted);padding:0.5rem 0;">No matching recipes.</div>';
  } else {
    // Show only first 6 matches to avoid long lists
    filtered.slice(0, 8).forEach((recipe) => {
      const isAlreadyPlanned = planState.some(
        (p) => p.permalink === recipe.permalink,
      );
      const card = document.createElement("div");
      card.className = `browse-card${isAlreadyPlanned ? " planned" : ""}`;

      const info = document.createElement("div");
      info.className = "browse-info";

      const img = document.createElement("img");
      img.className = "browse-img";
      img.src = recipe.image90 || recipe.image130 || "";
      img.alt = "";

      const textWrapper = document.createElement("div");
      textWrapper.className = "browse-title-wrapper";

      const title = document.createElement("h4");
      title.className = "browse-title";
      title.textContent = recipe.title;
      textWrapper.appendChild(title);

      if (isAlreadyPlanned) {
        const badge = document.createElement("span");
        badge.className = "browse-badge";
        badge.textContent = "✓ Planned";
        textWrapper.appendChild(badge);
      }

      info.appendChild(img);
      info.appendChild(textWrapper);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "browse-add-btn";
      addBtn.setAttribute("aria-label", `Add ${recipe.title} to meal plan`);
      addBtn.textContent = "+";

      card.addEventListener("click", () => {
        const instanceId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        planState.push({
          instanceId,
          permalink: recipe.permalink,
          scale: 1.0,
        });
        saveStateToStorageAndUrl(true);
        renderUI(instanceId);
      });

      card.appendChild(info);
      card.appendChild(addBtn);
      shelf.appendChild(card);
    });
  }
}

/**
 * Full UI Rendering loop
 * @param highlightInstanceId Optional instanceId to flash animate a newly inserted card
 */
function renderUI(highlightInstanceId?: string): void {
  const planList = document.getElementById("planned-recipes-list");
  const timeSummary = document.getElementById("planner-time-summary");
  const btnShare = document.getElementById("btn-share-plan");
  const btnClear = document.getElementById("btn-clear-plan");
  const mobileCount = document.getElementById("mobile-plan-count");

  if (!planList) return;

  // Toggle header actions and counts
  if (planState.length === 0) {
    if (btnShare) btnShare.style.display = "none";
    if (btnClear) btnClear.style.display = "none";
    updateTimesSummary(timeSummary);
    if (mobileCount) mobileCount.textContent = "";

    // Render Empty State
    planList.innerHTML = `
      <div class="planner-empty-state">
        <h3>Your meal plan is empty</h3>
        <p>Search recipes or select tag filters below to add meals to your weekly planner, or click the shuffle icon in the header!</p>
      </div>
    `;

    renderShoppingList();
    updateFilterResults();
    return;
  }

  // Show header actions
  if (btnShare) btnShare.style.display = "inline-flex";
  if (btnClear) btnClear.style.display = "inline-flex";
  if (mobileCount) mobileCount.textContent = `(${planState.length})`;

  // Render times summary
  updateTimesSummary(timeSummary);

  // Render plan cards list
  planList.innerHTML = "";
  planState.forEach((item, idx) => {
    const recipe = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!recipe) return;

    const currentPortions = Math.round(item.scale * recipe.servings);

    const li = document.createElement("li");
    li.className = "planned-recipe-item";
    li.dataset.instanceId = item.instanceId;
    if (item.instanceId === highlightInstanceId) {
      li.classList.add("new-addition");
    }

    // Enable native HTML5 Drag and Drop reordering
    li.draggable = true;
    li.dataset.index = idx.toString();

    li.addEventListener("dragstart", (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", idx.toString());
        e.dataTransfer.effectAllowed = "move";
      }
      li.classList.add("dragging");
      planList.classList.add("dragging-active");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      planList.classList.remove("dragging-active");
      const allItems = planList.querySelectorAll(".planned-recipe-item");
      allItems.forEach((el) => el.classList.remove("drag-over"));
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    });

    li.addEventListener("dragenter", () => {
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");

      if (e.dataTransfer) {
        const dragIdxStr = e.dataTransfer.getData("text/plain");
        if (dragIdxStr !== "") {
          const dragIdx = parseInt(dragIdxStr, 10);
          const dropIdx = idx;

          if (dragIdx !== dropIdx && !isNaN(dragIdx)) {
            const draggedItem = planState[dragIdx];
            planState.splice(dragIdx, 1);
            planState.splice(dropIdx, 0, draggedItem);
            saveStateToStorageAndUrl(true);
            renderUI();
          }
        }
      }
    });

    // Drag handle cue
    const handle = document.createElement("div");
    handle.className = "recipe-drag-handle";
    handle.innerHTML = "⠿";
    li.appendChild(handle);

    // Image
    const img = document.createElement("img");
    img.className = "recipe-card-img";
    img.src = recipe.image130 || recipe.image90 || "";
    img.alt = "";
    li.appendChild(img);

    // Details
    const details = document.createElement("div");
    details.className = "recipe-card-details";

    const title = document.createElement("h4");
    title.className = "recipe-card-title";
    const titleLink = document.createElement("a");
    titleLink.href = recipe.permalink;
    titleLink.textContent = recipe.title;
    title.appendChild(titleLink);
    details.appendChild(title);

    // Controls
    const controls = document.createElement("div");
    controls.className = "recipe-card-controls";

    // Portion picker
    const picker = document.createElement("div");
    picker.className = "portion-picker";

    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "portion-btn";
    decBtn.textContent = "-";
    decBtn.addEventListener("click", () => {
      const newPortions = Math.max(1, currentPortions - 1);
      item.scale = newPortions / recipe.servings;
      saveStateToStorageAndUrl(true);
      renderUI();
    });

    const portionVal = document.createElement("span");
    portionVal.className = "portion-val";
    portionVal.textContent = `${currentPortions} serving${currentPortions === 1 ? "" : "s"}`;

    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "portion-btn";
    incBtn.textContent = "+";
    incBtn.addEventListener("click", () => {
      const newPortions = currentPortions + 1;
      item.scale = newPortions / recipe.servings;
      saveStateToStorageAndUrl(true);
      renderUI();
    });

    picker.appendChild(decBtn);
    picker.appendChild(portionVal);
    picker.appendChild(incBtn);
    controls.appendChild(picker);

    // Portion Reset button (if scale !== 1.0)
    if (Math.abs(item.scale - 1.0) > 0.01) {
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "portion-reset-btn";
      resetBtn.title = `Reset to default servings (${recipe.servings})`;
      resetBtn.innerHTML = "↺";
      resetBtn.addEventListener("click", () => {
        item.scale = 1.0;
        saveStateToStorageAndUrl(true);
        renderUI();
      });
      controls.appendChild(resetBtn);
    }

    details.appendChild(controls);
    li.appendChild(details);

    // Order swap buttons
    const orderBtns = document.createElement("div");
    orderBtns.className = "recipe-order-btns";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "order-btn";
    upBtn.disabled = idx === 0;
    upBtn.innerHTML = "▲";
    upBtn.title = "Move Up";
    upBtn.addEventListener("click", () => {
      planState[idx] = planState[idx - 1];
      planState[idx - 1] = item;
      saveStateToStorageAndUrl(true);
      renderUI();
    });

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "order-btn";
    downBtn.disabled = idx === planState.length - 1;
    downBtn.innerHTML = "▼";
    downBtn.title = "Move Down";
    downBtn.addEventListener("click", () => {
      planState[idx] = planState[idx + 1];
      planState[idx + 1] = item;
      saveStateToStorageAndUrl(true);
      renderUI();
    });

    orderBtns.appendChild(upBtn);
    orderBtns.appendChild(downBtn);
    li.appendChild(orderBtns);

    // Trash remove button
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "recipe-remove-btn";
    removeBtn.title = "Remove recipe";
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    removeBtn.addEventListener("click", () => {
      planState = planState.filter((p) => p.instanceId !== item.instanceId);
      saveStateToStorageAndUrl(true);
      renderUI();
    });
    li.appendChild(removeBtn);

    planList.appendChild(li);
  });

  renderShoppingList();
  updateFilterResults();
}

/**
 * Calculates sum of prep and cook times across plan state
 */
function updateTimesSummary(element: HTMLElement | null): void {
  if (!element) return;
  element.innerHTML = "";

  let totalPrepMinutes = 0;
  let totalCookMinutes = 0;

  planState.forEach((item) => {
    const recipe = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!recipe || !recipe.times) return;

    recipe.times.forEach((t) => {
      const match = t.time.match(/(\d+(?:\.\d+)?)\s*(hr|hrs|h|min|mins|m)/i);
      if (match) {
        let val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith("h")) val *= 60; // Convert hours to minutes
        if (t.step === "prep") totalPrepMinutes += val;
        if (t.step === "cook") totalCookMinutes += val;
      }
    });
  });

  const formatHoursMins = (mins: number): string => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return remainder > 0 ? `${hrs}h ${remainder}m` : `${hrs}h`;
  };

  element.style.display = "block";
  let summaryText = "Combined prep & cook times: ";
  summaryText += `<strong>${formatHoursMins(totalPrepMinutes)} Prep</strong>`;
  summaryText += " + ";
  summaryText += `<strong>${formatHoursMins(totalCookMinutes)} Cook</strong>`;

  element.innerHTML = summaryText;
}

/**
 * Renders the aggregated combined shopping list
 */
function renderShoppingList(): void {
  const buyList = document.getElementById("combined-buy-list");
  const staplesList = document.getElementById("combined-staples-list");
  const divider = document.querySelector<HTMLElement>(".shopping-divider");
  const wrapper = document.querySelector<HTMLElement>(".shopping-list-wrapper");
  const actions = document.querySelector<HTMLElement>(
    ".shopping-actions-wrapper",
  );

  if (!buyList || !staplesList) return;

  if (planState.length === 0) {
    if (wrapper) wrapper.style.display = "none";
    if (actions) actions.style.display = "none";
    const ingredientsColumn = document.getElementById("col-shopping");
    if (ingredientsColumn) {
      // Clean previous elements and show empty state
      buyList.innerHTML = "";
      staplesList.innerHTML = "";
      const existingEmpty = ingredientsColumn.querySelector(
        ".shopping-empty-state",
      );
      if (!existingEmpty) {
        ingredientsColumn.insertAdjacentHTML(
          "beforeend",
          `
          <div class="shopping-empty-state">
            <h3>No shopping list generated</h3>
            <p>Your shopping list will automatically compile once you add recipes to your meal plan.</p>
          </div>
          `,
        );
      }
    }
    return;
  }

  // Remove empty state if present
  const emptyState = document.querySelector(".shopping-empty-state");
  if (emptyState) emptyState.remove();

  if (wrapper) wrapper.style.display = "block";
  if (actions) actions.style.display = "flex";

  // Build Mock DOM Elements representing scaled ingredients
  const mockElements: HTMLElement[] = [];

  planState.forEach((item) => {
    const recipe = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!recipe || !recipe.ingredients) return;

    recipe.ingredients.forEach((ingStr) => {
      const parsed = parseIngredientText(ingStr);
      const el = document.createElement("div");
      el.textContent = ingStr;

      if (parsed.quantity !== null) {
        // Multiply by the recipe's individual servings scale factor
        const scaledQty = parsed.quantity * item.scale;
        el.dataset.baseQty = scaledQty.toString();
        el.dataset.unit = parsed.unit;
        el.dataset.rest = parsed.rest;
      }
      mockElements.push(el);
    });
  });

  // Call the existing shopping list processing pipeline
  // Scale parameter = 1.0, since we pre-scaled in element datasets
  const { buyItems, stapleItems } = processShoppingList(1.0, mockElements);

  buyList.innerHTML = "";
  staplesList.innerHTML = "";

  const renderItemCard = (item: ShoppingItem, container: HTMLElement): void => {
    const key = `${item.isStaple}_${item.unit}_${item.rest}`.toLowerCase();
    const isChecked = checkedIngredients.has(key);

    const qtyStr =
      item.qty !== null
        ? `${formatCookingNumber(item.qty)}${item.unit ? " " + item.unit : ""}`
        : "";

    const noteText =
      item.note && item.note.length > 0
        ? formatNotesArray(item.note, !item.isStaple)
        : "";

    const li = document.createElement("li");
    li.className = `shopping-item${isChecked ? " checked" : ""}`;

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "shopping-item-checkbox";
    chk.checked = isChecked;
    chk.addEventListener("change", () => {
      if (chk.checked) {
        checkedIngredients.add(key);
        li.classList.add("checked");
      } else {
        checkedIngredients.delete(key);
        li.classList.remove("checked");
      }
    });

    const contentDiv = document.createElement("div");
    contentDiv.className = "shopping-item-content";

    const mainRow = document.createElement("div");
    mainRow.className = "shopping-item-main-row";
    mainRow.textContent = `${qtyStr ? qtyStr + " " : ""}${item.rest}`;
    contentDiv.appendChild(mainRow);

    if (noteText) {
      const details = document.createElement("div");
      details.className = "shopping-item-details";
      const note = document.createElement("span");
      note.className = "shopping-item-note";
      note.textContent = noteText;
      details.appendChild(note);
      contentDiv.appendChild(details);
    }

    li.appendChild(chk);
    li.appendChild(contentDiv);
    container.appendChild(li);
  };

  buyItems.forEach((item) => renderItemCard(item, buyList));
  stapleItems.forEach((item) => renderItemCard(item, staplesList));

  // Handle dividers and section visibility
  const hasBuy = buyItems.length > 0;
  const hasStaples = stapleItems.length > 0;

  const buySection = document.querySelector(
    ".buy-section",
  ) as HTMLElement | null;
  if (buySection) buySection.style.display = hasBuy ? "block" : "none";

  const staplesSection = document.querySelector(
    ".staples-section",
  ) as HTMLElement | null;
  if (staplesSection)
    staplesSection.style.display = hasStaples ? "block" : "none";

  if (divider) {
    (divider as HTMLElement).style.display =
      hasBuy && hasStaples ? "block" : "none";
  }
}

/**
 * Builds copyable Markdown checklist payload
 */
function generateCopyableListMarkdown(omitChecked: boolean): string {
  // Re-run mock calculations to grab raw arrays
  const mockElements: HTMLElement[] = [];
  planState.forEach((item) => {
    const recipe = recipesIndex.find((r) => r.permalink === item.permalink);
    if (!recipe || !recipe.ingredients) return;
    recipe.ingredients.forEach((ingStr) => {
      const parsed = parseIngredientText(ingStr);
      const el = document.createElement("div");
      el.textContent = ingStr;
      if (parsed.quantity !== null) {
        const scaledQty = parsed.quantity * item.scale;
        el.dataset.baseQty = scaledQty.toString();
        el.dataset.unit = parsed.unit;
        el.dataset.rest = parsed.rest;
      }
      mockElements.push(el);
    });
  });

  const { buyItems, stapleItems } = processShoppingList(1.0, mockElements);

  let text = "COMBINED SHOPPING LIST\n\n";

  const buildSectionString = (title: string, items: ShoppingItem[]): string => {
    let sectionText = `### ${title}\n`;
    let addedAny = false;

    items.forEach((item) => {
      const key = `${item.isStaple}_${item.unit}_${item.rest}`.toLowerCase();
      const isChecked = checkedIngredients.has(key);

      if (omitChecked && isChecked) return;

      const qtyStr =
        item.qty !== null
          ? `${formatCookingNumber(item.qty)}${item.unit ? " " + item.unit : ""}`
          : "";
      const noteText =
        item.note && item.note.length > 0
          ? ` (${formatNotesArray(item.note, !item.isStaple)})`
          : "";

      const box = isChecked ? "[x]" : "[ ]";
      sectionText += `- ${box} ${qtyStr ? qtyStr + " " : ""}${item.rest}${noteText}\n`;
      addedAny = true;
    });

    return addedAny ? sectionText + "\n" : "";
  };

  text += buildSectionString("Need to Buy", buyItems);
  text += buildSectionString("Pantry Staples", stapleItems);

  return text.trim();
}

/**
 * Registers "Add to Meal Plan" button triggers on single recipe views
 */
export function initRecipePageAddToPlan(): void {
  const addBtn = document.getElementById("btn-add-to-plan");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const title =
      document.querySelector(".recipe-title-bar h1")?.textContent || "Recipe";
    const currentPath = window.location.pathname;

    // Grab current serving scale factor from slider
    const slider = document.getElementById(
      "recipe-scale-slider",
    ) as HTMLInputElement | null;
    const currentScale = slider ? parseFloat(slider.value) : 1.0;

    // Load active plan from LS
    let activePlan: PlannedRecipe[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        activePlan = JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored plan:", e);
      }
    }

    // Count duplicates
    const duplicateCount = activePlan.filter(
      (p) => p.permalink === currentPath,
    ).length;

    // Add to plan
    activePlan.push({
      instanceId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      permalink: currentPath,
      scale: currentScale,
    });

    // Save plan
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activePlan));

    // Render Toast Notification
    const toastContainer = getOrCreateToastContainer();
    const toast = document.createElement("div");
    toast.className = "plan-toast-notification";

    // Text content depending on count
    const alertMessage =
      duplicateCount > 0
        ? `Added another copy of <strong>${title}</strong> to your Meal Plan! (Total: ${duplicateCount + 1})`
        : `Added <strong>${title}</strong> to your Meal Plan!`;

    const basePath = getSiteBasePath();
    toast.innerHTML = `
      <div class="toast-body">
        <span>${alertMessage}</span>
        <a href="${basePath}plan/" class="toast-link">View Plan</a>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Dismiss toast">✕</button>
    `;

    // Toast styles injected inline
    toast.style.cssText = `
      background-color: var(--card-bg);
      border: 1.5px solid var(--noonblue-border-light);
      border-left: 5px solid var(--noonblue);
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      margin-top: 0.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
      transform: translateY(20px);
      pointer-events: auto;
    `;

    const closeBtn = toast.querySelector(
      ".toast-close-btn",
    ) as HTMLButtonElement;
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    `;
    closeBtn.addEventListener("click", () => {
      dismissToast(toast);
    });

    // Inline style overrides for anchors
    const link = toast.querySelector(".toast-link") as HTMLAnchorElement;
    link.style.cssText = `
      color: var(--noonblue);
      font-weight: 700;
      text-decoration: none;
      margin-left: 0.5rem;
      border-bottom: 1.5px solid transparent;
      transition: all 0.2s ease;
    `;
    link.addEventListener("mouseenter", () => {
      link.style.borderBottomColor = "var(--noonblue)";
    });
    link.addEventListener("mouseleave", () => {
      link.style.borderBottomColor = "transparent";
    });

    toastContainer.appendChild(toast);

    // Trigger visual slide in
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 50);

    // Auto-dismiss in 4 seconds
    setTimeout(() => {
      dismissToast(toast);
    }, 4500);
  });
}

function getOrCreateToastContainer(): HTMLElement {
  let container = document.getElementById("plan-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "plan-toast-container";
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      pointer-events: none;
      max-width: 380px;
      width: calc(100% - 48px);
    `;
    document.body.appendChild(container);
  }
  return container;
}

function dismissToast(toast: HTMLElement): void {
  if (!toast.parentNode) return;
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-20px)";
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

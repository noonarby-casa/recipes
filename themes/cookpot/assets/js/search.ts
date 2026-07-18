import { PRIMARY_TAGS } from './constants';
import { isFavorite } from './favorites';

interface RecipeTime {
  step: string;
  time: string;
}

interface Recipe {
  title: string;
  permalink: string;
  shortId?: string;
  dateMachine: string;
  dateHuman: string;
  times?: RecipeTime[];
  recipeSource?: string;
  tags?: string[];
  ingredients?: { item: string }[];
  summary: string;
  image?: string;
  image90?: string;
  image130?: string;
  image180?: string;
  image260?: string;
}

export function initSearch(): void {
  const searchInput = document.getElementById(
    'recipe-search-input',
  ) as HTMLInputElement | null;
  const searchClear = document.getElementById('recipe-search-clear');
  const searchInfo = document.getElementById('search-results-info');
  const searchResults = document.getElementById('search-results');
  const defaultList = document.getElementById('recipe-list-default');
  const headerSearchToggle = document.getElementById('header-search-toggle');

  // Homepage-specific new elements
  const primaryTagsWrapper = document.getElementById('primary-tags-wrapper');
  const favoritesOnlyChip = document.getElementById(
    'favorites-only-chip',
  ) as HTMLButtonElement | null;
  let showFavoritesOnly = false;
  const btnMoreFilters = document.getElementById('btn-more-filters');
  const filtersModal = document.getElementById('search-filters-modal');
  const btnCloseFiltersModal = document.getElementById(
    'btn-close-search-filters-modal',
  );
  const btnClearFilters = document.getElementById('btn-search-clear-filters');
  const tagFiltersContainer = document.getElementById('search-tag-filters');
  const sourceFiltersContainer = document.getElementById(
    'search-source-filters',
  );

  let recipesData: Recipe[] | null = null;
  let isFetching = false;

  // Active filter state
  let searchQuery = '';
  const includedTags: Set<string> = new Set();
  const excludedTags: Set<string> = new Set();
  const includedSources: Set<string> = new Set();
  const excludedSources: Set<string> = new Set();

  // Infinite Scroll state for default view
  let lastAppendedIndex = 24;
  let scrollListenerAdded = false;

  // Lazily fetch search data
  async function ensureDataFetched(): Promise<void> {
    if (recipesData || isFetching) {
      return;
    }
    isFetching = true;

    try {
      const homeLink = document.querySelector('header h1 a');
      const basePath = homeLink ? homeLink.getAttribute('href') : '/';
      const cleanBasePath = basePath
        ? basePath.endsWith('/')
          ? basePath
          : basePath + '/'
        : '/';

      const response = await fetch(`${cleanBasePath}index.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe search index');
      }
      recipesData = await response.json();

      // Initialize filter UI components once data is loaded
      initFilterUI();
    } catch (err) {
      console.error('Error loading search index:', err);
    } finally {
      isFetching = false;
    }
  }

  function initFilterUI(): void {
    if (!recipesData) {
      return;
    }

    // Render primary tag chips
    buildPrimaryTagsRow();

    // Setup "+ More Filters" modal triggers
    if (btnMoreFilters && filtersModal) {
      btnMoreFilters.addEventListener('click', () => {
        buildModalTagCloud();
        buildModalSourceCloud();
        filtersModal.style.display = 'flex';
      });
    }

    if (btnCloseFiltersModal && filtersModal) {
      btnCloseFiltersModal.addEventListener('click', () => {
        filtersModal.style.display = 'none';
      });
    }

    // Close modal when clicking backdrop
    if (filtersModal) {
      filtersModal.addEventListener('click', (e) => {
        if (e.target === filtersModal) {
          filtersModal.style.display = 'none';
        }
      });
    }

    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', () => {
        clearAllFilters();
      });
    }

    // Set up infinite scroll for default list
    setupInfiniteScroll();
  }

  function buildPrimaryTagsRow(): void {
    if (!primaryTagsWrapper) {
      return;
    }
    primaryTagsWrapper.innerHTML = '';

    PRIMARY_TAGS.forEach((tag) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-filter-pill';
      btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);

      // Check current state
      if (includedTags.has(tag)) {
        btn.classList.add('include');
        btn.textContent = `✓ ${btn.textContent}`;
      } else if (excludedTags.has(tag)) {
        btn.classList.add('exclude');
        btn.textContent = `✕ ${btn.textContent}`;
      }

      btn.addEventListener('click', () => {
        if (includedTags.has(tag)) {
          includedTags.delete(tag);
          excludedTags.add(tag);
        } else if (excludedTags.has(tag)) {
          excludedTags.delete(tag);
        } else {
          includedTags.add(tag);
        }
        buildPrimaryTagsRow();
        performFilterAndSearch();
      });

      primaryTagsWrapper.appendChild(btn);
    });
  }

  function buildModalTagCloud(): void {
    if (!tagFiltersContainer || !recipesData) {
      return;
    }

    const matches = getFilteredRecipesList(true); // ignore tag count dependencies

    // Compute counts for all tags on the CURRENTLY matched subset
    const tallies: Record<string, number> = {};
    matches.forEach((r) => {
      if (r.tags) {
        r.tags.forEach((tag) => {
          tallies[tag] = (tallies[tag] || 0) + 1;
        });
      }
    });

    const uniqueTags = Array.from(
      new Set(recipesData.flatMap((r) => r.tags || [])),
    ).sort();

    tagFiltersContainer.innerHTML = '';
    uniqueTags.forEach((tag) => {
      const count = tallies[tag] || 0;
      const isIncluded = includedTags.has(tag);
      const isExcluded = excludedTags.has(tag);
      const isDimmed = count === 0 && !isIncluded && !isExcluded;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-filter-pill';

      if (isIncluded) {
        btn.classList.add('include');
        btn.innerHTML = `✓ ${tag} <span class="tag-count">${count}</span>`;
      } else if (isExcluded) {
        btn.classList.add('exclude');
        btn.innerHTML = `✕ ${tag} <span class="tag-count">${count}</span>`;
      } else {
        btn.innerHTML = `${tag} <span class="tag-count">${count}</span>`;
      }

      if (isDimmed) {
        btn.classList.add('dimmed');
        btn.setAttribute('disabled', 'true');
      } else {
        btn.addEventListener('click', () => {
          if (isIncluded) {
            includedTags.delete(tag);
            excludedTags.add(tag);
          } else if (isExcluded) {
            excludedTags.delete(tag);
          } else {
            includedTags.add(tag);
          }
          buildModalTagCloud();
          buildModalSourceCloud();
          buildPrimaryTagsRow();
          performFilterAndSearch();
        });
      }

      tagFiltersContainer.appendChild(btn);
    });
  }

  function buildModalSourceCloud(): void {
    if (!sourceFiltersContainer || !recipesData) {
      return;
    }

    const matches = getFilteredRecipesList(false); // get matches

    const tallies: Record<string, number> = {};
    matches.forEach((r) => {
      const src = r.recipeSource || 'Noonarby';
      tallies[src] = (tallies[src] || 0) + 1;
    });

    const uniqueSources = Array.from(
      new Set(recipesData.map((r) => r.recipeSource || 'Noonarby')),
    ).sort();

    sourceFiltersContainer.innerHTML = '';
    uniqueSources.forEach((src) => {
      const count = tallies[src] || 0;
      const isIncluded = includedSources.has(src);
      const isExcluded = excludedSources.has(src);
      const isDimmed = count === 0 && !isIncluded && !isExcluded;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-filter-pill';

      if (isIncluded) {
        btn.classList.add('include');
        btn.innerHTML = `✓ ${src} <span class="tag-count">${count}</span>`;
      } else if (isExcluded) {
        btn.classList.add('exclude');
        btn.innerHTML = `✕ ${src} <span class="tag-count">${count}</span>`;
      } else {
        btn.innerHTML = `${src} <span class="tag-count">${count}</span>`;
      }

      if (isDimmed) {
        btn.classList.add('dimmed');
        btn.setAttribute('disabled', 'true');
      } else {
        btn.addEventListener('click', () => {
          if (isIncluded) {
            includedSources.delete(src);
            excludedSources.add(src);
          } else if (isExcluded) {
            excludedSources.delete(src);
          } else {
            includedSources.add(src);
          }
          buildModalTagCloud();
          buildModalSourceCloud();
          performFilterAndSearch();
        });
      }

      sourceFiltersContainer.appendChild(btn);
    });
  }

  function clearAllFilters(): void {
    if (searchInput) {
      searchInput.value = '';
    }
    if (searchClear) {
      searchClear.style.display = 'none';
    }
    searchQuery = '';
    includedTags.clear();
    excludedTags.clear();
    includedSources.clear();
    excludedSources.clear();

    buildPrimaryTagsRow();
    buildModalTagCloud();
    buildModalSourceCloud();
    performFilterAndSearch();
  }

  function getFilteredRecipesList(ignoreTagDependencies = false): Recipe[] {
    if (!recipesData) {
      return [];
    }

    const queryTerms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    return recipesData.filter((recipe) => {
      // 1. Text Query Search
      if (queryTerms.length > 0) {
        const matchesQuery = queryTerms.every((term) => {
          const titleMatch = recipe.title.toLowerCase().includes(term);
          const tagMatch =
            recipe.tags &&
            recipe.tags.some((tag) => tag.toLowerCase().includes(term));
          const ingredientMatch =
            recipe.ingredients &&
            recipe.ingredients.some(
              (ing) => ing.item && ing.item.toLowerCase().includes(term),
            );
          const summaryMatch =
            recipe.summary && recipe.summary.toLowerCase().includes(term);
          const sourceMatch =
            recipe.recipeSource &&
            recipe.recipeSource.toLowerCase().includes(term);
          return (
            titleMatch ||
            !!tagMatch ||
            !!ingredientMatch ||
            !!summaryMatch ||
            !!sourceMatch
          );
        });
        if (!matchesQuery) {
          return false;
        }
      }

      // 2. Tag Filters (Included)
      if (!ignoreTagDependencies && includedTags.size > 0) {
        for (const tag of includedTags) {
          if (!recipe.tags || !recipe.tags.includes(tag)) {
            return false;
          }
        }
      }

      // 3. Tag Filters (Excluded)
      if (!ignoreTagDependencies && excludedTags.size > 0) {
        for (const tag of excludedTags) {
          if (recipe.tags && recipe.tags.includes(tag)) {
            return false;
          }
        }
      }

      // 4. Source Filters (Included)
      const recipeSrc = recipe.recipeSource || 'Noonarby';
      if (includedSources.size > 0 && !includedSources.has(recipeSrc)) {
        return false;
      }

      // 5. Source Filters (Excluded)
      if (excludedSources.size > 0 && excludedSources.has(recipeSrc)) {
        return false;
      }

      // 6. Favorites Filter
      if (showFavoritesOnly && recipe.shortId && !isFavorite(recipe.shortId)) {
        return false;
      }

      return true;
    });
  }

  function performFilterAndSearch(): void {
    const isFilterActive =
      searchQuery.length > 0 ||
      includedTags.size > 0 ||
      excludedTags.size > 0 ||
      includedSources.size > 0 ||
      excludedSources.size > 0 ||
      showFavoritesOnly;

    if (isFilterActive) {
      const matches = getFilteredRecipesList();
      renderResults(matches);
    } else {
      resetSearch();
    }
  }

  if (searchInput) {
    searchInput.addEventListener('focus', ensureDataFetched);
    searchInput.addEventListener('mouseenter', ensureDataFetched);

    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();

      if (searchQuery.length > 0) {
        if (searchClear) {
          searchClear.style.display = 'inline-flex';
        }
        performFilterAndSearch();
      } else {
        if (searchClear) {
          searchClear.style.display = 'none';
        }
        performFilterAndSearch();
      }
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.style.display = 'none';
        searchQuery = '';
        performFilterAndSearch();
      });
    }
  }

  if (favoritesOnlyChip) {
    favoritesOnlyChip.addEventListener('click', () => {
      ensureDataFetched().then(() => {
        showFavoritesOnly = !showFavoritesOnly;
        favoritesOnlyChip.classList.toggle('include', showFavoritesOnly);
        performFilterAndSearch();
      });
    });
  }

  document.addEventListener('favoritesChanged', (e: Event) => {
    const customEvent = e as CustomEvent<{
      shortId: string;
      isFavorite: boolean;
    }>;
    const { shortId, isFavorite: isFav } = customEvent.detail;

    // Update dynamically rendered search result list badges
    const badges = document.querySelectorAll(
      `.recipe-favorite-badge[data-short-id="${shortId}"]`,
    );
    badges.forEach((b) => {
      (b as HTMLElement).style.display = isFav ? 'flex' : 'none';
    });

    if (showFavoritesOnly) {
      performFilterAndSearch();
    }
  });

  if (headerSearchToggle) {
    headerSearchToggle.addEventListener('click', (e) => {
      if (searchInput) {
        e.preventDefault();
        ensureDataFetched();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    });
  }

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (searchInput) {
    const qParam = urlParams.get('q');
    const focusParam = urlParams.get('search');

    if (qParam || focusParam === 'focus') {
      ensureDataFetched().then(() => {
        if (qParam) {
          searchInput.value = qParam;
          searchQuery = qParam;
          if (searchClear) {
            searchClear.style.display = 'inline-flex';
          }
          performFilterAndSearch();
        }
        searchInput.focus();
      });
    }
  }

  function resetSearch(): void {
    if (searchResults) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
    }
    if (searchInfo) {
      searchInfo.style.display = 'none';
      searchInfo.innerHTML = '';
    }
    if (defaultList) {
      defaultList.style.display = 'block';
    }
  }

  function renderResults(results: Recipe[]): void {
    if (!searchResults) {
      return;
    }

    if (defaultList) {
      defaultList.style.display = 'none';
    }

    searchResults.style.display = 'grid'; // CSS Grid for cards
    searchResults.innerHTML = '';

    if (results.length === 0) {
      searchResults.style.display = 'block';
      searchResults.innerHTML = `
        <div class="search-no-results-text" style="text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.05rem;">
          No recipes found matching your filters.
        </div>
      `;
      if (searchInfo) {
        searchInfo.style.display = 'flex';
        searchInfo.innerHTML = `
          <span>0 recipes found</span>
          <a class="search-results-clear-link" id="search-clear-link">Clear filters</a>
        `;
        const clearLink = document.getElementById('search-clear-link');
        if (clearLink) {
          clearLink.addEventListener('click', () => {
            clearAllFilters();
          });
        }
      }
      return;
    }

    const template = document.getElementById(
      'recipe-search-item-template',
    ) as HTMLTemplateElement | null;

    if (!template) {
      console.error('Could not find recipe search item template');
      return;
    }

    results.forEach((recipe) => {
      const clone = template.content.cloneNode(true) as DocumentFragment;

      // Title and Link
      const titleLink = clone.querySelector<HTMLAnchorElement>('.recipe-link');
      if (titleLink) {
        titleLink.textContent = recipe.title;
        titleLink.href = recipe.permalink;
      }

      // Date
      const dateElement =
        clone.querySelector<HTMLTimeElement>('.recipe-list-date');
      if (dateElement) {
        dateElement.setAttribute('datetime', recipe.dateMachine);
        dateElement.textContent = recipe.dateHuman;
      }

      // Image
      if (recipe.image) {
        const imageContainer = clone.querySelector<HTMLElement>(
          '.recipe-list-image-container',
        );
        const img = clone.querySelector<HTMLImageElement>('.recipe-image');
        if (imageContainer && img) {
          imageContainer.style.display = 'block';
          img.src = recipe.image130 || '';
          img.srcset = `${recipe.image90} 90w, ${recipe.image130} 130w, ${recipe.image180} 180w, ${recipe.image260} 260w`;
          img.alt = recipe.title;
        }
      }

      // Favorites Badge overlay on image
      if (recipe.shortId) {
        const badge = clone.querySelector<HTMLElement>(
          '.recipe-favorite-badge',
        );
        if (badge) {
          badge.setAttribute('data-short-id', recipe.shortId);
          const isFav = isFavorite(recipe.shortId);
          badge.style.display = isFav ? 'flex' : 'none';
        }
      }

      // Times
      const timeContainer = clone.querySelector<HTMLElement>('.recipe-time');
      if (timeContainer) {
        if (recipe.times && recipe.times.length > 0) {
          const stepsText = recipe.times
            .map((t) => {
              const capitalizedStep =
                t.step.charAt(0).toUpperCase() + t.step.slice(1);
              return `${capitalizedStep} ${t.time}`;
            })
            .join(' + ');

          const timeText = timeContainer.querySelector('.time-text');
          if (timeText) {
            timeText.textContent = stepsText;
          }
        } else {
          timeContainer.style.display = 'none';
          const timeSeparator = timeContainer.previousElementSibling;
          if (
            timeSeparator &&
            timeSeparator.classList.contains('recipe-meta-separator')
          ) {
            (timeSeparator as HTMLElement).style.display = 'none';
          }
        }
      }

      // Source
      const sourceContainer =
        clone.querySelector<HTMLElement>('.recipe-source');
      if (sourceContainer) {
        const recipeSource = recipe.recipeSource || 'Noonarby';
        const sourceText = sourceContainer.querySelector('.source-text');
        if (sourceText) {
          sourceText.textContent = recipeSource;
        }
      }

      // Option B: Only matching primary tags as non-clickable labels
      const tagsContainer = clone.querySelector<HTMLElement>(
        '.recipe-tags-container',
      );
      if (tagsContainer) {
        const matchingPrimary = recipe.tags
          ? recipe.tags.filter((t) => PRIMARY_TAGS.includes(t.toLowerCase()))
          : [];

        if (matchingPrimary.length > 0) {
          tagsContainer.style.display = 'block';
          const tagsList = tagsContainer.querySelector('.recipe-tags-list');
          if (tagsList) {
            tagsList.innerHTML = '';
            matchingPrimary.forEach((tag) => {
              const li = document.createElement('li');
              const span = document.createElement('span');
              span.className = 'recipe-tag-label';
              span.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
              li.appendChild(span);
              tagsList.appendChild(li);
            });
          }
        } else {
          tagsContainer.style.display = 'none';
        }
      }

      searchResults.appendChild(clone);
    });

    if (searchInfo) {
      searchInfo.style.display = 'flex';
      searchInfo.innerHTML = `
        <span>Found ${results.length} recipe${results.length === 1 ? '' : 's'}</span>
        <a class="search-results-clear-link" id="search-clear-link">Clear filters</a>
      `;
      const clearLink = document.getElementById('search-clear-link');
      if (clearLink) {
        clearLink.addEventListener('click', () => {
          clearAllFilters();
        });
      }
    }
  }

  // Setup infinite scroll to append more recipes on default view (no query/filter active)
  function setupInfiniteScroll(): void {
    if (scrollListenerAdded || !recipesData) {
      return;
    }
    scrollListenerAdded = true;

    window.addEventListener('scroll', () => {
      // Ignore if search or tags are active
      const isFilterActive =
        searchQuery.length > 0 ||
        includedTags.size > 0 ||
        excludedTags.size > 0 ||
        includedSources.size > 0 ||
        excludedSources.size > 0;

      if (isFilterActive || !recipesData) {
        return;
      }

      // Check if user is near bottom of the page
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        appendNextDefaultChunk();
      }
    });
  }

  function appendNextDefaultChunk(): void {
    if (!recipesData || lastAppendedIndex >= recipesData.length) {
      return;
    }

    const defaultGrid = document.querySelector(
      '#recipe-list-default .recipe-grid',
    );
    if (!defaultGrid) {
      return;
    }

    const nextChunk = recipesData.slice(
      lastAppendedIndex,
      lastAppendedIndex + 24,
    );
    lastAppendedIndex += 24;

    nextChunk.forEach((recipe) => {
      // Build recipe element dynamically
      const article = document.createElement('article');
      article.className = 'recipe-list-item';

      let imageHtml = '';
      if (recipe.image) {
        imageHtml = `
          <div class="recipe-list-image-container">
            <div class="recipe-list-image">
              <img
                src="${recipe.image130 || ''}"
                srcset="${recipe.image90} 90w, ${recipe.image130} 130w, ${recipe.image180} 180w, ${recipe.image260} 260w"
                sizes="(max-width: 599px) 90px, 130px"
                width="130"
                height="130"
                alt="${recipe.title}"
                loading="lazy"
              />
            </div>
          </div>
        `;
      }

      let timesHtml = '';
      if (recipe.times && recipe.times.length > 0) {
        const stepsText = recipe.times
          .map((t) => {
            const capitalizedStep =
              t.step.charAt(0).toUpperCase() + t.step.slice(1);
            return `${capitalizedStep} ${t.time}`;
          })
          .join(' + ');

        timesHtml = `
          <span class="recipe-meta-separator">•</span>
          <div class="recipe-time">
            <svg
              class="time-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="time-text">${stepsText}</span>
          </div>
        `;
      }

      // Display-only primary tags
      const matchingPrimary = recipe.tags
        ? recipe.tags.filter((t) => PRIMARY_TAGS.includes(t.toLowerCase()))
        : [];
      let tagsHtml = '';
      if (matchingPrimary.length > 0) {
        const tagsLi = matchingPrimary
          .map(
            (tag) =>
              `<li><span class="recipe-tag-label">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span></li>`,
          )
          .join('');
        tagsHtml = `
          <div class="recipe-tags-container">
            <ul class="recipe-tags-list">
              ${tagsLi}
            </ul>
          </div>
        `;
      }

      article.innerHTML = `
        ${imageHtml}
        <div class="recipe-list-content">
          <h2 class="recipe-list-title">
            <a class="recipe-link" href="${recipe.permalink}">${recipe.title}</a>
          </h2>
          <div class="recipe-list-meta">
            <div class="recipe-list-meta-left">
              <time datetime="${recipe.dateMachine}" class="recipe-list-date">${recipe.dateHuman}</time>
              ${timesHtml}
              <span class="recipe-meta-separator">•</span>
              <div class="recipe-source">
                <svg
                  class="source-icon"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  stroke-width="2.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="source-text">${recipe.recipeSource || 'Noonarby'}</span>
              </div>
            </div>
            ${tagsHtml}
          </div>
        </div>
      `;

      defaultGrid.appendChild(article);
    });
  }
}

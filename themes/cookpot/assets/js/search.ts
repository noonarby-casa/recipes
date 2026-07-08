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
  tags?: string[];
  ingredients?: string[];
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

  let recipesData: Recipe[] | null = null;
  let isFetching = false;

  // Lazily fetch search data
  async function ensureDataFetched(): Promise<void> {
    if (recipesData || isFetching) {
      return;
    }
    isFetching = true;

    try {
      // Find basePath from home link if possible
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
    } catch (err) {
      console.error('Error loading search index:', err);
    } finally {
      isFetching = false;
    }
  }

  if (searchInput) {
    // Fetch data when input is focused or hovered to minimize latency
    searchInput.addEventListener('focus', ensureDataFetched);
    searchInput.addEventListener('mouseenter', ensureDataFetched);

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();

      if (query.length > 0) {
        if (searchClear) {
          searchClear.style.display = 'inline-flex';
        }
        performSearch(query);
      } else {
        if (searchClear) {
          searchClear.style.display = 'none';
        }
        resetSearch();
      }
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.style.display = 'none';
        resetSearch();
      });
    }
  }

  // Handle header search toggle
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

  // Check URL parameters for focus or query
  const urlParams = new URLSearchParams(window.location.search);
  if (searchInput) {
    const qParam = urlParams.get('q');
    const focusParam = urlParams.get('search');

    if (qParam || focusParam === 'focus') {
      ensureDataFetched().then(() => {
        if (qParam) {
          searchInput.value = qParam;
          if (searchClear) {
            searchClear.style.display = 'inline-flex';
          }
          performSearch(qParam);
        }
        searchInput.focus();
      });
    }
  }

  function performSearch(query: string): void {
    if (!recipesData) {
      // Data not loaded yet, wait and try again
      setTimeout(() => performSearch(query), 100);
      return;
    }

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    if (terms.length === 0) {
      resetSearch();
      return;
    }

    const matches = recipesData.filter((recipe) => {
      return terms.every((term) => {
        const titleMatch = recipe.title.toLowerCase().includes(term);
        const tagMatch =
          recipe.tags &&
          recipe.tags.some((tag) => tag.toLowerCase().includes(term));
        const ingredientMatch =
          recipe.ingredients &&
          recipe.ingredients.some((ing) => ing.toLowerCase().includes(term));
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
    });

    renderResults(matches, query);
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

  function renderResults(results: Recipe[], query: string): void {
    if (!searchResults) {
      return;
    }

    // Hide default list
    if (defaultList) {
      defaultList.style.display = 'none';
    }

    searchResults.style.display = 'flex';
    searchResults.innerHTML = '';

    // Find basePath from home link
    const homeLink = document.querySelector('header h1 a');
    const basePath = homeLink ? homeLink.getAttribute('href') : '/';
    const cleanBasePath = basePath
      ? basePath.endsWith('/')
        ? basePath
        : basePath + '/'
      : '/';

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <h3>No recipes found</h3>
          <p>We couldn't find anything matching "<strong>${escapeHtml(query)}</strong>". Try checking for spelling or using different keywords.</p>
        </div>
      `;
      if (searchInfo) {
        searchInfo.style.display = 'flex';
        searchInfo.innerHTML = `
          <span>0 recipes found</span>
          <a class="search-results-clear-link" id="search-clear-link">Clear search</a>
        `;
        const clearLink = document.getElementById('search-clear-link');
        if (clearLink) {
          clearLink.addEventListener('click', () => {
            if (searchInput) {
              searchInput.value = '';
              if (searchClear) {
                searchClear.style.display = 'none';
              }
            }
            resetSearch();
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

      // Tags
      const tagsContainer = clone.querySelector<HTMLElement>(
        '.recipe-tags-container',
      );
      if (tagsContainer) {
        if (recipe.tags && recipe.tags.length > 0) {
          tagsContainer.style.display = 'block';
          const tagsList = tagsContainer.querySelector('.recipe-tags-list');
          if (tagsList) {
            recipe.tags.forEach((tag) => {
              const li = document.createElement('li');
              const a = document.createElement('a');
              const slug = tag
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
              a.href = `${cleanBasePath}tags/${slug}/`;
              a.textContent = tag;
              li.appendChild(a);
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
        <a class="search-results-clear-link" id="search-clear-link">Clear search</a>
      `;
      const clearLink = document.getElementById('search-clear-link');
      if (clearLink) {
        clearLink.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            if (searchClear) {
              searchClear.style.display = 'none';
            }
          }
          resetSearch();
        });
      }
    }
  }

  function escapeHtml(str: string): string {
    if (!str) {
      return '';
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

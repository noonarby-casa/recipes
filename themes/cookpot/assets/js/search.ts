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
  const searchInput = document.getElementById('recipe-search-input') as HTMLInputElement | null;
  const searchClear = document.getElementById('recipe-search-clear');
  const searchInfo = document.getElementById('search-results-info');
  const searchResults = document.getElementById('search-results');
  const defaultList = document.getElementById('recipe-list-default');
  const headerSearchToggle = document.getElementById('header-search-toggle');

  let recipesData: Recipe[] | null = null;
  let isFetching = false;

  // Lazily fetch search data
  async function ensureDataFetched(): Promise<void> {
    if (recipesData || isFetching) return;
    isFetching = true;

    try {
      // Find basePath from home link if possible
      const homeLink = document.querySelector('header h1 a');
      const basePath = homeLink ? homeLink.getAttribute('href') : '/';
      const cleanBasePath = basePath ? (basePath.endsWith('/') ? basePath : basePath + '/') : '/';
      
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
        if (searchClear) searchClear.style.display = 'inline-flex';
        performSearch(query);
      } else {
        if (searchClear) searchClear.style.display = 'none';
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
          if (searchClear) searchClear.style.display = 'inline-flex';
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

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) {
      resetSearch();
      return;
    }

    const matches = recipesData.filter(recipe => {
      return terms.every(term => {
        const titleMatch = recipe.title.toLowerCase().includes(term);
        const tagMatch = recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(term));
        const ingredientMatch = recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(term));
        const summaryMatch = recipe.summary && recipe.summary.toLowerCase().includes(term);
        return titleMatch || !!tagMatch || !!ingredientMatch || !!summaryMatch;
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
    if (!searchResults) return;

    // Hide default list
    if (defaultList) {
      defaultList.style.display = 'none';
    }

    searchResults.style.display = 'flex';
    
    // Find basePath from home link
    const homeLink = document.querySelector('header h1 a');
    const basePath = homeLink ? homeLink.getAttribute('href') : '/';
    const cleanBasePath = basePath ? (basePath.endsWith('/') ? basePath : basePath + '/') : '/';

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
              if (searchClear) searchClear.style.display = 'none';
            }
            resetSearch();
          });
        }
      }
      return;
    }

    searchResults.innerHTML = results.map(recipe => {
      let imgHtml = '';
      if (recipe.image) {
        imgHtml = `
        <div class="recipe-list-image-container">
          <div class="recipe-list-image">
            <img src="${recipe.image130}"
                 srcset="${recipe.image90} 90w, ${recipe.image130} 130w, ${recipe.image180} 180w, ${recipe.image260} 260w"
                 sizes="(max-width: 599px) 90px, 130px"
                 width="130"
                 height="130"
                 alt="${escapeHtml(recipe.title)}"
                 loading="lazy">
          </div>
        </div>`;
      }

      let timesHtml = '';
      if (recipe.times && recipe.times.length > 0) {
        const stepsText = recipe.times.map(t => {
          const capitalizedStep = t.step.charAt(0).toUpperCase() + t.step.slice(1);
          return `${escapeHtml(capitalizedStep)} ${escapeHtml(t.time)}`;
        }).join(' + ');

        timesHtml = `
          <span class="recipe-meta-separator">•</span>
          <div class="recipe-time">
            <svg class="time-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${stepsText}</span>
          </div>`;
      }

      const recipeSource = recipe.recipeSource || 'Noonarby';
      const sourceHtml = `
        <span class="recipe-meta-separator">•</span>
        <div class="recipe-source">
          <svg class="source-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>${escapeHtml(recipeSource)}</span>
        </div>`;

      let tagsHtml = '';
      if (recipe.tags && recipe.tags.length > 0) {
        const tagsList = recipe.tags.map(tag => {
          const slug = tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
          return `<li><a href="${cleanBasePath}tags/${slug}/">${escapeHtml(tag)}</a></li>`;
        }).join('');
        tagsHtml = `
          <div>
            <div>Tags:</div>
            <ul>
              ${tagsList}
            </ul>
          </div>`;
      }

      return `
        <article class="recipe-list-item">
          ${imgHtml}
          <div class="recipe-list-content">
            <h2 class="recipe-list-title"><a href="${recipe.permalink}">${escapeHtml(recipe.title)}</a></h2>
            <div class="recipe-list-meta">
              <div class="recipe-list-meta-left">
                <time datetime="${recipe.dateMachine}" class="recipe-list-date">${escapeHtml(recipe.dateHuman)}</time>
                ${timesHtml}
                ${sourceHtml}
              </div>
              ${tagsHtml}
            </div>
          </div>
        </article>
      `;
    }).join('');

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
            if (searchClear) searchClear.style.display = 'none';
          }
          resetSearch();
        });
      }
    }
  }

  function escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

(function () {
  const grid = document.querySelector('[data-post-grid]');
  const pagination = document.querySelector('[data-pagination]');
  const searchInput = document.querySelector('[data-search]');
  const categorySelect = document.querySelector('[data-category]');
  const sortSelect = document.querySelector('[data-sort]');
  const orderSelect = document.querySelector('[data-order]');
  const resultCount = document.querySelector('[data-results-count]');
  const emptyState = document.querySelector('[data-empty-state]');
  const clearButton = document.querySelector('[data-clear-filters]');
  // All nine are dereferenced unconditionally below, so all nine belong in the
  // same guard. The three added last - the count, the empty state and the clear
  // button - were being read in render() and in the fetch failure path without
  // ever being checked, which turned a markup change into a thrown TypeError
  // instead of the quiet stand-down this early return exists to perform. The
  // grid is server-rendered either way, so standing down leaves a readable page.
  if (
    !grid || !pagination || !searchInput || !categorySelect || !sortSelect ||
    !orderSelect || !resultCount || !emptyState || !clearButton
  ) return;

  const language = document.documentElement.lang || 'en';
  const pageSize = 12;
  const copy = {
    en: { article: 'article', articles: 'articles', read: 'Read article', page: 'Page', next: 'Next', previous: 'Previous', error: 'The article catalog could not be loaded.' },
    es: { article: 'artículo', articles: 'artículos', read: 'Leer el artículo', page: 'Página', next: 'Siguiente', previous: 'Anterior', error: 'No se pudo cargar el catálogo de artículos.' },
    pt: { article: 'artigo', articles: 'artigos', read: 'Ler o artigo', page: 'Página', next: 'Próxima', previous: 'Anterior', error: 'Não foi possível carregar o catálogo de artigos.' }
  };
  const labels = copy[language] || copy.en;
  let articles = [];
  let currentPage = 1;

  function normalize(value) {
    return value.toLocaleLowerCase(language).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function articleUrl(article) {
    return `/${article.language}/blog/${article.slug}/`;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }

  function filteredArticles() {
    const query = normalize(searchInput.value.trim());
    const category = categorySelect.value;
    const sortBy = sortSelect.value;
    const direction = orderSelect.value === 'asc' ? 1 : -1;
    const filtered = articles.filter((article) => {
      const haystack = normalize(`${article.title} ${article.category} ${article.summary}`);
      return (!query || haystack.includes(query)) && (!category || article.category === category);
    });

    return filtered.sort((first, second) => {
      if (sortBy === 'date') return first.date.localeCompare(second.date) * direction;
      return first[sortBy].localeCompare(second[sortBy], language, { sensitivity: 'base' }) * direction;
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function renderPagination(totalPages) {
    pagination.innerHTML = '';
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const addButton = (label, page, options = {}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pagination-btn';
      button.textContent = label;
      // aria-disabled rather than disabled: a disabled control drops out of the
      // tab order, so a keyboard reader who lands on "Previous" at page 1 is
      // silently skipped past the whole pagination bar.
      if (options.disabled) button.setAttribute('aria-disabled', 'true');
      if (options.current) button.setAttribute('aria-current', 'page');
      button.setAttribute('aria-label', options.ariaLabel || label);
      button.addEventListener('click', () => {
        if (options.disabled) return;
        currentPage = page;
        render();
        const toolbar = document.querySelector('.catalog-toolbar');
        if (toolbar) toolbar.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
        // Scrolling alone leaves focus on a button that has just been replaced,
        // which sends focus back to the top of the document.
        const firstLink = grid.querySelector('h3 a');
        if (firstLink) firstLink.focus({ preventScroll: true });
      });
      pagination.appendChild(button);
    };

    addButton(`← ${labels.previous}`, currentPage - 1, { disabled: currentPage === 1 });
    for (let page = 1; page <= totalPages; page += 1) {
      if (page > 1) {
        const separator = document.createElement('span');
        separator.className = 'pagination-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '|';
        pagination.appendChild(separator);
      }
      addButton(String(page), page, { current: page === currentPage, ariaLabel: `${labels.page} ${page}` });
    }
    addButton(`${labels.next} →`, currentPage + 1, { disabled: currentPage === totalPages });
  }

  function render() {
    const filtered = filteredArticles();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    grid.innerHTML = visible.map((article) => `
      <article class="post-card">
        <div class="post-meta"><span>${escapeHtml(article.language.toUpperCase())}</span><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(article.date))}</span></div>
        <h3><a href="${escapeHtml(articleUrl(article))}">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.summary)}</p>
        <a class="card-link" href="${escapeHtml(articleUrl(article))}">${labels.read} →</a>
      </article>
    `).join('');

    const noun = filtered.length === 1 ? labels.article : labels.articles;
    resultCount.textContent = `${filtered.length} ${noun}`;
    emptyState.hidden = filtered.length > 0;
    clearButton.hidden = !searchInput.value && !categorySelect.value;
    renderPagination(totalPages);
  }

  function resetAndRender() {
    currentPage = 1;
    render();
  }

  function populateCategories() {
    [...new Set(articles.map((article) => article.category))]
      .sort((first, second) => first.localeCompare(second, language, { sensitivity: 'base' }))
      .forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
  }

  // Every keystroke rebuilt the whole grid and rewrote the live region, so a
  // screen reader announced a new count per character typed. Debouncing gives
  // the reader one announcement per pause in typing.
  function debounce(callback, wait) {
    let timer;
    return (...parameters) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...parameters), wait);
    };
  }

  const debouncedReset = debounce(resetAndRender, 250);

  [searchInput, categorySelect, sortSelect, orderSelect].forEach((control) => {
    if (control === searchInput) {
      control.addEventListener('input', debouncedReset);
    } else {
      control.addEventListener('change', resetAndRender);
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = '';
    resetAndRender();
    searchInput.focus();
  });

  // The grid, the count and the empty state are all pre-rendered by
  // scripts/generate-blog-pages.mjs, in this same order and with this same
  // markup. Redrawing them here on arrival replaced identical nodes and moved
  // the page for no reason, so on first load the script only fills in the parts
  // the server cannot know: the category options, and the pagination bar - and
  // the bar only when there is more than one page to offer. Everything after
  // that is a filter, sort or page change, which is a real change and does redraw.
  const catalogUrl = grid.getAttribute('data-catalog') || `/content/blog/catalog.${language}.json`;

  fetch(catalogUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      articles = catalog.filter((article) => article.language === language);
      populateCategories();
      const totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
      if (totalPages > 1) render();
      else renderPagination(1);
    })
    .catch(() => {
      // The grid is server-rendered, so a failed catalog fetch no longer means an
      // empty page - it means the filters cannot work. Wiping the articles to
      // print an error would be strictly worse than leaving them readable, so
      // the controls are disabled and the message goes beside the count instead.
      [searchInput, categorySelect, sortSelect, orderSelect].forEach((control) => {
        control.disabled = true;
      });
      const notice = document.createElement('p');
      notice.className = 'catalog-error';
      notice.setAttribute('role', 'status');
      notice.textContent = labels.error;
      resultCount.insertAdjacentElement('afterend', notice);
    });
})();

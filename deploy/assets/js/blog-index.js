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
  if (!grid || !pagination || !searchInput || !categorySelect || !sortSelect || !orderSelect) return;

  const language = document.documentElement.lang || 'en';
  const pageSize = 12;
  const copy = {
    en: { article: 'article', articles: 'articles', read: 'Read article', page: 'Page', next: 'Next', previous: 'Previous', error: 'The article catalog could not be loaded.' },
    es: { article: 'artículo', articles: 'artículos', read: 'Leer artículo', page: 'Página', next: 'Siguiente', previous: 'Anterior', error: 'No se pudo cargar el catálogo de artículos.' },
    pt: { article: 'artigo', articles: 'artigos', read: 'Ler artigo', page: 'Página', next: 'Próxima', previous: 'Anterior', error: 'Não foi possível carregar o catálogo de artigos.' }
  };
  const labels = copy[language] || copy.en;
  let articles = [];
  let currentPage = 1;

  function normalize(value) {
    return value.toLocaleLowerCase(language).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function articleUrl(article) {
    const query = new URLSearchParams({ post: article.slug });
    Object.entries(article.translations || {}).forEach(([code, slug]) => query.set(code, slug));
    return `/${article.language}/blog/article.html?${query.toString()}`;
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
      const haystack = normalize(`${article.title} ${article.category} ${article.summary} ${article.searchText}`);
      return (!query || haystack.includes(query)) && (!category || article.category === category);
    });

    return filtered.sort((first, second) => {
      if (sortBy === 'date') return first.date.localeCompare(second.date) * direction;
      return first[sortBy].localeCompare(second[sortBy], language, { sensitivity: 'base' }) * direction;
    });
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = '';
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const addButton = (label, page, options = {}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = options.disabled;
      if (options.current) button.setAttribute('aria-current', 'page');
      button.setAttribute('aria-label', options.ariaLabel || label);
      button.addEventListener('click', () => {
        currentPage = page;
        render();
        document.querySelector('.catalog-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  [searchInput, categorySelect, sortSelect, orderSelect].forEach((control) => {
    control.addEventListener(control === searchInput ? 'input' : 'change', resetAndRender);
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = '';
    resetAndRender();
    searchInput.focus();
  });

  fetch('/content/blog/catalog.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      articles = catalog.filter((article) => article.language === language);
      populateCategories();
      render();
    })
    .catch(() => {
      grid.innerHTML = `<p class="catalog-error">${labels.error}</p>`;
      resultCount.textContent = '';
      pagination.hidden = true;
    });
})();

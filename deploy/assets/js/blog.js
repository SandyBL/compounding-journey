(function () {
  const articleRoot = document.querySelector('[data-article-root]');
  if (!articleRoot) return;

  const copy = {
    en: {
      reading: 'min read', toc: 'In this article',
      insight: 'Key insight',
      error: 'This article could not be loaded. Check the URL or publish the Markdown file in Decap CMS.',
      authorPrefix: 'Written by',
      authorBio: 'Sandy writes about practical money systems, intentional work, and the patient path toward financial freedom.'
    },
    es: {
      reading: 'min de lectura', toc: 'En este artículo',
      insight: 'Idea clave',
      error: 'No se pudo cargar este artículo. Comprueba la URL o publica el archivo Markdown en Decap CMS.',
      authorPrefix: 'Escrito por',
      authorBio: 'Sandy escribe sobre sistemas financieros prácticos, trabajo con intención y el camino paciente hacia la libertad financiera.'
    },
    pt: {
      reading: 'min de leitura', toc: 'Neste artigo',
      insight: 'Ideia-chave',
      error: 'Não foi possível carregar este artigo. Confira a URL ou publique o arquivo Markdown no Decap CMS.',
      authorPrefix: 'Escrito por',
      authorBio: 'Sandy escreve sobre sistemas financeiros práticos, trabalho intencional e o caminho paciente para a liberdade financeira.'
    }
  };

  const language = document.documentElement.lang || 'en';
  const labels = copy[language] || copy.en;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('post');
  const status = document.querySelector('[data-article-status]');

  function parseFrontMatter(source) {
    const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) return { attributes: {}, body: source };
    const attributes = {};
    match[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':');
      if (separator < 0) return;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      attributes[key] = value;
    });
    return { attributes, body: source.slice(match[0].length) };
  }

  function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  function setMeta(selector, value, attribute = 'content') {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute(attribute, value);
  }

  function translationSlug(code) {
    return params.get(code) || slug;
  }

  function updateLanguageLinks() {
    document.querySelectorAll('[data-language-link]').forEach((link) => {
      const code = link.dataset.languageLink;
      const query = new URLSearchParams({ post: translationSlug(code) });
      ['en', 'es', 'pt'].forEach((lang) => {
        const translated = params.get(lang);
        if (translated) query.set(lang, translated);
      });
      link.href = `/${code}/blog/article.html?${query.toString()}`;
    });
  }

  function buildToc(body) {
    const list = document.querySelector('[data-toc-list]');
    const heading = document.querySelector('[data-toc-heading]');
    heading.textContent = labels.toc;
    body.querySelectorAll('h2').forEach((item, index) => {
      item.id = item.id || slugify(item.textContent) || `section-${index + 1}`;
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.textContent = item.textContent;
      listItem.appendChild(link);
      list.appendChild(listItem);
    });
  }

  function estimateReadingTime(markdown) {
    const words = markdown.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 210));
  }

  function normalizeMarkdown(markdown) {
    const cleaned = markdown
      .replace(/\\?\[cite:\s*[^\]\n]+\\?\]/gi, '')
      .replace(/\\([\\`*_[\]{}()#+\-.!>|])/g, '$1')
      .replace(/[ \t]+$/gm, '');

    const lines = cleaned.split('\n');
    const normalized = [];

    lines.forEach((line, index) => {
      const previous = normalized[normalized.length - 1];
      const next = lines[index + 1];
      const betweenTableRows = line.trim() === '' && /^\s*\|/.test(previous || '') && /^\s*\|/.test(next || '');
      if (!betweenTableRows) normalized.push(line);
    });

    return normalized.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function enhanceArticle(body) {
    body.querySelectorAll('table').forEach((table) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'article-table-wrap';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    body.querySelectorAll('blockquote').forEach((blockquote) => {
      const firstParagraph = blockquote.querySelector('p');
      if (!firstParagraph || !/^\s*💡/.test(firstParagraph.textContent)) return;
      const firstTextNode = Array.from(firstParagraph.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && /💡/.test(node.textContent));
      if (firstTextNode) firstTextNode.textContent = firstTextNode.textContent.replace(/^\s*💡\s*/, '');
      blockquote.classList.add('article-callout');
      blockquote.dataset.label = labels.insight;
    });

    body.querySelectorAll('a[href]').forEach((link) => {
      if (link.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  async function renderArticle() {
    updateLanguageLinks();
    if (!slug || !/^[a-z0-9-]+$/i.test(slug)) throw new Error('Missing or invalid article slug');
    const response = await fetch(`/content/blog/${language}/${slug}.md`);
    if (!response.ok) throw new Error(`Article request failed: ${response.status}`);
    const source = await response.text();
    const { attributes, body: rawMarkdown } = parseFrontMatter(source);
    const markdown = normalizeMarkdown(rawMarkdown);
    const body = document.querySelector('[data-article-body]');
    body.innerHTML = DOMPurify.sanitize(marked.parse(markdown, { gfm: true }));
    enhanceArticle(body);
    status.hidden = true;
    document.querySelector('[data-article-content]').hidden = false;
    document.querySelector('[data-article-details]').hidden = false;

    const title = attributes.title || slug.replace(/-/g, ' ');
    const summary = attributes.summary || '';
    const date = attributes.date ? new Date(`${attributes.date}T12:00:00Z`) : null;
    const dateText = date ? new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date) : '';
    document.querySelector('[data-article-title]').textContent = title;
    document.querySelector('[data-article-summary]').textContent = summary;
    document.querySelector('[data-article-category]').textContent = attributes.category || '';
    document.querySelector('[data-article-date]').textContent = dateText;
    document.querySelector('[data-reading-time]').textContent = `${estimateReadingTime(markdown)} ${labels.reading}`;
    document.querySelector('[data-author-name]').textContent = `${labels.authorPrefix} ${attributes.author || 'Sandy Bradbury / Compounding Journey'}`;
    document.querySelector('[data-author-bio]').textContent = labels.authorBio;
    document.title = `${title} | Compounding Journey`;
    setMeta('meta[name="description"]', summary);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', summary);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('link[rel="canonical"]', window.location.href, 'href');
    document.querySelectorAll('link[rel="alternate"]').forEach((link) => {
      const code = link.hreflang;
      link.href = `${window.location.origin}/${code}/blog/article.html?post=${encodeURIComponent(translationSlug(code))}`;
    });
    buildToc(body);
  }

  renderArticle().catch(() => {
    document.querySelector('[data-article-content]').hidden = true;
    document.querySelector('[data-article-journey]').hidden = true;
    status.hidden = false;
    status.textContent = labels.error;
    status.classList.add('is-error');
  });
})();

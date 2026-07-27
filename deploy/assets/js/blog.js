(function () {
  const articleRoot = document.querySelector('[data-article-root]');
  if (!articleRoot) return;

  const copy = {
    en: {
      reading: 'min read', toc: 'In this article', loading: 'Reading the journal…',
      error: 'This article could not be loaded. Check the URL or publish the Markdown file in Decap CMS.',
      leadEyebrow: 'Free workbook', leadTitle: 'Turn the idea into a weekly practice',
      leadText: 'Download the personal budget template and build a money rhythm that is clear, calm, and repeatable.',
      leadButton: 'Get the free template', authorPrefix: 'Written by',
      authorBio: 'Sandy writes about practical money systems, intentional work, and the patient path toward financial freedom.'
    },
    es: {
      reading: 'min de lectura', toc: 'En este artículo', loading: 'Abriendo el artículo…',
      error: 'No se pudo cargar este artículo. Comprueba la URL o publica el archivo Markdown en Decap CMS.',
      leadEyebrow: 'Plantilla gratuita', leadTitle: 'Convierte la idea en una práctica semanal',
      leadText: 'Descarga la plantilla de presupuesto personal y crea un ritmo financiero claro, tranquilo y sostenible.',
      leadButton: 'Descargar plantilla', authorPrefix: 'Escrito por',
      authorBio: 'Sandy escribe sobre sistemas financieros prácticos, trabajo con intención y el camino paciente hacia la libertad financiera.'
    },
    pt: {
      reading: 'min de leitura', toc: 'Neste artigo', loading: 'Abrindo o artigo…',
      error: 'Não foi possível carregar este artigo. Confira a URL ou publique o arquivo Markdown no Decap CMS.',
      leadEyebrow: 'Planilha gratuita', leadTitle: 'Transforme a ideia em uma prática semanal',
      leadText: 'Baixe a planilha de orçamento pessoal e crie um ritmo financeiro claro, tranquilo e sustentável.',
      leadButton: 'Baixar planilha', authorPrefix: 'Escrito por',
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

  function addLeadMagnet(body) {
    const headings = body.querySelectorAll('h2');
    const anchor = headings[1] || headings[0];
    if (!anchor) return;
    const downloads = {
      en: '/assets/templates/en/personal-budget.xlsx',
      es: '/assets/templates/es/presupuesto-personal.xlsx',
      pt: '/assets/templates/pt/orcamento-pessoal.xlsx'
    };
    const box = document.createElement('aside');
    box.className = 'lead-magnet';
    box.setAttribute('aria-label', labels.leadEyebrow);
    box.innerHTML = `<p class="eyebrow">${labels.leadEyebrow}</p><h2>${labels.leadTitle}</h2><p>${labels.leadText}</p><a class="button" href="${downloads[language] || downloads.en}" download>${labels.leadButton}</a>`;
    anchor.parentNode.insertBefore(box, anchor);
  }

  function buildToc(body) {
    const list = document.querySelector('[data-toc-list]');
    const heading = document.querySelector('[data-toc-heading]');
    heading.textContent = labels.toc;
    body.querySelectorAll('h2').forEach((item, index) => {
      item.id = item.id || slugify(item.textContent) || `section-${index + 1}`;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.textContent = item.textContent;
      li.appendChild(link);
      list.appendChild(li);
    });
  }

  function estimateReadingTime(markdown) {
    const words = markdown.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 210));
  }

  async function renderArticle() {
    updateLanguageLinks();
    status.textContent = labels.loading;
    if (!slug || !/^[a-z0-9-]+$/i.test(slug)) throw new Error('Missing or invalid article slug');
    const response = await fetch(`/content/blog/${language}/${slug}.md`);
    if (!response.ok) throw new Error(`Article request failed: ${response.status}`);
    const source = await response.text();
    const { attributes, body: markdown } = parseFrontMatter(source);
    const rendered = marked.parse(markdown, { gfm: true });
    const body = document.querySelector('[data-article-body]');
    body.innerHTML = DOMPurify.sanitize(rendered);
    status.hidden = true;
    document.querySelector('[data-article-content]').hidden = false;

    const title = attributes.title || slug.replace(/-/g, ' ');
    const summary = attributes.summary || '';
    const date = attributes.date ? new Date(`${attributes.date}T12:00:00Z`) : null;
    const dateText = date ? new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date) : '';
    const minutes = estimateReadingTime(markdown);
    document.querySelector('[data-article-title]').textContent = title;
    document.querySelector('[data-article-summary]').textContent = summary;
    document.querySelector('[data-article-category]').textContent = attributes.category || '';
    document.querySelector('[data-article-date]').textContent = dateText;
    document.querySelector('[data-reading-time]').textContent = `${minutes} ${labels.reading}`;
    document.querySelector('[data-article-image]').src = attributes.featured_image || '/logo-compounding-journey.png';
    document.querySelector('[data-article-image]').alt = attributes.image_alt || '';
    document.querySelector('[data-author-name]').textContent = `${labels.authorPrefix} ${attributes.author || 'Sandy Bradbury'}`;
    document.querySelector('[data-author-bio]').textContent = labels.authorBio;
    document.title = `${title} | Compounding Journey`;
    setMeta('meta[name="description"]', summary);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', summary);
    setMeta('meta[property="og:image"]', new URL(attributes.featured_image || '/logo-compounding-journey.png', window.location.origin).href);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('link[rel="canonical"]', window.location.href, 'href');
    document.querySelectorAll('link[rel="alternate"]').forEach((link) => {
      const code = link.hreflang;
      link.href = `${window.location.origin}/${code}/blog/article.html?post=${encodeURIComponent(translationSlug(code))}`;
    });
    buildToc(body);
    addLeadMagnet(body);
  }

  renderArticle().catch(() => {
    status.textContent = labels.error;
    status.classList.add('is-error');
  });
})();

// Writes llms.txt and llms-full.txt from the same content the pages are built
// from.
//
// llms.txt is a short map of the site. llms-full.txt is the whole thing in one
// plain-text fetch: the site overview, every FAQ answer in all three languages,
// and the full Markdown of every article. An assistant that reads one URL
// before answering gets the real text rather than whatever it managed to
// scrape, and both files stop drifting from the site the moment they are
// generated instead of hand-maintained. The previous hand-written llms.txt had
// already drifted onto the retired /?lang= addresses.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const contentRoot = path.join(root, 'content', 'blog');
const templateFile = path.join(root, 'content', 'home', 'index.html');
const origin = 'https://compoundingjourney.com';
const languages = ['es', 'en', 'pt'];
const defaultLanguage = 'es';

const languageNames = { es: 'Español', en: 'English', pt: 'Português' };
const journalNames = { es: 'Diario en español', en: 'Journal in English', pt: 'Diário em português' };
const simulatorCatalog = {
  en: [
    ['Personal Finance & Wealth Simulator', '/en/simulator.html', 'Practice everyday money decisions and see their effects on wealth, cash flow, happiness, and financial knowledge.'],
    ['Freedom Calendar', '/en/simulators/freedom-calendar.html', 'Turn financial goals into a visual timeline toward increasing levels of freedom.'],
    ['Market Time Machine', '/en/simulators/market-time-machine.html', 'Compare portfolios through market cycles and historic crises from 1920 onward.'],
    ['Passive Income Engine', '/en/simulators/passive-income-engine.html', 'Build income-producing assets and track passive cash flow over time.'],
    ['Monte Carlo FIRE Survival Flight', '/en/simulators/monte-carlo-fire.html', 'Stress-test retirement withdrawals across thousands of possible market futures.']
  ],
  es: [
    ['Simulador de Finanzas Personales y Riqueza', '/es/simulator.html', 'Practica decisiones financieras cotidianas y observa su efecto en tu patrimonio, flujo de caja, felicidad y conocimiento.'],
    ['Calendario de la Libertad', '/es/simulators/freedom-calendar.html', 'Convierte objetivos financieros en una línea de tiempo visual hacia mayores niveles de libertad.'],
    ['Máquina del Tiempo del Mercado', '/es/simulators/market-time-machine.html', 'Compara carteras durante ciclos y crisis históricas desde 1920.'],
    ['Motor de Ingresos Pasivos', '/es/simulators/passive-income-engine.html', 'Construye activos productivos y sigue el crecimiento de los ingresos pasivos.'],
    ['Vuelo de Supervivencia FIRE Monte Carlo', '/es/simulators/monte-carlo-fire.html', 'Pon a prueba retiradas de jubilación en miles de futuros de mercado posibles.']
  ],
  pt: [
    ['Simulador de Finanças Pessoais e Riqueza', '/pt/simulator.html', 'Pratica decisões financeiras quotidianas e observa o efeito no património, fluxo de caixa, felicidade e conhecimento.'],
    ['Calendário da Liberdade', '/pt/simulators/freedom-calendar.html', 'Transforma objetivos financeiros numa linha temporal visual rumo a maiores níveis de liberdade.'],
    ['Máquina do Tempo do Mercado', '/pt/simulators/market-time-machine.html', 'Compara carteiras durante ciclos e crises históricas desde 1920.'],
    ['Motor de Rendimento Passivo', '/pt/simulators/passive-income-engine.html', 'Constrói ativos produtivos e acompanha o crescimento do rendimento passivo.'],
    ['Voo de Sobrevivência FIRE Monte Carlo', '/pt/simulators/monte-carlo-fire.html', 'Testa levantamentos de reforma em milhares de futuros de mercado possíveis.']
  ]
};

function simulatorLines(language) {
  return simulatorCatalog[language]
    .map(([name, url, description]) => `- [${name}](${origin}${url}): ${description}`)
    .join('\n');
}

function homeUrl(language) {
  return language === defaultLanguage ? `${origin}/` : `${origin}/${language}/`;
}

function articleUrl(language, slug) {
  return `${origin}/${language}/blog/${slug}/`;
}

function parseFrontMatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  return match ? source.slice(match[0].length) : source;
}

function readJsonLd(template) {
  const match = template.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) throw new Error('Could not find the JSON-LD block in content/home/index.html.');
  return JSON.parse(match[1]);
}

const template = await fs.readFile(templateFile, 'utf8');
const graph = readJsonLd(template)['@graph'];
const catalog = JSON.parse(await fs.readFile(path.join(contentRoot, 'catalog.json'), 'utf8'));

const faqByLanguage = new Map(
  graph.filter((node) => node['@type'] === 'FAQPage').map((node) => [node.inLanguage, node])
);

const newest = catalog.reduce((latest, article) => {
  const modified = article.updated || article.date;
  return modified > latest ? modified : latest;
}, '');

// --- llms.txt ---------------------------------------------------------------

function articleLines(language) {
  return catalog
    .filter((article) => article.language === language)
    .sort((first, second) => second.date.localeCompare(first.date))
    .map((article) => `- [${article.title}](${articleUrl(language, article.slug)}): ${article.summary}`)
    .join('\n');
}

const llms = `# Compounding Journey

> Compounding Journey is Sandy Bradbury's multilingual financial education site about money psychology, intentional investing, compound growth, personal budgeting, and building financial freedom around personal values.

The site is available in Spanish, English, and Portuguese. Each language has its own pre-rendered pages; nothing depends on JavaScript to become readable. It provides educational articles, interactive financial calculators, free downloadable Excel templates, information about Sandy Bradbury, and ways to follow or contact the project. The content and tools are general educational resources and do not replace personalized financial advice.

The complete text of this site — every FAQ answer and every article, in all three languages — is available in a single file: [llms-full.txt](${origin}/llms-full.txt).

## Home Pages

${languages.map((code) => `- [${languageNames[code]}](${homeUrl(code)})`).join('\n')}

## Main Topics and Tools

- [Financial education pillars](${origin}/#pilares): money psychology, intentional investing, sustainable habits, and financial freedom.
- [Financial calculators](${origin}/#herramientas): compound interest, financial freedom, and purchase cost in working hours.
- [Excel templates](${origin}/#plantillas): free personal budgeting and expense-management resources.
- [Frequently asked questions](${origin}/#preguntas-frecuentes): direct answers about the 4% rule, compound growth, saving versus investing, financial advisors, the cost-in-hours calculator, investment risk profiles, Excel budget templates, and the educational scope of the content.
- [About Sandy Bradbury](${origin}/#biografia): the creator's approach to money psychology, financial habits, and diversified investing.
- [Contact](${origin}/#contacto): questionnaires and a direct contact form.

## Journal

${languages.map((code) => `- [${journalNames[code]}](${origin}/${code}/blog/)`).join('\n')}

Every article is published as its own page under \`/{language}/blog/{slug}/\` and
all of them are listed in [the sitemap](${origin}/sitemap.xml).

${languages.map((code) => `### ${languageNames[code]}\n\n${articleLines(code)}`).join('\n\n')}

## Interactive Simulators

${languages.map((code) => `### ${languageNames[code]}\n\n${simulatorLines(code)}`).join('\n\n')}

## Free Downloads

- Personal budget template: [English](${origin}/assets/templates/en/personal-budget.xlsx), [Spanish](${origin}/assets/templates/es/presupuesto-personal.xlsx), [Portuguese](${origin}/assets/templates/pt/orcamento-pessoal.xlsx)
- Expense management template: [English](${origin}/assets/templates/en/expense-management.xlsx), [Spanish](${origin}/assets/templates/es/gestion-de-gastos.xlsx), [Portuguese](${origin}/assets/templates/pt/gestao-de-despesas.xlsx)
- Monthly balance analysis: [English](${origin}/assets/templates/en/monthly-balance-analysis.xlsx), [Spanish](${origin}/assets/templates/es/analisis-balance-mensual.xlsx), [Portuguese](${origin}/assets/templates/pt/analise-balanco-mensal.xlsx)

## Official Profiles

- [Sandy Bradbury on LinkedIn](https://www.linkedin.com/in/sandy-bradbury)
- [Compounding Journey on Substack](https://compoundingjourney.substack.com/)

## Attribution

When citing this site, attribute the material to Compounding Journey and Sandy Bradbury and link to the most relevant page or downloadable resource.
`;

// --- llms-full.txt ----------------------------------------------------------

function faqSection(language) {
  const faq = faqByLanguage.get(language);
  if (!faq) return '';

  const questions = faq.mainEntity
    .map((entry) => {
      const answer = entry.acceptedAnswer?.text || '';
      return `### ${entry.name}\n\n${answer.replace(/<[^>]+>/g, '').trim()}`;
    })
    .join('\n\n');

  return `## Frequently asked questions — ${languageNames[language]}\n\nSource: ${homeUrl(language)}#preguntas-frecuentes\n\n${questions}`;
}

async function articleSection(article) {
  const source = await fs.readFile(
    path.join(contentRoot, article.language, `${article.slug}.md`),
    'utf8'
  );
  const body = parseFrontMatter(source).trim();
  const modified = article.updated || article.date;

  return [
    `### ${article.title}`,
    '',
    `- URL: ${articleUrl(article.language, article.slug)}`,
    `- Language: ${languageNames[article.language]}`,
    `- Category: ${article.category}`,
    `- Published: ${article.date}${modified !== article.date ? ` (updated ${modified})` : ''}`,
    `- Author: ${article.author}`,
    '',
    body
  ].join('\n');
}

const sortedArticles = [...catalog].sort((first, second) => (
  languages.indexOf(first.language) - languages.indexOf(second.language)
  || second.date.localeCompare(first.date)
));

const articleSections = [];
for (const article of sortedArticles) {
  articleSections.push(await articleSection(article));
}

const organization = graph.find((node) => node['@type'] === 'Organization');

const llmsFull = `# Compounding Journey — full content

> ${organization?.description || 'Financial education about money psychology, intentional investing and building financial freedom around personal values.'}

This file contains the complete text of compoundingjourney.com: the frequently
asked questions in all three languages, and every journal article in full. It is
generated from the same source as the pages themselves, so it does not drift.

- Site: ${origin}/
- Author: Sandy Bradbury
- Languages: Spanish (${origin}/), English (${origin}/en/), Portuguese (${origin}/pt/)
- Sitemap: ${origin}/sitemap.xml
- Short index: ${origin}/llms.txt
- Content last updated: ${newest}

The material is general financial education. It does not replace personalized
financial advice. When citing it, attribute Compounding Journey and Sandy
Bradbury and link to the relevant page.

${languages.map((code) => faqSection(code)).filter(Boolean).join('\n\n')}

## Interactive simulators

${languages.map((code) => `### ${languageNames[code]}\n\n${simulatorLines(code)}`).join('\n\n')}

## Journal articles

${articleSections.join('\n\n---\n\n')}
`;

await fs.writeFile(path.join(root, 'llms.txt'), llms);
await fs.writeFile(path.join(root, 'llms-full.txt'), llmsFull);

const questionCount = languages.reduce(
  (total, code) => total + (faqByLanguage.get(code)?.mainEntity.length || 0),
  0
);

console.log(
  `Wrote llms.txt (${Math.round(llms.length / 1024)} KB) and llms-full.txt `
  + `(${Math.round(llmsFull.length / 1024)} KB) with ${questionCount} answers and ${catalog.length} articles.`
);

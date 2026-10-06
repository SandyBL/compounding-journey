// The two emails the site sends: the welcome email and the new-article
// broadcast, in each of the three languages.
//
// Both end with the same footer, which is required on every email this system
// sends: an invitation to the English Substack, labelled as Substack and as
// English so nobody mistakes it for this subscription, and then the
// unsubscribe link.
import { SITE_ORIGIN, SUBSTACK_URL } from './config.mjs';

const COPY = {
  en: {
    tagline: 'Your map to freedom',
    welcomeLabel: 'Welcome',
    welcomeSubject: (name) => `Welcome to Compounding Journey, ${name}`,
    welcomeSubjectPlain: 'Welcome to Compounding Journey',
    greeting: (name) => `Hi ${name},`,
    nameFallback: 'there',
    welcomeIntro:
      'Thank you for subscribing. From now on, every new article published on Compounding Journey in English will arrive in this inbox: practical ideas on money psychology, purposeful investing and financial freedom.',
    guideTitle: 'Start here: the three most-read articles',
    guideIntro: 'While you wait for the next one, these are the articles readers come back to most.',
    readArticle: 'Read the article',
    newArticle: 'New on Compounding Journey',
    relatedLabel: 'Also worth reading',
    termLabel: 'From the glossary',
    termCta: 'Read the definition',
    signOff: 'See you in the next one,',
    substackTitle: 'Also on Substack (in English)',
    substackBody:
      'If you want to receive the latest newsletter straight to your inbox in English, you can also subscribe to the Compounding Journey newsletter on Substack.',
    substackCta: 'Subscribe on Substack',
    why: 'You are receiving this because you subscribed by email at compoundingjourney.com.',
    unsubscribe: 'Unsubscribe'
  },
  es: {
    tagline: 'Tu mapa hacia la libertad',
    welcomeLabel: 'Bienvenida',
    welcomeSubject: (name) => `Te damos la bienvenida a Compounding Journey, ${name}`,
    welcomeSubjectPlain: 'Te damos la bienvenida a Compounding Journey',
    greeting: (name) => `Hola, ${name}:`,
    nameFallback: 'amigo/a',
    welcomeIntro:
      'Gracias por suscribirte. A partir de ahora, cada nuevo artículo que se publique en Compounding Journey en español llegará a este correo: ideas prácticas sobre psicología del dinero, inversión con propósito y libertad financiera.',
    guideTitle: 'Por dónde empezar: los tres artículos más leídos',
    guideIntro: 'Mientras llega el próximo, estos son los artículos a los que más vuelven los lectores.',
    readArticle: 'Leer el artículo',
    newArticle: 'Nuevo en Compounding Journey',
    relatedLabel: 'También te puede interesar',
    termLabel: 'Del glosario',
    termCta: 'Leer la definición',
    signOff: 'Nos leemos en el próximo,',
    substackTitle: 'También en Substack (en inglés)',
    substackBody:
      'Si quieres recibir la última newsletter directamente en tu bandeja de entrada en inglés, también puedes suscribirte a la newsletter de Compounding Journey en Substack.',
    substackCta: 'Suscribirme en Substack',
    why: 'Recibes este correo porque te suscribiste por email en compoundingjourney.com.',
    unsubscribe: 'Darme de baja'
  },
  pt: {
    tagline: 'O seu mapa para a liberdade',
    welcomeLabel: 'Boas-vindas',
    welcomeSubject: (name) => `Boas-vindas ao Compounding Journey, ${name}`,
    welcomeSubjectPlain: 'Boas-vindas ao Compounding Journey',
    greeting: (name) => `Olá, ${name},`,
    nameFallback: 'amigo/a',
    welcomeIntro:
      'Obrigado por se inscrever. A partir de agora, cada novo artigo publicado no Compounding Journey em português chegará a este e-mail: ideias práticas sobre psicologia do dinheiro, investimento com propósito e liberdade financeira.',
    guideTitle: 'Por onde começar: os três artigos mais lidos',
    guideIntro: 'Enquanto o próximo não chega, estes são os artigos aos quais os leitores mais voltam.',
    readArticle: 'Ler o artigo',
    newArticle: 'Novo no Compounding Journey',
    relatedLabel: 'Também vale a leitura',
    termLabel: 'Do glossário',
    termCta: 'Ler a definição',
    signOff: 'Até o próximo,',
    substackTitle: 'Também no Substack (em inglês)',
    substackBody:
      'Se quiser receber a newsletter mais recente diretamente na sua caixa de entrada em inglês, você também pode se inscrever na newsletter do Compounding Journey no Substack.',
    substackCta: 'Inscrever-me no Substack',
    why: 'Você recebe este e-mail porque se inscreveu por e-mail em compoundingjourney.com.',
    unsubscribe: 'Cancelar inscrição'
  }
};

const GREEN = '#1E4620';
const GOLD = '#C59B27';
const INK = '#2A241E';
const MUTED = '#5A5249';
const FAINT = '#7A7268';
const CREAM = '#FAF6ED';
// The site header's own cream, warmer than the page's (see assets/css/header.css).
const HEADER_CREAM = '#FCF1DB';
const BORDER = '#EFEAE0';

// The site's heading face. Apple Mail and iOS load it from the site; Gmail and
// Outlook ignore web fonts and fall through to the system stack.
const BRAND_FONT = "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

// A 128px copy of the logo, for retina at 64px. The original is 2048px and
// ~750 KB; this one is served from the root, under the /*.png rule in _headers
// that allows other origins - mail clients among them - to embed it.
const LOGO_URL = `${SITE_ORIGIN}/email-logo-compounding-journey.png`;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(href, label) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-family:${BRAND_FONT};font-weight:700;font-size:15px;padding:13px 24px;border-radius:10px;">${escapeHtml(label)} &rarr;</a>`;
}

/** The small gold uppercase label above a heading, as on the site. */
function eyebrow(label) {
  return `<p style="margin:0 0 10px;font-family:${BRAND_FONT};font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${GOLD};">${escapeHtml(label)}</p>`;
}

/** The short gold rule under a section heading. */
function divider(margin = '0 0 18px') {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:${margin};"><tr><td style="width:40px;height:3px;background:${GOLD};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

function signOff(copy, padding) {
  return `
    <tr><td style="padding:${padding};font-size:15px;line-height:1.7;color:${INK};">
      <p style="margin:0;">${escapeHtml(copy.signOff)}<br><strong style="font-family:${BRAND_FONT};color:${GREEN};">Sandy Bradbury</strong></p>
    </td></tr>`;
}

function footer(copy, unsubscribeHref) {
  return `
    <tr><td style="padding:28px 32px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-top:3px solid #FF6719;border-radius:12px;">
        <tr><td style="padding:20px 22px;">
          <p style="margin:0 0 6px;font-family:${BRAND_FONT};font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${GREEN};">${escapeHtml(copy.substackTitle)}</p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(copy.substackBody)}</p>
          <a href="${SUBSTACK_URL}" style="display:inline-block;background:#FF6719;color:#ffffff;text-decoration:none;font-family:${BRAND_FONT};font-size:14px;font-weight:700;padding:10px 18px;border-radius:8px;">${escapeHtml(copy.substackCta)} &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="background:${HEADER_CREAM};border-top:1px solid ${BORDER};border-radius:0 0 16px 16px;padding:22px 32px 26px;font-size:12px;line-height:1.6;color:${FAINT};">
      <p style="margin:0 0 4px;font-family:${BRAND_FONT};font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${GREEN};">Compounding Journey</p>
      <p style="margin:0 0 8px;">${escapeHtml(copy.why)}</p>
      <p style="margin:0;"><a href="${unsubscribeHref}" style="color:${FAINT};text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a> &middot; <a href="${SITE_ORIGIN}/" style="color:${FAINT};text-decoration:underline;">compoundingjourney.com</a></p>
    </td></tr>`;
}

/**
 * The shell shared by every email: a centred banner matching the site header -
 * the logo in its white rounded tile, the name in forest green and the
 * localized tagline in gold, on the header's cream - then the body and footer
 * on a white card.
 */
function frame(language, preheader, body) {
  const copy = COPY[language] ?? COPY.en;
  return `<!doctype html>
<html lang="${language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Compounding Journey</title>
<style>@font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:300 800;src:url(${SITE_ORIGIN}/assets/fonts/plus-jakarta-sans-latin.woff2) format('woff2');}</style></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;box-shadow:0 4px 18px rgba(45,36,27,0.08);">
    <tr><td align="center" style="background:${HEADER_CREAM};border-bottom:3px solid ${GOLD};border-radius:16px 16px 0 0;padding:30px 24px 24px;">
      <a href="${SITE_ORIGIN}/" style="text-decoration:none;display:inline-block;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;"><tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(45,36,27,0.12);">
          <img src="${LOGO_URL}" width="64" height="64" alt="Compounding Journey" style="display:block;width:64px;height:64px;border:0;border-radius:16px;">
        </td></tr></table>
        <span style="display:block;font-family:${BRAND_FONT};font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.2;text-transform:uppercase;color:${GREEN};">Compounding Journey</span>
        <span style="display:block;margin-top:4px;font-family:${BRAND_FONT};font-size:11px;font-weight:700;letter-spacing:.08em;line-height:1.2;text-transform:uppercase;color:${GOLD};">${escapeHtml(copy.tagline)}</span>
      </a>
    </td></tr>
    ${body}
  </table>
</td></tr></table>
</body>
</html>`;
}

function substackText(copy) {
  return `${copy.substackTitle}\n${copy.substackBody}\n${copy.substackCta}: ${SUBSTACK_URL}`;
}

export function welcomeEmail({ language, firstName, articles, unsubscribeHref }) {
  const copy = COPY[language] ?? COPY.en;
  const name = firstName || copy.nameFallback;

  // Each recommendation is its own card - numbered, with a gold edge and its
  // own link - so the three read as three choices rather than one paragraph.
  const list = articles
    .map(
      (article, index) => `
        <tr><td style="padding:0 0 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 6px;font-family:${BRAND_FONT};font-size:12px;font-weight:800;letter-spacing:.1em;color:${GOLD};">${String(index + 1).padStart(2, '0')}</p>
              <a href="${escapeHtml(article.link)}" style="display:block;font-family:${BRAND_FONT};font-size:17px;font-weight:700;line-height:1.35;color:${GREEN};text-decoration:none;">${escapeHtml(article.title)}</a>
              ${article.summary ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(article.summary)}</p>` : ''}
              <p style="margin:12px 0 0;"><a href="${escapeHtml(article.link)}" style="font-family:${BRAND_FONT};font-size:14px;font-weight:700;color:${GREEN};text-decoration:none;border-bottom:2px solid ${GOLD};">${escapeHtml(copy.readArticle)} &rarr;</a></p>
            </td></tr>
          </table>
        </td></tr>`
    )
    .join('');

  const guide = articles.length
    ? `
    <tr><td style="padding:18px 32px 8px;">
      <h2 style="margin:0 0 10px;font-family:${BRAND_FONT};font-size:19px;line-height:1.35;color:${GREEN};">${escapeHtml(copy.guideTitle)}</h2>
      ${divider('0 0 14px')}
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(copy.guideIntro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>
    </td></tr>`
    : '';

  const html = frame(
    language,
    copy.welcomeIntro,
    `
    <tr><td style="padding:32px 32px 8px;">
      ${eyebrow(copy.welcomeLabel)}
      <h1 style="margin:0 0 10px;font-family:${BRAND_FONT};font-size:24px;line-height:1.3;color:${GREEN};">${escapeHtml(copy.greeting(name))}</h1>
      ${divider()}
      <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:${INK};">${escapeHtml(copy.welcomeIntro)}</p>
    </td></tr>
    ${guide}
    ${signOff(copy, '8px 32px 0')}
    ${footer(copy, escapeHtml(unsubscribeHref))}`
  );

  const text = [
    copy.greeting(name),
    '',
    copy.welcomeIntro,
    '',
    ...(articles.length
      ? [
          copy.guideTitle,
          '',
          ...articles.map((article, index) => `${index + 1}. ${article.title}\n   ${copy.readArticle}: ${article.link}\n`)
        ]
      : []),
    copy.signOff,
    'Sandy Bradbury',
    '',
    '---',
    substackText(copy),
    '',
    copy.why,
    `${copy.unsubscribe}: ${unsubscribeHref}`
  ].join('\n');

  return { subject: firstName ? copy.welcomeSubject(firstName) : copy.welcomeSubjectPlain, html, text };
}

/**
 * A secondary card under the article: a label, a linked heading, a sentence and
 * a text link. Lighter than the article's own card - white rather than cream,
 * no button - so the new article stays the one obvious thing to click.
 */
function extraCard({ label, title, href, description, cta }) {
  return `
    <tr><td style="padding:14px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-left:4px solid ${GREEN};border-radius:12px;">
        <tr><td style="padding:18px 20px;">
          <p style="margin:0 0 6px;font-family:${BRAND_FONT};font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${GOLD};">${escapeHtml(label)}</p>
          <a href="${escapeHtml(href)}" style="display:block;font-family:${BRAND_FONT};font-size:17px;font-weight:700;line-height:1.35;color:${GREEN};text-decoration:none;">${escapeHtml(title)}</a>
          ${description ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(description)}</p>` : ''}
          <p style="margin:12px 0 0;"><a href="${escapeHtml(href)}" style="font-family:${BRAND_FONT};font-size:14px;font-weight:700;color:${GREEN};text-decoration:none;border-bottom:2px solid ${GOLD};">${escapeHtml(cta)} &rarr;</a></p>
        </td></tr>
      </table>
    </td></tr>`;
}

/**
 * The new-article broadcast. Personalised by Resend at send time: the first
 * name comes from the contact, and the unsubscribe link is Resend's own, which
 * marks the contact unsubscribed in Resend - the dispatcher mirrors that back
 * into the database once a day.
 *
 * `related` (another article, as read from the feed) and `term` (a glossary
 * entry the article uses) are optional, and each card is left out when its
 * extra could not be found - see lib/newsletter/extras.mjs.
 */
export function articleBroadcast({ language, article, related = null, term = null }) {
  const copy = COPY[language] ?? COPY.en;
  const name = `{{{contact.first_name|${copy.nameFallback}}}}`;
  const unsubscribeHref = '{{{RESEND_UNSUBSCRIBE_URL}}}';

  const extras = [
    related
      ? extraCard({ label: copy.relatedLabel, title: related.title, href: related.link, description: related.summary, cta: copy.readArticle })
      : '',
    term
      ? extraCard({ label: copy.termLabel, title: term.name, href: term.link, description: term.short, cta: copy.termCta })
      : ''
  ].join('');

  const html = frame(
    language,
    article.summary || article.title,
    `
    <tr><td style="padding:32px 32px 8px;">
      ${eyebrow(copy.newArticle)}
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:${INK};">${escapeHtml(copy.greeting(name))}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${BORDER};border-left:4px solid ${GOLD};border-radius:12px;">
        <tr><td style="padding:22px 22px 24px;">
          <h1 style="margin:0 0 10px;font-family:${BRAND_FONT};font-size:24px;line-height:1.3;color:${GREEN};">${escapeHtml(article.title)}</h1>
          ${divider('0 0 16px')}
          ${article.summary ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(article.summary)}</p>` : ''}
          <p style="margin:0;">${button(article.link, copy.readArticle)}</p>
        </td></tr>
      </table>
    </td></tr>
    ${extras}
    ${signOff(copy, '18px 32px 0')}
    ${footer(copy, unsubscribeHref)}`
  );

  const text = [
    copy.newArticle,
    '',
    copy.greeting(name),
    '',
    article.title,
    article.summary,
    '',
    `${copy.readArticle}: ${article.link}`,
    '',
    ...(related ? [copy.relatedLabel, related.title, `${copy.readArticle}: ${related.link}`, ''] : []),
    ...(term ? [copy.termLabel, `${term.name}: ${term.short}`, `${copy.termCta}: ${term.link}`, ''] : []),
    copy.signOff,
    'Sandy Bradbury',
    '',
    '---',
    substackText(copy),
    '',
    copy.why,
    `${copy.unsubscribe}: ${unsubscribeHref}`
  ].join('\n');

  return { subject: article.title, html, text };
}

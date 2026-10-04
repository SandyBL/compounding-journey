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
    signOff: 'See you in the next one,',
    substackTitle: 'Also on Substack (in English)',
    substackBody:
      'If you want to receive the latest newsletter straight to your inbox in English, you can also subscribe to the Compounding Journey newsletter on Substack.',
    substackCta: 'Subscribe on Substack',
    why: 'You are receiving this because you subscribed by email at compoundingjourney.com.',
    unsubscribe: 'Unsubscribe'
  },
  es: {
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
    signOff: 'Nos leemos en el próximo,',
    substackTitle: 'También en Substack (en inglés)',
    substackBody:
      'Si quieres recibir la última newsletter directamente en tu bandeja de entrada en inglés, también puedes suscribirte a la newsletter de Compounding Journey en Substack.',
    substackCta: 'Suscribirme en Substack',
    why: 'Recibes este correo porque te suscribiste por email en compoundingjourney.com.',
    unsubscribe: 'Darme de baja'
  },
  pt: {
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
const CREAM = '#FAF6ED';
const BORDER = '#EFEAE0';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(href, label) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px;">${escapeHtml(label)}</a>`;
}

function footer(copy, unsubscribeHref) {
  return `
    <tr><td style="padding:28px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${BORDER};border-radius:12px;">
        <tr><td style="padding:20px 22px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${GREEN};">${escapeHtml(copy.substackTitle)}</p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${INK};">${escapeHtml(copy.substackBody)}</p>
          <a href="${SUBSTACK_URL}" style="display:inline-block;background:#FF6719;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:10px 18px;border-radius:8px;">${escapeHtml(copy.substackCta)} &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;font-size:12px;line-height:1.6;color:#7a7268;">
      <p style="margin:0 0 6px;">${escapeHtml(copy.why)}</p>
      <p style="margin:0;"><a href="${unsubscribeHref}" style="color:#7a7268;text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a> &middot; <a href="${SITE_ORIGIN}/" style="color:#7a7268;text-decoration:underline;">compoundingjourney.com</a></p>
    </td></tr>`;
}

function frame(language, preheader, body) {
  return `<!doctype html>
<html lang="${language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compounding Journey</title></head>
<body style="margin:0;padding:0;background:#f3efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;">
    <tr><td style="padding:24px 32px;border-bottom:3px solid ${GOLD};">
      <a href="${SITE_ORIGIN}/" style="text-decoration:none;font-size:18px;font-weight:800;color:${GREEN};">Compounding Journey</a>
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

  const list = articles
    .map(
      (article) => `
        <tr><td style="padding:0 0 18px;">
          <a href="${escapeHtml(article.link)}" style="font-size:16px;font-weight:700;color:${GREEN};text-decoration:none;">${escapeHtml(article.title)}</a>
          ${article.summary ? `<p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:#5a5249;">${escapeHtml(article.summary)}</p>` : ''}
        </td></tr>`
    )
    .join('');

  const guide = articles.length
    ? `
    <tr><td style="padding:8px 32px 0;">
      <h2 style="margin:0 0 6px;font-size:18px;color:${GREEN};">${escapeHtml(copy.guideTitle)}</h2>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5a5249;">${escapeHtml(copy.guideIntro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>
    </td></tr>`
    : '';

  const html = frame(
    language,
    copy.welcomeIntro,
    `
    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 14px;font-size:17px;font-weight:700;">${escapeHtml(copy.greeting(name))}</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">${escapeHtml(copy.welcomeIntro)}</p>
    </td></tr>
    ${guide}
    <tr><td style="padding:4px 32px 0;font-size:15px;line-height:1.7;">
      <p style="margin:0;">${escapeHtml(copy.signOff)}<br><strong>Sandy Bradbury</strong></p>
    </td></tr>
    ${footer(copy, escapeHtml(unsubscribeHref))}`
  );

  const text = [
    copy.greeting(name),
    '',
    copy.welcomeIntro,
    '',
    ...(articles.length ? [copy.guideTitle, ...articles.map((article) => `- ${article.title}\n  ${article.link}`), ''] : []),
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
 * The new-article broadcast. Personalised by Resend at send time: the first
 * name comes from the contact, and the unsubscribe link is Resend's own, which
 * marks the contact unsubscribed in Resend - the dispatcher mirrors that back
 * into the database once a day.
 */
export function articleBroadcast({ language, article }) {
  const copy = COPY[language] ?? COPY.en;
  const name = `{{{contact.first_name|${copy.nameFallback}}}}`;
  const unsubscribeHref = '{{{RESEND_UNSUBSCRIBE_URL}}}';

  const html = frame(
    language,
    article.summary || article.title,
    `
    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${GOLD};">${escapeHtml(copy.newArticle)}</p>
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;">${escapeHtml(copy.greeting(name))}</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:${GREEN};">${escapeHtml(article.title)}</h1>
      ${article.summary ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.7;">${escapeHtml(article.summary)}</p>` : ''}
      <p style="margin:0 0 8px;">${button(article.link, copy.readArticle)}</p>
    </td></tr>
    <tr><td style="padding:18px 32px 0;font-size:15px;line-height:1.7;">
      <p style="margin:0;">${escapeHtml(copy.signOff)}<br><strong>Sandy Bradbury</strong></p>
    </td></tr>
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

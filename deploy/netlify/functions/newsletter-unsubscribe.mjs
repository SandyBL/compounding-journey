// The unsubscribe link in every welcome email.
//
// GET shows a confirmation page with one button, and only the POST that button
// sends actually unsubscribes. Mail scanners and link previewers open every
// link in a message with a GET; if that were enough, a corporate mail filter
// would unsubscribe people from the welcome email they had just asked for.
//
// A POST carrying `List-Unsubscribe=One-Click` is the RFC 8058 one-click
// request a mail client sends from its own "Unsubscribe" button. It is
// accepted without a page, which is what that standard requires.
//
// Unsubscribing marks the row in the database and the contact in Resend, so
// neither the broadcasts (sent by Resend) nor a later re-sync can reach them.
// A reader subscribed in several languages has one link per language, and
// each one ends that language only.
import { SITE_ORIGIN, SUBSTACK_URL } from '../lib/newsletter/config.mjs';
import { escapeHtml } from '../lib/newsletter/emails.mjs';
import { hasApiKey, isNotFound, resend } from '../lib/newsletter/resend.mjs';
import { db } from '../lib/newsletter/store.mjs';

const COPY = {
  en: {
    title: 'Unsubscribe',
    confirm: (email) => `Stop sending Compounding Journey emails to ${email}?`,
    button: 'Unsubscribe',
    done: 'You are unsubscribed.',
    doneBody: 'You will not receive any more emails from this subscription. If this was a mistake, you can subscribe again from any page of the site.',
    invalid: 'This unsubscribe link is not valid or has already been used.',
    invalidBody: 'If you are still receiving emails, use the unsubscribe link in the most recent one, or write to compoundingjourney@gmail.com.',
    substack: 'This does not affect the separate Compounding Journey newsletter on Substack (English), which is managed from Substack itself.',
    back: 'Back to Compounding Journey'
  },
  es: {
    title: 'Darse de baja',
    confirm: (email) => `¿Dejar de enviar los correos de Compounding Journey a ${email}?`,
    button: 'Darme de baja',
    done: 'Te has dado de baja.',
    doneBody: 'No recibirás más correos de esta suscripción. Si ha sido un error, puedes volver a suscribirte desde cualquier página del sitio.',
    invalid: 'Este enlace de baja no es válido o ya se ha utilizado.',
    invalidBody: 'Si sigues recibiendo correos, usa el enlace de baja del más reciente o escribe a compoundingjourney@gmail.com.',
    substack: 'Esto no afecta a la newsletter de Compounding Journey en Substack (en inglés), que es independiente y se gestiona desde el propio Substack.',
    back: 'Volver a Compounding Journey'
  },
  pt: {
    title: 'Cancelar inscrição',
    confirm: (email) => `Deixar de enviar os e-mails do Compounding Journey para ${email}?`,
    button: 'Cancelar inscrição',
    done: 'A sua inscrição foi cancelada.',
    doneBody: 'Você não receberá mais e-mails desta inscrição. Se foi um engano, pode inscrever-se novamente em qualquer página do site.',
    invalid: 'Este link de cancelamento não é válido ou já foi utilizado.',
    invalidBody: 'Se continuar a receber e-mails, use o link de cancelamento do mais recente ou escreva para compoundingjourney@gmail.com.',
    substack: 'Isto não afeta a newsletter do Compounding Journey no Substack (em inglês), que é independente e gerida no próprio Substack.',
    back: 'Voltar ao Compounding Journey'
  }
};

const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

function homeFor(language) {
  return language === 'es' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${language}/`;
}

function page(language, heading, body, extra = '') {
  const copy = COPY[language];
  const html = `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(copy.title)} | Compounding Journey</title>
<style>
body{margin:0;background:#FAF6ED;color:#2A241E;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:520px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #EFEAE0;border-radius:16px}
.brand{font-weight:800;color:#1E4620;text-decoration:none}
h1{font-size:22px;color:#1E4620;margin:20px 0 10px}
p{line-height:1.6}
.note{font-size:14px;color:#6b6259}
button{background:#1E4620;color:#fff;border:0;border-radius:10px;padding:12px 22px;font-weight:700;font-size:15px;cursor:pointer}
a{color:#1E4620}
</style>
</head>
<body><main>
<a class="brand" href="${homeFor(language)}">Compounding Journey</a>
<h1>${escapeHtml(heading)}</h1>
${body}
${extra}
<p class="note">${escapeHtml(copy.substack)} <a href="${SUBSTACK_URL}">Substack</a></p>
<p><a href="${homeFor(language)}">${escapeHtml(copy.back)}</a></p>
</main></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    }
  });
}

async function findSubscriber(token) {
  if (!TOKEN.test(token)) return null;
  const [row] = await db().sql`
    SELECT id, email, language, status FROM newsletter_subscribers WHERE unsubscribe_token = ${token}
  `;
  return row ?? null;
}

async function unsubscribe(subscriber) {
  await db().sql`
    UPDATE newsletter_subscribers
    SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, now()), updated_at = now()
    WHERE id = ${subscriber.id}
  `;
  if (!hasApiKey()) return;
  const address = encodeURIComponent(subscriber.email);
  try {
    // Each link belongs to one language's subscription. Resend's unsubscribed
    // flag would stop every language at once, so while the reader still has
    // another language active, the contact only leaves this language's segment.
    const [{ others }] = await db().sql`
      SELECT count(*)::int AS others FROM newsletter_subscribers
      WHERE email = ${subscriber.email} AND id <> ${subscriber.id} AND status = 'active'
    `;
    if (Number(others) === 0) {
      await resend('PATCH', `/contacts/${address}`, { unsubscribed: true });
      return;
    }
    const [segment] = await db().sql`
      SELECT value FROM newsletter_resend_state WHERE key = ${`segment_${subscriber.language}`}
    `;
    if (segment) {
      await resend('DELETE', `/contacts/${address}/segments/${segment.value}`).catch((error) => {
        if (!isNotFound(error)) throw error;
      });
    }
  } catch (error) {
    // The database already says unsubscribed, and nothing is sent to a row
    // that says so. Resend's copy is corrected by the next re-sync.
    console.error(`newsletter: subscriber #${subscriber.id} unsubscribed here but Resend could not be updated.`, error);
  }
}

export default async (request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const hinted = url.searchParams.get('lang');
  const subscriber = await findSubscriber(token);
  const language = COPY[subscriber?.language] ? subscriber.language : COPY[hinted] ? hinted : 'en';
  const copy = COPY[language];

  if (request.method === 'POST') {
    const body = await request.text().catch(() => '');
    const oneClick = body.includes('List-Unsubscribe=One-Click');
    if (subscriber && subscriber.status === 'active') await unsubscribe(subscriber);
    if (oneClick) return new Response('OK', { headers: { 'Cache-Control': 'no-store' } });
    if (!subscriber) return page(language, copy.invalid, `<p>${escapeHtml(copy.invalidBody)}</p>`);
    return page(language, copy.done, `<p>${escapeHtml(copy.doneBody)}</p>`);
  }

  if (!subscriber) return page(language, copy.invalid, `<p>${escapeHtml(copy.invalidBody)}</p>`);
  if (subscriber.status !== 'active') return page(language, copy.done, `<p>${escapeHtml(copy.doneBody)}</p>`);

  return page(
    language,
    copy.title,
    `<p>${escapeHtml(copy.confirm(subscriber.email))}</p>`,
    `<form method="POST" action="/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}"><button type="submit">${escapeHtml(copy.button)}</button></form>`
  );
};

export const config = {
  path: '/api/newsletter/unsubscribe',
  method: ['GET', 'POST']
};

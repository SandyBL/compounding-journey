// The on-site email subscription: the "Subscribe" dialog, the buttons that
// open it, and the Substack link that sits beside them.
//
// One module because the same dialog is rendered into every page family - the
// home pages, the shell pages, the journal articles and indexes, and the
// simulators - and the one thing that must never happen is two of them
// disagreeing about what the form submits. Netlify Forms registers a form by
// reading the deployed HTML, and it registers this one ("newsletter") from
// whichever page it reads first; every copy has to carry the same fields.
//
// What is labelled what is the other reason. The site offers two different
// things that are both easy to call "the newsletter":
//
//   - this subscription, which emails each new article in the reader's own
//     language and is run by the site (Netlify Forms, then Resend); every
//     control for it says "Subscribe" and opens the dialog;
//   - the Compounding Journey publication on Substack, which is English only
//     and run by Substack; every link to it says "Substack" and "English" and
//     leaves the site.
//
// Nothing that opens the dialog mentions Substack, and nothing that goes to
// Substack opens the dialog. substackLink() is the one way the generators
// print the second, so its label cannot drift.
import { escapeHtml } from './markdown.mjs';
import { legalPath } from './site-routes.mjs';

export const SUBSTACK_URL = 'https://compoundingjourney.substack.com/';

/** The fragment every trigger links to. Opening it with no script still shows the dialog. */
export const SUBSCRIBE_ID = 'subscribe';

export const SUBSCRIBE_SCRIPT = '<script src="/assets/js/subscribe.js?v=source" defer></script>';

const COPY = {
  en: {
    headerLabel: 'Subscribe',
    headerAria: 'Subscribe to new articles by email',
    eyebrow: 'Free email subscription',
    title: 'Get every new article by email',
    intro: 'Leave your first name and email address. Each new Compounding Journey article in English will arrive in your inbox, starting with a welcome email that points you to the three most-read articles.',
    firstName: 'First name',
    email: 'Email address',
    submit: 'Subscribe',
    sending: 'Subscribing…',
    consentBefore: 'No spam, and every email has a one-click unsubscribe link. How your name and email are used is explained in the',
    consentLink: 'privacy policy',
    successTitle: 'You are subscribed!',
    successBody: 'Your welcome email is on its way. If it is not in your inbox in a few minutes, check your spam or promotions folder.',
    successClose: 'Back to the page',
    errorGeneric: 'Something went wrong and the subscription was not saved. Please try again in a moment.',
    errorName: 'Please enter your first name.',
    errorEmail: 'Please enter a valid email address.',
    close: 'Close',
    substackNote: 'Looking for the Substack newsletter? It is a separate publication, in English only:',
    substackLabel: 'Compounding Journey on Substack (English)',
    substackShort: 'Substack newsletter (English)',
    newTab: '(opens Substack in a new tab)',
    cardEyebrow: 'Email subscription',
    cardTitle: 'Enjoyed this article? Get the next one by email',
    cardBody: 'One email whenever a new article is published, in English. Free, and you can leave with one click.',
    cardButton: 'Subscribe by email',
    footerTitle: 'New articles by email',
    footerBody: 'One email per new article, in English. Free.',
    footerButton: 'Subscribe',
    menuButton: 'Subscribe by email'
  },
  es: {
    headerLabel: 'Suscribirse',
    headerAria: 'Suscribirse por email a los nuevos artículos',
    eyebrow: 'Suscripción gratuita por email',
    title: 'Recibe cada nuevo artículo por email',
    intro: 'Deja tu nombre y tu email. Cada nuevo artículo de Compounding Journey en español llegará a tu bandeja de entrada, empezando por un email de bienvenida con los tres artículos más leídos.',
    firstName: 'Nombre',
    email: 'Correo electrónico',
    submit: 'Suscribirme',
    sending: 'Suscribiendo…',
    consentBefore: 'Sin spam, y cada email incluye un enlace para darte de baja con un clic. Cómo se usan tu nombre y tu email se explica en la',
    consentLink: 'política de privacidad',
    successTitle: '¡Ya estás suscrito/a!',
    successBody: 'Tu email de bienvenida está en camino. Si en unos minutos no lo ves en la bandeja de entrada, revisa la carpeta de spam o de promociones.',
    successClose: 'Volver a la página',
    errorGeneric: 'Algo ha fallado y la suscripción no se ha guardado. Inténtalo de nuevo en un momento.',
    errorName: 'Escribe tu nombre.',
    errorEmail: 'Escribe un correo electrónico válido.',
    close: 'Cerrar',
    substackNote: '¿Buscas la newsletter de Substack? Es una publicación aparte, solo en inglés:',
    substackLabel: 'Compounding Journey en Substack (en inglés)',
    substackShort: 'Newsletter en Substack (en inglés)',
    newTab: '(abre Substack en una pestaña nueva)',
    cardEyebrow: 'Suscripción por email',
    cardTitle: '¿Te ha gustado este artículo? Recibe el próximo por email',
    cardBody: 'Un email cada vez que se publica un artículo nuevo, en español. Gratis, y te puedes dar de baja con un clic.',
    cardButton: 'Suscribirme por email',
    footerTitle: 'Nuevos artículos por email',
    footerBody: 'Un email por cada artículo nuevo, en español. Gratis.',
    footerButton: 'Suscribirse',
    menuButton: 'Suscribirse por email'
  },
  pt: {
    headerLabel: 'Inscrever-se',
    headerAria: 'Inscrever-se por e-mail nos novos artigos',
    eyebrow: 'Inscrição gratuita por e-mail',
    title: 'Receba cada novo artigo por e-mail',
    intro: 'Deixe o seu nome e o seu e-mail. Cada novo artigo do Compounding Journey em português chegará à sua caixa de entrada, começando por um e-mail de boas-vindas com os três artigos mais lidos.',
    firstName: 'Nome',
    email: 'E-mail',
    submit: 'Inscrever-me',
    sending: 'Inscrevendo…',
    consentBefore: 'Sem spam, e cada e-mail traz um link para cancelar a inscrição com um clique. Como o seu nome e o seu e-mail são usados está explicado na',
    consentLink: 'política de privacidade',
    successTitle: 'Inscrição feita!',
    successBody: 'O seu e-mail de boas-vindas está a caminho. Se não o vir na caixa de entrada em alguns minutos, verifique a pasta de spam ou de promoções.',
    successClose: 'Voltar à página',
    errorGeneric: 'Algo deu errado e a inscrição não foi guardada. Tente novamente daqui a pouco.',
    errorName: 'Escreva o seu nome.',
    errorEmail: 'Escreva um e-mail válido.',
    close: 'Fechar',
    substackNote: 'Procura a newsletter do Substack? É uma publicação separada, só em inglês:',
    substackLabel: 'Compounding Journey no Substack (em inglês)',
    substackShort: 'Newsletter no Substack (em inglês)',
    newTab: '(abre o Substack numa nova aba)',
    cardEyebrow: 'Inscrição por e-mail',
    cardTitle: 'Gostou deste artigo? Receba o próximo por e-mail',
    cardBody: 'Um e-mail sempre que um novo artigo é publicado, em português. Grátis, e pode sair com um clique.',
    cardButton: 'Inscrever-me por e-mail',
    footerTitle: 'Novos artigos por e-mail',
    footerBody: 'Um e-mail por cada novo artigo, em português. Grátis.',
    footerButton: 'Inscrever-se',
    menuButton: 'Inscrever-se por e-mail'
  }
};

export function subscribeCopy(language) {
  const copy = COPY[language];
  if (!copy) throw new Error(`newsletter-subscribe: no copy for "${language}".`);
  return copy;
}

const ENVELOPE = '<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="m3.5 6 6.5 5 6.5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// Substack's own mark, in its brand orange, on every link that goes there.
// Inline because the bundled Font Awesome has no Substack glyph, and an icon
// font request per page for one shape would cost more than these bytes.
export const SUBSTACK_ICON = '<svg class="substack-icon" aria-hidden="true" viewBox="0 0 24 24" width="14" height="14"><path fill="#FF6719" d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>';
const EXTERNAL = '<svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M9 3h4v4M13 3 7 9M11 9.5V13H3V5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Anything that opens the dialog. A link to #subscribe rather than a button,
 * so that with no script the browser still jumps to the dialog (which the
 * stylesheet shows when it is the target) and the form still posts.
 */
export function subscribeTrigger(language, placement, { className = 'subscribe-button', label, icon = true } = {}) {
  const copy = subscribeCopy(language);
  return `<a href="#${SUBSCRIBE_ID}" class="${className}" data-subscribe-open data-subscribe-placement="${escapeHtml(placement)}">`
    + `${icon ? ENVELOPE : ''}<span>${escapeHtml(label ?? copy.cardButton)}</span></a>`;
}

/** The header button: icon and label, the label dropped on narrow screens. */
export function headerSubscribe(language) {
  const copy = subscribeCopy(language);
  return `<a href="#${SUBSCRIBE_ID}" class="header-subscribe" data-subscribe-open data-subscribe-placement="header" aria-label="${escapeHtml(copy.headerAria)}">`
    + `${ENVELOPE}<span class="header-subscribe__label">${escapeHtml(copy.headerLabel)}</span></a>`;
}

/** The one way a generated page links to Substack. Always says Substack and English. */
export function substackLink(language, { className = 'substack-link', short = false } = {}) {
  const copy = subscribeCopy(language);
  return `<a class="${className}" href="${SUBSTACK_URL}" target="_blank" rel="noopener noreferrer" data-substack-link>`
    + `${SUBSTACK_ICON}${escapeHtml(short ? copy.substackShort : copy.substackLabel)}${EXTERNAL}<span class="subscribe-sr"> ${escapeHtml(copy.newTab)}</span></a>`;
}

/**
 * The dialog itself. Rendered once per page, just before </body>, and never
 * inside the sticky header: that header is a containing block for fixed
 * descendants, which would trap the no-script fallback inside it.
 */
export function subscribeDialog(language) {
  const copy = subscribeCopy(language);
  return `
<dialog id="${SUBSCRIBE_ID}" class="subscribe-dialog" lang="${language}" aria-labelledby="subscribe-title" data-subscribe-dialog
  data-error-generic="${escapeHtml(copy.errorGeneric)}" data-error-name="${escapeHtml(copy.errorName)}"
  data-error-email="${escapeHtml(copy.errorEmail)}" data-sending="${escapeHtml(copy.sending)}">
  <div class="subscribe-dialog__card">
    <a class="subscribe-dialog__close" href="#" data-subscribe-close aria-label="${escapeHtml(copy.close)}"><span aria-hidden="true">&times;</span></a>
    <div class="subscribe-dialog__view" data-subscribe-view="form">
      <p class="subscribe-dialog__eyebrow">${ENVELOPE}<span>${escapeHtml(copy.eyebrow)}</span></p>
      <h2 id="subscribe-title" class="subscribe-dialog__title">${escapeHtml(copy.title)}</h2>
      <p class="subscribe-dialog__intro">${escapeHtml(copy.intro)}</p>
      <form class="subscribe-form" name="newsletter" method="POST" data-netlify="true" netlify-honeypot="bot-field" novalidate data-subscribe-form>
        <input type="hidden" name="form-name" value="newsletter" />
        <input type="hidden" name="language" value="${language}" />
        <input type="hidden" name="placement" value="direct" data-subscribe-placement-field />
        <p class="subscribe-form__trap" aria-hidden="true"><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label></p>
        <div class="subscribe-form__field">
          <label for="subscribe-first-name">${escapeHtml(copy.firstName)}</label>
          <input id="subscribe-first-name" name="first_name" type="text" autocomplete="given-name" autocapitalize="words" maxlength="60" required />
        </div>
        <div class="subscribe-form__field">
          <label for="subscribe-email">${escapeHtml(copy.email)}</label>
          <input id="subscribe-email" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" maxlength="254" required />
        </div>
        <p class="subscribe-form__error" role="alert" data-subscribe-error hidden></p>
        <button type="submit" class="subscribe-form__submit" data-subscribe-submit>${escapeHtml(copy.submit)}</button>
        <p class="subscribe-form__consent">${escapeHtml(copy.consentBefore)} <a href="${legalPath('privacy', language)}">${escapeHtml(copy.consentLink)}</a>.</p>
      </form>
    </div>
    <div class="subscribe-dialog__view" data-subscribe-view="success" hidden>
      <p class="subscribe-dialog__check" aria-hidden="true">&#10003;</p>
      <h2 class="subscribe-dialog__title" tabindex="-1" data-subscribe-success-title>${escapeHtml(copy.successTitle)}</h2>
      <p class="subscribe-dialog__intro">${escapeHtml(copy.successBody)}</p>
      <a class="subscribe-form__submit" href="#" data-subscribe-close>${escapeHtml(copy.successClose)}</a>
    </div>
    <p class="subscribe-dialog__substack">${escapeHtml(copy.substackNote)} ${substackLink(language)}</p>
  </div>
</dialog>`;
}

/** Dialog and script together, for the end of <body>. */
export function subscribeTail(language) {
  return `${subscribeDialog(language)}\n${SUBSCRIBE_SCRIPT}`;
}

/** The card at the end of an article, and anywhere else a full pitch fits. */
export function subscribeCard(language, placement, { title, body } = {}) {
  const copy = subscribeCopy(language);
  return `<aside class="subscribe-card" aria-labelledby="subscribe-card-${placement}">`
    + `<p class="subscribe-card__eyebrow">${ENVELOPE}<span>${escapeHtml(copy.cardEyebrow)}</span></p>`
    + `<h2 id="subscribe-card-${placement}" class="subscribe-card__title">${escapeHtml(title ?? copy.cardTitle)}</h2>`
    + `<p class="subscribe-card__body">${escapeHtml(body ?? copy.cardBody)}</p>`
    + `<div class="subscribe-card__actions">${subscribeTrigger(language, placement)}</div>`
    + `<p class="subscribe-card__substack">${escapeHtml(copy.substackNote)} ${substackLink(language)}</p>`
    + `</aside>`;
}

/** The band above the footer of the shell pages and the journal. */
export function subscribeFooterBand(language) {
  const copy = subscribeCopy(language);
  return `<section class="subscribe-band" aria-label="${escapeHtml(copy.footerTitle)}"><div class="container subscribe-band__inner">`
    + `<div><p class="subscribe-band__title">${escapeHtml(copy.footerTitle)}</p><p class="subscribe-band__body">${escapeHtml(copy.footerBody)}</p></div>`
    + `<div class="subscribe-band__actions">${subscribeTrigger(language, 'footer', { label: copy.footerButton })}${substackLink(language, { short: true })}</div>`
    + `</div></section>`;
}

/** For the phone menu panel, under the Freedom Compass button. */
export function menuSubscribe(language) {
  const copy = subscribeCopy(language);
  return subscribeTrigger(language, 'menu', { className: 'site-menu-subscribe', label: copy.menuButton });
}

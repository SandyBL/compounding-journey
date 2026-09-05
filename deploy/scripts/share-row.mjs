/**
 * The share row that closes every article.
 *
 * Rendered by the build into the article footer, so it exists on every article
 * that is published from now on without anybody remembering to add it - which
 * was the requirement. There is nothing per-article to configure: the row is
 * built from the article's own canonical URL and title.
 *
 * Two decisions worth recording.
 *
 * No third-party share widgets. The usual ones (AddThis, ShareThis, the
 * official Facebook and X buttons) load script from several domains, identify
 * the reader on a page they have not interacted with, and would need a consent
 * banner to be lawful in Spain and Portugal. Each network publishes a plain
 * share URL that needs no script at all, so these are six anchors and one
 * button. The page ships no tracking, the row costs no request, and it works
 * with JavaScript switched off.
 *
 * No brand icons. A wrong SVG path is worse than a word - it renders as a
 * shape nobody recognises - and the alternative was linking a Font Awesome
 * brands subset from the pages whose loading performance matters most, for six
 * glyphs. The networks' names are what a reader is looking for anyway.
 *
 * `rel="noopener"` on every target, and `nofollow` because these are not
 * editorial endorsements of the networks. `target="_blank"` keeps the reader's
 * place in the article, which is the one thing a share link should not cost.
 */
import { escapeHtml } from './markdown.mjs';

/**
 * The endpoints. Each entry is given the encoded URL and title and returns the
 * address to open. They are ordered by how people in these three markets
 * actually share: WhatsApp first (it is the default in Spain, Portugal and
 * Brazil by a wide margin), the professional and general networks next, email
 * last but never dropped - it is still how an article reaches somebody who is
 * not on any network at all.
 */
const NETWORKS = [
  { id: 'whatsapp', name: 'WhatsApp', href: (url, title) => `https://wa.me/?text=${title}%20${url}` },
  { id: 'x', name: 'X', href: (url, title) => `https://twitter.com/intent/tweet?text=${title}&url=${url}` },
  { id: 'linkedin', name: 'LinkedIn', href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
  { id: 'facebook', name: 'Facebook', href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}` },
  { id: 'telegram', name: 'Telegram', href: (url, title) => `https://t.me/share/url?url=${url}&text=${title}` },
  { id: 'reddit', name: 'Reddit', href: (url, title) => `https://www.reddit.com/submit?url=${url}&title=${title}` }
];

/**
 * @param {object} options
 * @param {string} options.url    absolute canonical URL of the page
 * @param {string} options.title  the page's title, unescaped
 * @param {object} options.strings  shareTitle, shareOn, shareByEmail, shareCopy,
 *                                  shareCopied, shareEmailSubject
 */
export function shareRow({ url, title, strings }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = NETWORKS.map((network) => {
    // The visible text is the network's name; the accessible name says what
    // pressing it does, because "WhatsApp" on its own is a destination rather
    // than an action.
    const label = `${strings.shareOn} ${network.name}`;
    return `<li><a class="share-link" href="${network.href(encodedUrl, encodedTitle)}" `
      + `data-share="${network.id}" rel="noopener nofollow" target="_blank" `
      + `aria-label="${escapeHtml(label)}">${escapeHtml(network.name)}</a></li>`;
  }).join('');

  // mailto needs the subject and body encoded the same way, and the body
  // carries the title as well as the URL so the recipient sees what it is
  // before they click.
  const subject = encodeURIComponent(`${strings.shareEmailSubject}: ${title}`);
  const mail = `mailto:?subject=${subject}&body=${encodedTitle}%20${encodedUrl}`;

  // The copy button is the only part that needs script. It is rendered with
  // `hidden` and revealed by assets/js/share.js, so a reader without
  // JavaScript is not shown a button that cannot do anything.
  return `<section class="share-row" aria-labelledby="share-title">`
    + `<h2 class="share-title" id="share-title">${escapeHtml(strings.shareTitle)}</h2>`
    + `<ul class="share-links">${links}`
    + `<li><a class="share-link" href="${mail}" data-share="email" aria-label="${escapeHtml(strings.shareByEmail)}">Email</a></li>`
    + `<li><button class="share-copy" type="button" hidden data-share-copy `
    + `data-copy-url="${escapeHtml(url)}" data-label-copy="${escapeHtml(strings.shareCopy)}" `
    + `data-label-copied="${escapeHtml(strings.shareCopied)}">${escapeHtml(strings.shareCopy)}</button></li>`
    + `</ul></section>`;
}

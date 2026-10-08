// The card that points the rest of the site at the course page.
//
// It is rendered at the foot of every article, on the calculators, on the
// template landings and on the sessions and about pages - the places where a
// reader has just used one piece of what the course teaches in order and might
// want the rest. It links to the course page, never straight to the checkout:
// the page is where the language, the curriculum and the price are explained,
// and a buy button with none of that around it is a refund waiting to happen.
//
// Copy, price and coupon come from content/site/course.mjs, so switching the
// coupon off there removes its line here in the same build.
import { COURSE_COPY, COURSE_COUPON, COURSE_IMAGE, COURSE_PRICE } from '../content/site/course.mjs';
import { escapeHtml } from './markdown.mjs';
import { coursePath } from './site-routes.mjs';

/** The course image through the Image CDN, at one square size. */
export function courseImageAt(size, format = 'webp') {
  return `/.netlify/images?url=${COURSE_IMAGE}&amp;w=${size}&amp;h=${size}&amp;fit=cover&amp;fm=${format}`;
}

/**
 * `placement` is carried as a data attribute only, so a future analytics hook
 * can tell which card was followed without the markup changing shape.
 */
export function coursePromo(language, { placement = 'page' } = {}) {
  const copy = COURSE_COPY[language];
  if (!copy) throw new Error(`course-promo: no course copy for "${language}" in content/site/course.mjs.`);
  const coupon = COURSE_COUPON
    ? `<p class="course-promo-coupon">${escapeHtml(copy.promoCoupon(COURSE_COUPON.code, COURSE_COUPON.percent))}</p>`
    : '';
  return `
      <aside class="course-promo" aria-labelledby="course-promo-title-${placement}" data-course-promo="${placement}">
        <a class="course-promo-media" href="${coursePath(language)}" tabindex="-1" aria-hidden="true"><img src="${courseImageAt(240)}" alt="" width="240" height="240" loading="lazy" decoding="async" /></a>
        <div class="course-promo-copy">
          <p class="course-promo-eyebrow">${escapeHtml(copy.promoEyebrow)} · ${escapeHtml(COURSE_PRICE.display[language])}</p>
          <h2 id="course-promo-title-${placement}" class="course-promo-title">${escapeHtml(COURSE_COPY.es.name)}</h2>
          <p class="course-promo-body">${escapeHtml(copy.promoBody)}</p>
          ${coupon}
          <a class="button course-promo-action" href="${coursePath(language)}">${escapeHtml(copy.promoAction)}</a>
        </div>
      </aside>`;
}

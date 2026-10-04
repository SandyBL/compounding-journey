// Settings shared by every newsletter function.
//
// Everything that is likely to change without a code change - the sender, the
// daily allowance - is read from the environment, with the values the site was
// set up with as defaults. RESEND_API_KEY is the only one that has to be set.
export const LANGUAGES = ['en', 'es', 'pt'];

export const SITE_ORIGIN = 'https://compoundingjourney.com';

// The English Substack. Every email invites readers to it, and the site labels
// every link to it as Substack so it is never mistaken for this subscription.
export const SUBSTACK_URL = 'https://compoundingjourney.substack.com/';

export const CONTACT_EMAIL = 'compoundingjourney@gmail.com';

export function newsletterFrom() {
  return process.env.NEWSLETTER_FROM || 'Compounding Journey <newsletter@updates.compoundingjourney.com>';
}

export function newsletterReplyTo() {
  return process.env.NEWSLETTER_REPLY_TO || CONTACT_EMAIL;
}

// Resend's free plan allows 100 emails per UTC day. 90 leaves room for the
// odd email sent by hand from the Resend dashboard without the scheduled
// sends starting to fail.
export function dailyLimit() {
  const value = Number.parseInt(process.env.NEWSLETTER_DAILY_LIMIT ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : 90;
}

export function unsubscribeUrl(token) {
  return `${SITE_ORIGIN}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

// The name each language's segment is created under in Resend. Also how an
// existing segment is found again after its id is lost.
export function segmentName(language) {
  return `Compounding Journey · ${language.toUpperCase()} subscribers`;
}

// Articles older than this when the dispatcher first sees them are recorded
// but not broadcast: a republished archive piece is not news.
export const MAX_ARTICLE_AGE_DAYS = 7;

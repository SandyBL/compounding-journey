// Runs on every verified Netlify Forms submission, and acts on the
// "newsletter" form only - the one inside the Subscribe dialog every page
// carries (scripts/newsletter-subscribe.mjs).
//
// Three steps, each allowed to fail without losing the one before it:
//   1. the subscriber is saved in Netlify Database, which is the source of truth;
//   2. they are added to Resend as a contact, in the segment for their language;
//   3. the welcome email goes out.
// Anything that fails at 2 or 3 is still marked as not done in the database,
// and the hourly dispatcher (newsletter-dispatch.mjs) finishes it.
//
// Netlify only calls this for submissions that passed its spam filtering, and
// the form's honeypot field never reaches here.
import { randomBytes } from 'node:crypto';

import { LANGUAGES } from '../lib/newsletter/config.mjs';
import { hasApiKey } from '../lib/newsletter/resend.mjs';
import { db, ensureAccount, syncWithRecovery } from '../lib/newsletter/store.mjs';
import { sendWelcome } from '../lib/newsletter/welcome.mjs';

const FORM_NAME = 'newsletter';
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function clean(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export default async (request) => {
  let payload;
  try {
    ({ payload } = await request.json());
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const data = payload?.data ?? {};
  const formName = payload?.form_name ?? data['form-name'];
  if (formName !== FORM_NAME) return new Response('Ignored');

  const email = clean(data.email ?? payload?.email, 254).toLowerCase();
  const firstName = clean(data.first_name ?? data.name, 60);
  const language = LANGUAGES.includes(data.language) ? data.language : 'es';
  const placement = clean(data.placement, 40);

  if (!EMAIL.test(email)) {
    console.log('newsletter: ignored a submission without a valid email address.');
    return new Response('Ignored');
  }

  const database = db();
  const [previous] = await database.sql`
    SELECT id, status, language FROM newsletter_subscribers WHERE email = ${email}
  `;
  const token = randomBytes(24).toString('base64url');

  // A returning subscriber who had unsubscribed starts again: new subscription
  // date, and a new welcome. One who is already active keeps both, so
  // submitting the form twice cannot send two welcomes.
  const [subscriber] = await database.sql`
    INSERT INTO newsletter_subscribers (email, first_name, language, placement, unsubscribe_token)
    VALUES (${email}, ${firstName}, ${language}, ${placement}, ${token})
    ON CONFLICT (email) DO UPDATE SET
      first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE newsletter_subscribers.first_name END,
      language = EXCLUDED.language,
      placement = EXCLUDED.placement,
      subscribed_at = CASE WHEN newsletter_subscribers.status = 'active' THEN newsletter_subscribers.subscribed_at ELSE now() END,
      welcome_sent_at = CASE WHEN newsletter_subscribers.status = 'active' THEN newsletter_subscribers.welcome_sent_at ELSE NULL END,
      resend_synced_at = NULL,
      status = 'active',
      unsubscribed_at = NULL,
      updated_at = now()
    RETURNING *
  `;
  console.log(`newsletter: ${previous ? 'updated' : 'new'} subscriber #${subscriber.id} (${language}, from "${placement || 'unknown'}").`);

  if (!hasApiKey()) {
    console.error('newsletter: RESEND_API_KEY is not set; the subscriber is saved and will be synced once it is.');
    return new Response('Saved');
  }

  try {
    const account = await ensureAccount(database);
    await syncWithRecovery(database, account, subscriber, {
      resubscribe: true,
      previousLanguage: previous?.language ?? null
    });
  } catch (error) {
    console.error(`newsletter: could not sync subscriber #${subscriber.id} to Resend yet; the dispatcher will retry.`, error);
  }

  if (!subscriber.welcome_sent_at) {
    try {
      const result = await sendWelcome(database, subscriber);
      if (result === 'deferred') {
        console.log(`newsletter: today's sending allowance is used up; the welcome for #${subscriber.id} is queued.`);
      }
    } catch (error) {
      console.error(`newsletter: the welcome email for #${subscriber.id} failed; the dispatcher will retry.`, error);
    }
  }

  return new Response('OK');
};

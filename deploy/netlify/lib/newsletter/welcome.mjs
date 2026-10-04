// Sending the welcome email, shared by the subscription handler (which sends
// it the moment somebody subscribes) and the hourly dispatcher (which sends
// any that had to wait because the day's allowance was spent).
import { newsletterFrom, newsletterReplyTo, unsubscribeUrl } from './config.mjs';
import { welcomeEmail } from './emails.mjs';
import { popularArticles } from './feeds.mjs';
import { isQuotaError, resend } from './resend.mjs';
import { exhaustToday, release, reserve } from './store.mjs';

/**
 * Returns 'sent', 'deferred' (no allowance left today - the dispatcher will
 * retry) or throws. The idempotency key is per subscription, so a retry after
 * a timeout cannot deliver the same welcome twice.
 */
export async function sendWelcome(database, subscriber) {
  if (!(await reserve(database, 1))) return 'deferred';

  try {
    const articles = await popularArticles(database, subscriber.language);
    const unsubscribeHref = unsubscribeUrl(subscriber.unsubscribe_token);
    const email = welcomeEmail({
      language: subscriber.language,
      firstName: subscriber.first_name,
      articles,
      unsubscribeHref
    });

    await resend(
      'POST',
      '/emails',
      {
        from: newsletterFrom(),
        to: [subscriber.email],
        reply_to: newsletterReplyTo(),
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeHref}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        },
        tags: [
          { name: 'type', value: 'welcome' },
          { name: 'language', value: subscriber.language }
        ]
      },
      { idempotencyKey: `welcome-${subscriber.id}-${new Date(subscriber.subscribed_at).getTime()}` }
    );
  } catch (error) {
    await release(database, 1);
    if (isQuotaError(error)) {
      await exhaustToday(database);
      return 'deferred';
    }
    throw error;
  }

  await database.sql`
    UPDATE newsletter_subscribers SET welcome_sent_at = now(), updated_at = now() WHERE id = ${subscriber.id}
  `;
  return 'sent';
}

// The hourly newsletter run.
//
// Each run does, in this order and within one time budget:
//   1. checks the Resend account - a changed API key or a segment that no
//      longer exists is detected here, and the segments are re-created;
//   2. sends any welcome email that had to wait for the daily allowance;
//   3. reads the three RSS feeds and records any article it has not seen;
//   4. syncs subscribers Resend does not have yet (new, failed earlier, or
//      lost in an account switch) - for at most half the run, so a full
//      re-sync after an account switch spreads over a few hours instead of
//      holding up deliveries;
//   5. delivers new articles as one email per subscriber through Resend's
//      batch endpoint, at most the daily limit per UTC day, rolling the rest
//      over to the next day;
//   6. once a day, mirrors unsubscribes made from Resend's side back into the
//      database, and deletes the one-off segments older batches were sent to.
//
// Step 1 is allowed to fail like any other. It used to run before the others
// and outside their error handling, so when Resend refused a segment the plan
// had no room for, every run stopped there and no article was ever sent.
//
// Every step records its progress in Netlify Database before moving on, so a
// run cut off by the 30-second limit loses nothing: the next one resumes from
// the same place. And no subscriber can be sent the same article twice - see
// newsletter_deliveries in the migration.
import { LANGUAGES, MAX_ARTICLE_AGE_DAYS, newsletterFrom, newsletterReplyTo, unsubscribeUrl } from '../lib/newsletter/config.mjs';
import { articleEmail } from '../lib/newsletter/emails.mjs';
import { broadcastExtras } from '../lib/newsletter/extras.mjs';
import { readFeed } from '../lib/newsletter/feeds.mjs';
import { accountFingerprint, hasApiKey, isNotFound, isQuotaError, resend } from '../lib/newsletter/resend.mjs';
import {
  db,
  ensureAccount,
  exhaustToday,
  release,
  remainingToday,
  reserve,
  syncWithRecovery,
  writeState
} from '../lib/newsletter/store.mjs';
import { sendWelcome } from '../lib/newsletter/welcome.mjs';

const BUDGET_MS = 23_000;
const SYNC_BUDGET_MS = 11_000;

export default async () => {
  const started = Date.now();
  const deadline = started + BUDGET_MS;
  const outOfTime = () => Date.now() > deadline;
  const syncOutOfTime = () => Date.now() > started + SYNC_BUDGET_MS || outOfTime();

  if (!hasApiKey()) {
    console.error('newsletter-dispatch: RESEND_API_KEY is not set; nothing to do.');
    return;
  }

  const database = db();
  let account = null;

  const steps = [
    ['account', async () => { account = await ensureAccount(database, { verify: true }); }],
    ['welcome', () => sendQueuedWelcomes(database, outOfTime)],
    ['feeds', () => pollFeeds(database)],
    ['sync', async () => { if (account) account = await syncPending(database, account, syncOutOfTime); }],
    ['deliver', () => deliver(database, outOfTime)],
    ['unsubscribes', () => mirrorUnsubscribes(database, outOfTime)],
    ['cleanup', () => cleanupSegments(database, outOfTime)]
  ];

  for (const [name, step] of steps) {
    if (outOfTime()) {
      console.log(`newsletter-dispatch: out of time before "${name}"; the next run continues.`);
      break;
    }
    try {
      await step();
    } catch (error) {
      // One failing step should not stop the others: a feed that cannot be
      // read is no reason to hold back a queued welcome email.
      console.error(`newsletter-dispatch: step "${name}" failed.`, error);
    }
  }
};

async function syncPending(database, account, outOfTime) {
  const rows = await database.sql`
    SELECT * FROM newsletter_subscribers
    WHERE status = 'active'
      AND (resend_synced_at IS NULL OR resend_account IS DISTINCT FROM ${account.fingerprint})
    ORDER BY subscribed_at
    LIMIT 60
  `;
  let synced = 0;
  for (const subscriber of rows) {
    if (outOfTime()) break;
    try {
      account = await syncWithRecovery(database, account, subscriber);
      synced += 1;
    } catch (error) {
      console.error(`newsletter-dispatch: could not sync subscriber #${subscriber.id}.`, error);
    }
  }
  if (rows.length) console.log(`newsletter-dispatch: synced ${synced} of ${rows.length} pending subscriber(s) to Resend.`);
  return account;
}

async function sendQueuedWelcomes(database, outOfTime) {
  // A welcome that is a week late is no longer a welcome. Those are marked
  // done without sending; the subscriber still gets every new article.
  await database.sql`
    UPDATE newsletter_subscribers SET welcome_sent_at = now(), updated_at = now()
    WHERE status = 'active' AND welcome_sent_at IS NULL AND subscribed_at < now() - INTERVAL '7 days'
  `;
  const rows = await database.sql`
    SELECT * FROM newsletter_subscribers
    WHERE status = 'active' AND welcome_sent_at IS NULL
    ORDER BY subscribed_at
    LIMIT 30
  `;
  for (const subscriber of rows) {
    if (outOfTime()) return;
    const result = await sendWelcome(database, subscriber).catch((error) => {
      console.error(`newsletter-dispatch: welcome for #${subscriber.id} failed.`, error);
      return 'failed';
    });
    if (result === 'deferred') return;
  }
}

async function pollFeeds(database) {
  for (const language of LANGUAGES) {
    let items;
    try {
      items = await readFeed(language);
    } catch (error) {
      console.error(`newsletter-dispatch: could not read the ${language} feed.`, error);
      continue;
    }
    if (items.length === 0) continue;

    // The first time a feed is read, what is already in it is the archive, not
    // news: it is recorded as the baseline and never sent. The archive is what
    // was published before the first reader subscribed - not everything the
    // feed holds - because the first read can come days after the first
    // sign-up, and an article published in between is news to that reader.
    // The feed dates articles to the day, so the comparison is by day too.
    const [{ count }] = await database.sql`
      SELECT count(*)::int AS count FROM newsletter_articles WHERE language = ${language}
    `;
    const baseline = Number(count) === 0;
    const [{ launched }] = baseline
      ? await database.sql`SELECT date_trunc('day', min(subscribed_at)) AS launched FROM newsletter_subscribers`
      : [{ launched: null }];
    const launchedAt = launched ? new Date(launched).getTime() : Infinity;
    const cutoff = Date.now() - MAX_ARTICLE_AGE_DAYS * 86_400_000;

    let added = 0;
    for (const item of items) {
      const published = item.publishedAt?.getTime() ?? null;
      const status = baseline && (published === null || published < launchedAt)
        ? 'baseline'
        : published !== null && published < cutoff
          ? 'skipped'
          : 'pending';
      const inserted = await database.sql`
        INSERT INTO newsletter_articles (language, guid, title, summary, link, published_at, status)
        VALUES (${language}, ${item.guid}, ${item.title}, ${item.summary}, ${item.link}, ${item.publishedAt}, ${status})
        ON CONFLICT (language, guid) DO NOTHING
        RETURNING id
      `;
      if (inserted.length && status === 'pending') {
        added += 1;
        console.log(`newsletter-dispatch: new ${language} article queued for delivery: "${item.title}".`);
      }
    }
    if (baseline) console.log(`newsletter-dispatch: recorded ${items.length - added} existing ${language} article(s) as the baseline.`);
    else if (added === 0) console.log(`newsletter-dispatch: no new ${language} articles.`);
  }
}

// ---------------------------------------------------------------------------
// Delivery. A batch is the share of one article that fits in the day's
// allowance, sent as one email per subscriber through Resend's batch endpoint.
// Articles used to go out as Resend Broadcasts, each to a segment of its own,
// but the free plan allows three segments in all and a Broadcast cannot be
// sent without one - so no article ever went out. Individual emails need no
// segment, and each one carries the subscriber's own unsubscribe link.

// Resend accepts at most 100 emails per batch request.
const EMAILS_PER_REQUEST = 100;

/** Subscribers an article is meant for and has not been assigned to yet. */
async function undelivered(database, article, limit) {
  return database.sql`
    SELECT s.id FROM newsletter_subscribers s
    WHERE s.language = ${article.language}
      AND s.status = 'active'
      AND s.subscribed_at <= ${article.discovered_at}
      AND NOT EXISTS (
        SELECT 1 FROM newsletter_deliveries d WHERE d.article_id = ${article.id} AND d.subscriber_id = s.id
      )
    ORDER BY s.subscribed_at
    LIMIT ${limit}
  `;
}

async function finishIfDone(database, article) {
  const left = await undelivered(database, article, 1);
  if (left.length) return false;
  await database.sql`
    UPDATE newsletter_articles SET status = 'sent', completed_at = now() WHERE id = ${article.id}
  `;
  console.log(`newsletter-dispatch: "${article.title}" (${article.language}) has reached every subscriber.`);
  return true;
}

async function dropBatch(database, batch, reason) {
  console.log(`newsletter-dispatch: abandoning batch #${batch.id} (${reason}); its subscribers return to the queue.`);
  await database.sql`DELETE FROM newsletter_batches WHERE id = ${batch.id}`;
}

async function deliver(database, outOfTime) {
  // A batch left in 'sending' means a run was cut off between asking Resend
  // to send it and recording that it had. It may well have gone out, so it is
  // counted as sent: a missed email is better than a duplicate.
  await database.sql`
    UPDATE newsletter_batches SET status = 'sent', sent_at = COALESCE(sent_at, now())
    WHERE status = 'sending' AND created_at < now() - INTERVAL '5 minutes'
  `;

  while (!outOfTime()) {
    let [batch] = await database.sql`
      SELECT * FROM newsletter_batches WHERE status = 'preparing' ORDER BY id LIMIT 1
    `;

    let article;
    if (batch) {
      [article] = await database.sql`SELECT * FROM newsletter_articles WHERE id = ${batch.article_id}`;
    } else {
      [article] = await database.sql`
        SELECT * FROM newsletter_articles WHERE status = 'pending' ORDER BY discovered_at, id LIMIT 1
      `;
      if (!article) return;
      if (await finishIfDone(database, article)) continue;

      const allowance = await remainingToday(database);
      if (allowance <= 0) {
        console.log('newsletter-dispatch: the daily allowance is used up; remaining deliveries roll over to tomorrow.');
        return;
      }

      [batch] = await database.sql`
        INSERT INTO newsletter_batches (article_id, resend_account)
        VALUES (${article.id}, ${accountFingerprint()})
        RETURNING *
      `;
      const recipients = await undelivered(database, article, allowance);
      for (const { id } of recipients) {
        await database.sql`
          INSERT INTO newsletter_deliveries (article_id, subscriber_id, batch_id)
          VALUES (${article.id}, ${id}, ${batch.id})
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(`newsletter-dispatch: batch #${batch.id} for "${article.title}" (${article.language}): ${recipients.length} recipient(s).`);
    }

    if (!(await sendBatch(database, batch, article))) return;
    await finishIfDone(database, article);
  }
}

function articleMessage(article, member, extras) {
  const unsubscribeHref = unsubscribeUrl(member.unsubscribe_token);
  const email = articleEmail({
    language: article.language,
    article,
    firstName: member.first_name,
    unsubscribeHref,
    ...extras
  });
  return {
    from: newsletterFrom(),
    to: [member.email],
    reply_to: newsletterReplyTo(),
    subject: email.subject,
    html: email.html,
    text: email.text,
    headers: {
      'List-Unsubscribe': `<${unsubscribeHref}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    tags: [
      { name: 'type', value: 'article' },
      { name: 'language', value: article.language },
      { name: 'article', value: String(article.id) }
    ]
  };
}

async function sendBatch(database, batch, article) {
  // Anyone who unsubscribed after the batch was built leaves it.
  const members = [];
  const rows = await database.sql`
    SELECT s.id, s.email, s.first_name, s.status, s.unsubscribe_token FROM newsletter_deliveries d
    JOIN newsletter_subscribers s ON s.id = d.subscriber_id
    WHERE d.batch_id = ${batch.id}
    ORDER BY s.subscribed_at, s.id
  `;
  for (const row of rows) {
    if (row.status === 'active') members.push(row);
    else await database.sql`DELETE FROM newsletter_deliveries WHERE batch_id = ${batch.id} AND subscriber_id = ${row.id}`;
  }
  if (members.length === 0) {
    await dropBatch(database, batch, 'nobody left to send it to');
    return true;
  }

  // The related article and glossary term are looked up before anything is
  // reserved or marked as sending: the lookups are bounded by a timeout and
  // never throw, but a run cut off while making them should leave the batch
  // 'preparing' with nothing spent, for the next run to pick up.
  const extras = await broadcastExtras(article);

  // The allowance was checked when the batch was built, but a welcome email
  // may have spent some of it since. If it no longer fits, the batch waits
  // for tomorrow's allowance, already built.
  if (!(await reserve(database, members.length))) {
    console.log(`newsletter-dispatch: batch #${batch.id} (${members.length}) waits for tomorrow's allowance.`);
    return false;
  }

  await database.sql`UPDATE newsletter_batches SET status = 'sending', size = ${members.length} WHERE id = ${batch.id}`;

  // The idempotency key is per batch and chunk, so a request retried after a
  // timeout cannot deliver the same chunk twice.
  let sent = 0;
  try {
    for (let start = 0; start < members.length; start += EMAILS_PER_REQUEST) {
      const chunk = members.slice(start, start + EMAILS_PER_REQUEST);
      await resend('POST', '/emails/batch', chunk.map((member) => articleMessage(article, member, extras)), {
        idempotencyKey: `article-batch-${batch.id}-${start}`
      });
      sent += chunk.length;
    }
  } catch (error) {
    // Whoever was not reached goes back to the queue, and their share of the
    // allowance is given back.
    await release(database, members.length - sent);
    if (sent === 0) {
      await dropBatch(database, batch, `Resend refused it: ${error.message}`);
    } else {
      for (const member of members.slice(sent)) {
        await database.sql`DELETE FROM newsletter_deliveries WHERE batch_id = ${batch.id} AND subscriber_id = ${member.id}`;
      }
      await database.sql`
        UPDATE newsletter_batches SET status = 'sent', size = ${sent}, sent_at = now() WHERE id = ${batch.id}
      `;
    }
    if (isQuotaError(error)) {
      await exhaustToday(database);
      console.log(`newsletter-dispatch: Resend reports the quota spent; the rest of "${article.title}" goes tomorrow.`);
      return false;
    }
    throw error;
  }

  await database.sql`UPDATE newsletter_deliveries SET added_at = now() WHERE batch_id = ${batch.id}`;
  await database.sql`
    UPDATE newsletter_batches SET status = 'sent', sent_at = now() WHERE id = ${batch.id}
  `;
  console.log(`newsletter-dispatch: batch #${batch.id} sent to ${sent} subscriber(s) for "${article.title}".`);
  return true;
}

// ---------------------------------------------------------------------------
// Daily housekeeping.

async function dueToday(database, key) {
  const [row] = await database.sql`
    SELECT value FROM newsletter_resend_state WHERE key = ${key}
  `;
  return !row || Date.now() - Date.parse(row.value) > 20 * 3_600_000;
}

/**
 * Broadcasts carry Resend's own unsubscribe link, which marks the contact
 * unsubscribed in Resend. Copying that flag back here once a day is what keeps
 * those readers out of future batches and out of any re-sync to a new account.
 */
async function mirrorUnsubscribes(database, outOfTime) {
  if (!(await dueToday(database, 'unsubscribes_mirrored_at'))) return;

  let after = null;
  let marked = 0;
  for (let page = 0; page < 50; page += 1) {
    if (outOfTime()) return;
    const query = after ? `?limit=100&after=${encodeURIComponent(after)}` : '?limit=100';
    const list = await resend('GET', `/contacts${query}`);
    const contacts = list?.data ?? [];
    for (const contact of contacts) {
      if (!contact.unsubscribed || !contact.email) continue;
      const updated = await database.sql`
        UPDATE newsletter_subscribers
        SET status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
        WHERE email = ${String(contact.email).toLowerCase()} AND status = 'active'
        RETURNING id
      `;
      marked += updated.length;
    }
    if (!list?.has_more || contacts.length === 0) break;
    after = contacts[contacts.length - 1].id;
  }
  await writeState(database, 'unsubscribes_mirrored_at', new Date().toISOString());
  if (marked) console.log(`newsletter-dispatch: ${marked} subscriber(s) unsubscribed through Resend; mirrored.`);
}

/**
 * Batches used to be Broadcasts, each to a single-use segment of its own. Two
 * days after sending, those segments are deleted. Batches sent as individual
 * emails have no segment and are not picked up here.
 */
async function cleanupSegments(database, outOfTime) {
  const rows = await database.sql`
    SELECT id, segment_id FROM newsletter_batches
    WHERE status = 'sent' AND segment_deleted_at IS NULL AND segment_id IS NOT NULL
      AND resend_account = ${accountFingerprint()}
      AND sent_at < now() - INTERVAL '2 days'
    ORDER BY id LIMIT 10
  `;
  for (const row of rows) {
    if (outOfTime()) return;
    try {
      await resend('DELETE', `/segments/${row.segment_id}`);
    } catch (error) {
      if (!isNotFound(error)) {
        console.error(`newsletter-dispatch: could not delete segment ${row.segment_id}.`, error);
        continue;
      }
    }
    await database.sql`UPDATE newsletter_batches SET segment_deleted_at = now() WHERE id = ${row.id}`;
  }
}

export const config = {
  schedule: '@hourly'
};

// The database side of the newsletter, and the part that keeps Resend in step
// with it.
//
// The subscriber table is the source of truth and Resend is a copy. That is
// what makes a Resend account switch survivable: when the API key changes, or
// a segment the database remembers no longer exists, the segments are created
// again and every active subscriber is marked unsynced, and the next runs push
// them all back - without a single subscriber having to sign up twice.
import { getDatabase } from '@netlify/database';

import { LANGUAGES, dailyLimit, segmentName } from './config.mjs';
import { accountFingerprint, isNotFound, resend, ResendError } from './resend.mjs';

export function db() {
  return getDatabase();
}

async function readState(database) {
  const rows = await database.sql`SELECT key, value FROM newsletter_resend_state`;
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function writeState(database, key, value) {
  await database.sql`
    INSERT INTO newsletter_resend_state (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

async function clearState(database, key) {
  await database.sql`DELETE FROM newsletter_resend_state WHERE key = ${key}`;
}

/**
 * Finds a segment by its name, so a segment that exists in Resend but whose id
 * the database lost (a state reset, a restored backup) is reused rather than
 * duplicated.
 */
async function findSegmentByName(name) {
  const list = await resend('GET', '/segments');
  return (list?.data ?? []).find((segment) => segment.name === name)?.id ?? null;
}

async function createLanguageSegment(database, language) {
  const name = segmentName(language);
  const id = (await findSegmentByName(name)) ?? (await resend('POST', '/segments', { name })).id;
  await writeState(database, `segment_${language}`, id);
  // Whatever was in the old segment is not in this one. Everybody in this
  // language is synced again, which adds them to it.
  await database.sql`
    UPDATE newsletter_subscribers SET resend_synced_at = NULL, updated_at = now()
    WHERE language = ${language} AND status = 'active'
  `;
  console.log(`newsletter: using Resend segment ${id} for "${language}"; its subscribers are queued for sync.`);
  return id;
}

/**
 * The Resend account currently in use, with one segment id per language.
 *
 * `verify` asks Resend whether each remembered segment still exists. The
 * hourly dispatcher verifies; the subscription handler does not, so a new
 * subscriber costs as few requests as possible - and if a segment it uses
 * turns out to be gone, it calls `forgetSegment` and tries again.
 */
export async function ensureAccount(database, { verify = false } = {}) {
  const fingerprint = accountFingerprint();
  let state = await readState(database);

  if (state.account !== fingerprint) {
    if (state.account) {
      console.log('newsletter: the Resend API key has changed. Rebuilding segments and re-syncing subscribers.');
    }
    await database.sql`DELETE FROM newsletter_resend_state`;
    // A batch half-built in the old account cannot be finished in the new one.
    // Dropping it returns its subscribers to the queue (deliveries cascade).
    await database.sql`
      DELETE FROM newsletter_batches
      WHERE status = 'preparing' AND resend_account <> ${fingerprint}
    `;
    await writeState(database, 'account', fingerprint);
    state = { account: fingerprint };
  }

  const segments = {};
  for (const language of LANGUAGES) {
    let id = state[`segment_${language}`] ?? null;
    if (id && verify) {
      try {
        await resend('GET', `/segments/${id}`);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        console.log(`newsletter: segment ${id} for "${language}" was not found in Resend. Re-creating it.`);
        id = null;
      }
    }
    segments[language] = id ?? (await createLanguageSegment(database, language));
  }
  return { fingerprint, segments };
}

export async function forgetSegment(database, language) {
  await clearState(database, `segment_${language}`);
}

/**
 * Creates or updates one subscriber's contact in Resend and puts it in the
 * segment for their language.
 *
 * `resubscribe` is set when the subscriber has just submitted the form. Only
 * then is the contact's unsubscribed flag cleared: a background re-sync must
 * never undo an unsubscribe made from Resend's side.
 */
export async function syncSubscriber(database, account, subscriber, { resubscribe = false, previousLanguage = null } = {}) {
  const segmentId = account.segments[subscriber.language];
  const address = encodeURIComponent(subscriber.email);
  let contactId = null;

  const updateExisting = async () => {
    const body = { first_name: subscriber.first_name };
    if (resubscribe) body.unsubscribed = false;
    const updated = await resend('PATCH', `/contacts/${address}`, body);
    await resend('POST', `/contacts/${address}/segments/${segmentId}`);
    return updated?.id ?? null;
  };

  const sameAccount = subscriber.resend_account === account.fingerprint && subscriber.resend_contact_id;
  if (sameAccount) {
    contactId = await updateExisting();
  } else {
    try {
      const created = await resend('POST', '/contacts', {
        email: subscriber.email,
        first_name: subscriber.first_name,
        unsubscribed: false,
        segments: [{ id: segmentId }]
      });
      contactId = created?.id ?? null;
    } catch (error) {
      // 401/403 are a key problem and 404 a missing segment; neither is fixed
      // by treating the contact as existing. Anything else from a create is the
      // contact already being there.
      if (!(error instanceof ResendError) || [0, 401, 403, 404, 429].includes(error.status) || error.status >= 500) throw error;
      contactId = await updateExisting();
    }
  }

  if (previousLanguage && previousLanguage !== subscriber.language && account.segments[previousLanguage]) {
    await resend('DELETE', `/contacts/${address}/segments/${account.segments[previousLanguage]}`).catch(() => {});
  }

  await database.sql`
    UPDATE newsletter_subscribers
    SET resend_account = ${account.fingerprint},
        resend_contact_id = COALESCE(${contactId}, resend_contact_id),
        resend_synced_at = now(),
        updated_at = now()
    WHERE id = ${subscriber.id}
  `;
}

/**
 * Syncs one subscriber, recovering once from a segment that has disappeared
 * since the account was last checked.
 */
export async function syncWithRecovery(database, account, subscriber, options) {
  try {
    await syncSubscriber(database, account, subscriber, options);
    return account;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await forgetSegment(database, subscriber.language);
    const fresh = await ensureAccount(database, { verify: true });
    await syncSubscriber(database, fresh, subscriber, options);
    return fresh;
  }
}

// ---------------------------------------------------------------------------
// The daily allowance. One row per UTC day, because that is the day Resend's
// free plan counts. Sends are reserved before they are made.

export async function remainingToday(database) {
  const rows = await database.sql`
    SELECT sent FROM newsletter_daily_usage WHERE day = (now() AT TIME ZONE 'UTC')::date
  `;
  return Math.max(0, dailyLimit() - Number(rows[0]?.sent ?? 0));
}

export async function reserve(database, count) {
  if (count <= 0) return true;
  await database.sql`
    INSERT INTO newsletter_daily_usage (day, sent) VALUES ((now() AT TIME ZONE 'UTC')::date, 0)
    ON CONFLICT (day) DO NOTHING
  `;
  const rows = await database.sql`
    UPDATE newsletter_daily_usage SET sent = sent + ${count}
    WHERE day = (now() AT TIME ZONE 'UTC')::date AND sent + ${count} <= ${dailyLimit()}
    RETURNING sent
  `;
  return rows.length > 0;
}

export async function release(database, count) {
  if (count <= 0) return;
  await database.sql`
    UPDATE newsletter_daily_usage SET sent = GREATEST(sent - ${count}, 0)
    WHERE day = (now() AT TIME ZONE 'UTC')::date
  `;
}

/** Resend said the quota is spent, whatever the count here says. Stop for today. */
export async function exhaustToday(database) {
  await database.sql`
    INSERT INTO newsletter_daily_usage (day, sent) VALUES ((now() AT TIME ZONE 'UTC')::date, ${dailyLimit()})
    ON CONFLICT (day) DO UPDATE SET sent = GREATEST(newsletter_daily_usage.sent, ${dailyLimit()})
  `;
}

-- The on-site email subscription: who subscribed, what has been sent to whom,
-- and how much of Resend's daily allowance has been used.
--
-- The site used to hand every sign-up to a third party (Substack in English,
-- MailerLite in Spanish and Portuguese) and stored nothing. The subscription
-- form in the "Subscribe" dialog now posts to Netlify Forms, and
-- netlify/functions/submission-created.mjs copies each verified submission
-- here. This table, not Resend, is the source of truth: a Resend account can be
-- replaced, and everything in it can be rebuilt from these rows (see
-- newsletter_resend_state below).
--
-- `unsubscribe_token` is what the link in every welcome email carries. It is a
-- random value rather than anything derived from the address, so a link cannot
-- be forged for somebody else's address.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  placement TEXT NOT NULL DEFAULT '',
  unsubscribe_token TEXT NOT NULL UNIQUE,
  -- Which Resend account this row was last synced to (a fingerprint of the API
  -- key, never the key) and the contact id it was given there. A row whose
  -- fingerprint differs from the current account is a row to sync again.
  resend_account TEXT,
  resend_contact_id TEXT,
  resend_synced_at TIMESTAMPTZ,
  welcome_sent_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_language_status_idx
  ON newsletter_subscribers (language, status, subscribed_at);

-- Every article the hourly dispatcher has seen in a language's RSS feed.
--
-- `status` is the lifecycle: 'baseline' for the articles that were already in
-- the feed the first time it was read (they are never broadcast - nobody
-- subscribed to receive the archive), 'pending' for a new article still being
-- delivered, 'sent' once every subscriber it was meant for has had a batch, and
-- 'skipped' for anything too old to be news by the time it was found.
CREATE TABLE IF NOT EXISTS newsletter_articles (
  id BIGSERIAL PRIMARY KEY,
  language TEXT NOT NULL,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  UNIQUE (language, guid)
);

CREATE INDEX IF NOT EXISTS newsletter_articles_status_idx
  ON newsletter_articles (status, discovered_at);

-- One Resend Broadcast per row. Resend sends a broadcast to a whole segment and
-- has no way to cap it, so each day's share of an article (at most the daily
-- limit) is put into a segment of its own and broadcast to that.
--
-- 'preparing' means the segment exists and contacts are still being added to
-- it - a run that hits its time budget leaves it here and the next run carries
-- on. 'sent' means the broadcast was created with send: true.
CREATE TABLE IF NOT EXISTS newsletter_batches (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES newsletter_articles (id) ON DELETE CASCADE,
  resend_account TEXT NOT NULL,
  segment_id TEXT,
  broadcast_id TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'preparing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  segment_deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS newsletter_batches_status_idx
  ON newsletter_batches (status, created_at);

-- Who an article has been (or is being) delivered to. The primary key is what
-- makes a duplicate impossible: a subscriber can be assigned to one batch per
-- article and never a second. A batch that fails before it is sent deletes its
-- rows, which is what returns those subscribers to the queue.
CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  article_id BIGINT NOT NULL REFERENCES newsletter_articles (id) ON DELETE CASCADE,
  subscriber_id BIGINT NOT NULL REFERENCES newsletter_subscribers (id) ON DELETE CASCADE,
  batch_id BIGINT NOT NULL REFERENCES newsletter_batches (id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ,
  PRIMARY KEY (article_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS newsletter_deliveries_batch_idx
  ON newsletter_deliveries (batch_id);

-- Emails sent per UTC day, welcome emails and broadcast batches together.
-- Resend's free plan counts a UTC calendar day, so this does too. Sends are
-- reserved here before they are made, with a conditional update, so two
-- functions running at once cannot both spend the last of the allowance.
CREATE TABLE IF NOT EXISTS newsletter_daily_usage (
  day DATE PRIMARY KEY,
  sent INTEGER NOT NULL DEFAULT 0
);

-- Small key/value state about the Resend account in use: its fingerprint, the
-- id of each language's segment, and when unsubscribes were last mirrored back.
-- When the API key changes the fingerprint stops matching and everything here
-- is rebuilt against the new account.
CREATE TABLE IF NOT EXISTS newsletter_resend_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

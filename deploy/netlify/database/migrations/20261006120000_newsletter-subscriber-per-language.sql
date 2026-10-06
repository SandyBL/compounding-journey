-- One subscription per address *and language*, instead of one per address.
--
-- The first migration made `email` unique, so a reader who subscribed from
-- the English, Spanish and Portuguese pages ended up with a single row whose
-- language was whichever form they submitted last - and received only that
-- language. Each language is now a subscription of its own, with its own
-- welcome email, its own unsubscribe link and its own place in the delivery
-- queue. Existing rows are untouched: each keeps the language it has.
ALTER TABLE newsletter_subscribers DROP CONSTRAINT IF EXISTS newsletter_subscribers_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_language_key
  ON newsletter_subscribers (email, language);

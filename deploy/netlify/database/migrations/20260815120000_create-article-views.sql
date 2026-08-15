-- The counter behind the featured card on the journal index.
--
-- The card used to name one article in the markup of each /{lang}/blog/
-- index. Nothing recomputed it, so it kept pointing at an essay from July long
-- after newer and better read ones were published. It is now chosen by the
-- build from this table, which is the only place the site records how often an
-- article has actually been read.
--
-- One row per translation, keyed by the pair that identifies a page. Reads are
-- a full scan of a table with as many rows as the journal has translations -
-- fifteen today - so the primary key is all the indexing it needs.
--
-- Nothing here identifies a reader: no address, no session, no per visit row.
-- The endpoint that writes it (netlify/functions/article-view.mjs) adds one to
-- a total and stores nothing else, which is what keeps a popularity signal from
-- turning into an analytics record.
CREATE TABLE IF NOT EXISTS article_views (
  language TEXT NOT NULL,
  slug TEXT NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (language, slug)
);

-- Monthly buckets for the same counter article_views already keeps.
--
-- article_views holds one lifetime total per translation. That is the right
-- signal for "the article this journal is known for", and the wrong one for
-- "what people are reading now": an essay published in February accumulates for
-- as long as it exists, so the all-time ranking is partly a ranking of age. The
-- featured card still uses the lifetime total, deliberately. This table is what
-- lets the index also show a short list of what is being read this month, and
-- what lets the build report where a translation is pulling ahead of its
-- siblings while that is still worth acting on.
--
-- One row per translation per month. `month` is the first day of the month, so
-- the key is exact rather than a range, and a month with no reads simply has no
-- rows rather than a row of zeroes.
--
-- Nothing here identifies a reader either: the endpoint adds one to a total in
-- both tables and stores nothing else. A bucket is coarser than a timestamp on
-- purpose - it answers "recently" without recording when anybody read anything.
CREATE TABLE IF NOT EXISTS article_views_monthly (
  language TEXT NOT NULL,
  slug TEXT NOT NULL,
  month DATE NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (language, slug, month)
);

-- The build reads one month at a time across every article, so month leads the
-- index. The primary key cannot serve that query: it is ordered by language
-- first, which is the column this read does not filter on.
CREATE INDEX IF NOT EXISTS article_views_monthly_month_idx
  ON article_views_monthly (month);

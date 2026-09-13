-- The counters behind the three Excel templates.
--
-- The template pages have been the site's best answer to "plantilla
-- presupuesto personal excel gratis" since they were published, and nothing
-- recorded whether anybody ever pressed the download button on one. That was
-- fine while the button was the whole page. It stopped being fine the moment a
-- panel was added after the download offering a next step, because the only
-- honest way to decide whether that panel earns its place is to know how often
-- it is shown and how often it is taken - and neither number existed.
--
-- So two counters per translation rather than one:
--
--   downloads    how often the workbook was fetched from its page. Also the
--                number of times the panel was shown, because the panel is
--                revealed by the same click.
--   next_clicks  how often somebody pressed one of the panel's two actions.
--
-- next_clicks over downloads is the whole measurement. A panel nobody presses
-- is a panel to rewrite or remove, and without the denominator the click count
-- on its own says nothing.
--
-- `template` is the stable id from content/site/templates.mjs, not the
-- localized slug: the slugs differ per language by design, so keying on them
-- would make "how is the budget template doing" a question needing a
-- translation table to answer. Keyed with `language` alongside it, the three
-- editions are both separable and summable.
--
-- Nothing here identifies anybody. There is no address, no session, no
-- per-visit row and no timestamp finer than a month - the same shape as
-- article_views, and for the same reason: this is meant to measure a page, and
-- a counter is the most that can be kept without starting to measure people.
CREATE TABLE IF NOT EXISTS template_downloads (
  language TEXT NOT NULL,
  template TEXT NOT NULL,
  downloads BIGINT NOT NULL DEFAULT 0,
  next_clicks BIGINT NOT NULL DEFAULT 0,
  first_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (language, template)
);

-- Month buckets, for the same reason article_views_monthly exists: a lifetime
-- total is partly a ranking of age, and the question this table was built to
-- answer - did the panel change anything - is a question about a before and an
-- after. Without the buckets the only way to see a change is to write the
-- total down by hand and wait.
--
-- One row per translation per month, `month` being the first day of it, so a
-- month with no downloads has no row rather than a row of zeroes.
CREATE TABLE IF NOT EXISTS template_downloads_monthly (
  language TEXT NOT NULL,
  template TEXT NOT NULL,
  month DATE NOT NULL,
  downloads BIGINT NOT NULL DEFAULT 0,
  next_clicks BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (language, template, month)
);

-- Reads are "one month, every template", which the primary key cannot serve:
-- it is ordered by language first, and that is the column such a read does not
-- filter on.
CREATE INDEX IF NOT EXISTS template_downloads_monthly_month_idx
  ON template_downloads_monthly (month);

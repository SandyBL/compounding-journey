-- The scores behind the three simulator leaderboards.
--
-- The boards existed before this table and were not shared: the Simulator Hub
-- and the Passive Income Engine wrote their entries to localStorage, and the
-- Monte Carlo FIRE board was a plain array that a reload emptied. Each of the
-- three was seeded with invented names so it would not look empty, which is
-- what made the illusion hold - a visitor saw a ranking, submitted a score,
-- watched it slot in above "Marcus Vance", and was in fact alone in a table
-- nobody else could ever read. This table is what makes one board that every
-- visitor sees, in every language, and what a score submitted from any of the
-- three tools is compared against.
--
-- One row per submitted run rather than one per player. There is no account
-- behind a name (the boards take a typed display name, which is not an
-- identity), so a row cannot be updated in place without letting one name
-- overwrite another's score. Keeping every run also means the board is a log:
-- a better attempt ranks above a worse one instead of erasing it.
--
-- `simulator` and `board` are the addressing pair the read filters on.
-- `simulator` is the tool's template name, and `board` is the sub-ranking
-- within it - the scenario preset in Monte Carlo FIRE, and the single value
-- 'ALL' in the two tools that rank every run together. Both are canonical
-- ASCII keys chosen by netlify/functions/simulator-leaderboard.mjs and never
-- translated strings: the presets are named differently in each of the three
-- languages, and keying on the display name would have split one board into
-- three that could not see each other.
--
-- `score` is the one value the ranking is by, and it is stored as the tool
-- measures it rather than normalised to "higher is better" - months to freedom
-- in the Passive Income Engine really is a value where lower wins. Which way a
-- board sorts is declared per simulator in the function, so the number in this
-- column still means what its own tool says it means. `tiebreak` settles equal
-- scores, and `details` carries the remaining columns a board displays but does
-- not rank on, which differ per tool and are validated against a per-simulator
-- allow-list before they are written.
--
-- `player_name` is typed by whoever submits, so it is the one untrusted string
-- here. The function strips markup characters and control characters and caps
-- the length before the insert, and the pages escape it again when they render.
-- `language` records which translation a run was submitted from. It is not part
-- of the key and nothing filters on it: the board is deliberately global, so a
-- score set on /pt/ ranks against one set on /en/.
CREATE TABLE IF NOT EXISTS simulator_scores (
  id BIGSERIAL PRIMARY KEY,
  simulator TEXT NOT NULL,
  board TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  tiebreak DOUBLE PRECISION NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every read is "the top N of one board", so the two equality columns lead and
-- the ranking column follows. `score` is listed without a direction because
-- both are needed: three of the four boards rank it descending and the Passive
-- Income Engine ranks it ascending, and an index can be scanned either way.
-- `tiebreak` is left to the sort - it only ever orders rows already equal on
-- score, of which there are few.
CREATE INDEX IF NOT EXISTS simulator_scores_board_score_idx
  ON simulator_scores (simulator, board, score);

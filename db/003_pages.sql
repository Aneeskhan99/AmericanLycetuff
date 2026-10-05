-- ===========================================================================
-- 003 — Editable page content (Admin → Pages), same model as the RTI admin.
--
-- The copy of every page lives in src/content/*.ts as the default. What the admin
-- changes is stored as a PATCH: field path -> value, e.g. {"hero.title": "…"}.
-- The site merges the published patch over the defaults at build/revalidate time,
-- so a field nobody touched keeps following the code.
--   draft      what the editor saves and what Preview shows (Next draft mode)
--   published  what visitors see
-- ===========================================================================
CREATE TABLE IF NOT EXISTS page_content (
  key               text PRIMARY KEY,
  draft             jsonb,
  published         jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_updated_at  timestamptz,
  draft_updated_by  bigint REFERENCES users(id) ON DELETE SET NULL,
  published_at      timestamptz,
  published_by      bigint REFERENCES users(id) ON DELETE SET NULL
);

-- Every publish, so an earlier version can be restored.
CREATE TABLE IF NOT EXISTS page_content_revisions (
  id            bigserial PRIMARY KEY,
  key           text NOT NULL,
  content       jsonb NOT NULL,
  changed       jsonb NOT NULL DEFAULT '[]'::jsonb,   -- list of field paths changed in this publish
  note          text NOT NULL DEFAULT '',
  published_at  timestamptz NOT NULL DEFAULT now(),
  published_by  bigint REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS page_content_revisions_key_idx ON page_content_revisions (key, published_at DESC);

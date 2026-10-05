-- ===========================================================================
-- 031 — News & Blog: per-post alt text for the featured image (falls back to the
-- media library's alt text when empty).
-- ===========================================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_alt text NOT NULL DEFAULT '';

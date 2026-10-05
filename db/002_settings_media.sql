-- ===========================================================================
-- 002 — Site settings, campuses, media library.
-- ===========================================================================

-- Key/value settings (school details, social links, office hours, analytics IDs,
-- notification emails per form). Defaults live in src/lib/settings.ts; a row here
-- overrides that key. SMTP credentials are NEVER stored here (environment only).
CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  bigint REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS campuses (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  address     text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  map_url     text NOT NULL DEFAULT '',
  sort        int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO campuses (name, slug, address, phone, email, sort)
VALUES ('Swabi Campus', 'swabi', 'Sector-E, Shahmansoor Township Swabi, Khyber Pakhtunkhwa', '0938-320011', 'info@alsswabi.edu.pk', 0)
ON CONFLICT (slug) DO NOTHING;

-- Uploaded files. Files live in MEDIA_DIR (outside the code folder) and are served at /media/<path>.
--   path:      relative path of the main file, e.g. 2026/10/sports-day-a1b2c3.webp
--   variants:  {"sm": {"path": "...", "width": 480, "height": 320}, "md": {...}, "lg": {...}} for images
--   kind:      'image' | 'document'
CREATE TABLE IF NOT EXISTS media (
  id             bigserial PRIMARY KEY,
  path           text NOT NULL UNIQUE,
  original_name  text NOT NULL,
  mime           text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('image', 'document')),
  size           bigint NOT NULL,
  width          int,
  height         int,
  alt            text NOT NULL DEFAULT '',
  title          text NOT NULL DEFAULT '',
  variants       jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by    bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_created_idx ON media (created_at DESC);
CREATE INDEX IF NOT EXISTS media_search_idx ON media (lower(original_name));

-- What uses each file, so "delete if unused" is reliable.
-- Every module calls setMediaUsage(entity, entityId, field, mediaIds) when it saves.
CREATE TABLE IF NOT EXISTS media_usage (
  media_id   bigint NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  entity     text NOT NULL,
  entity_id  text NOT NULL,
  field      text NOT NULL DEFAULT '',
  PRIMARY KEY (media_id, entity, entity_id, field)
);
CREATE INDEX IF NOT EXISTS media_usage_entity_idx ON media_usage (entity, entity_id);

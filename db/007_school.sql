-- ===========================================================================
-- 007 — Faculty & staff, gallery albums, downloads.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS faculty (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL,
  designation     text NOT NULL DEFAULT '',
  department      text NOT NULL DEFAULT '',
  qualifications  text NOT NULL DEFAULT '',
  bio             text NOT NULL DEFAULT '',
  media_id        bigint REFERENCES media(id) ON DELETE SET NULL,
  sort            int NOT NULL DEFAULT 0,
  published       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS faculty_sort_idx ON faculty (sort, name);

CREATE TABLE IF NOT EXISTS gallery_albums (
  id              bigserial PRIMARY KEY,
  title           text NOT NULL,
  slug            text NOT NULL,
  description     text NOT NULL DEFAULT '',
  category        text NOT NULL DEFAULT '',   -- matches a Gallery filter tab (Campus Tour, Classrooms, …)
  cover_media_id  bigint REFERENCES media(id) ON DELETE SET NULL,
  event_date      date,
  sort            int NOT NULL DEFAULT 0,
  published       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS gallery_albums_slug_key ON gallery_albums (lower(slug));

CREATE TABLE IF NOT EXISTS gallery_photos (
  id        bigserial PRIMARY KEY,
  album_id  bigint NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  media_id  bigint NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  caption   text NOT NULL DEFAULT '',
  sort      int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS gallery_photos_album_idx ON gallery_photos (album_id, sort);

-- PDFs for parents: prospectus, fee structure, admission form, uniform list, results…
--   visibility: 'public' (listed on /downloads) | 'hidden' (kept, not listed)
CREATE TABLE IF NOT EXISTS downloads (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'General',
  media_id    bigint NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  visibility  text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  sort        int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

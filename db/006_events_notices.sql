-- ===========================================================================
-- 006 — Events, the academic calendar, and notices.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS events (
  id           bigserial PRIMARY KEY,
  title        text NOT NULL,
  slug         text NOT NULL,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz,
  all_day      boolean NOT NULL DEFAULT false,
  venue        text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  media_id     bigint REFERENCES media(id) ON DELETE SET NULL,
  published    boolean NOT NULL DEFAULT true,
  created_by   bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_key ON events (lower(slug));
CREATE INDEX IF NOT EXISTS events_starts_idx ON events (starts_at);

-- Terms, holidays, exams and other academic dates (date only).
CREATE TABLE IF NOT EXISTS academic_calendar (
  id             bigserial PRIMARY KEY,
  title          text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('term', 'holiday', 'exam', 'other')),
  start_date     date NOT NULL,
  end_date       date,
  academic_year  text NOT NULL DEFAULT '',     -- e.g. 2026-27
  notes          text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academic_calendar_start_idx ON academic_calendar (start_date);

-- Short notices. Shown between start_date and end_date (inclusive); pinned ones appear
-- in the announcement bar at the top of every page.
CREATE TABLE IF NOT EXISTS notices (
  id                   bigserial PRIMARY KEY,
  title                text NOT NULL,
  body                 text NOT NULL DEFAULT '',
  link_url             text NOT NULL DEFAULT '',
  start_date           date NOT NULL DEFAULT CURRENT_DATE,
  end_date             date,
  attachment_media_id  bigint REFERENCES media(id) ON DELETE SET NULL,
  pinned_home          boolean NOT NULL DEFAULT false,
  published            boolean NOT NULL DEFAULT true,
  created_by           bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notices_dates_idx ON notices (start_date, end_date);

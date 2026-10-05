-- ===========================================================================
-- 005 — News & Blog.
-- status: draft | scheduled | published. A post is visible on the site when
-- status <> 'draft' AND published_at <= now() (scheduled posts go live by themselves;
-- the news pages re-render every few minutes).
-- content: Tiptap JSON (rendered to HTML on the server, never raw HTML from the browser).
-- ===========================================================================
CREATE TABLE IF NOT EXISTS posts (
  id                 bigserial PRIMARY KEY,
  title              text NOT NULL DEFAULT '',
  slug               text NOT NULL,
  excerpt            text NOT NULL DEFAULT '',
  content            jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  featured_media_id  bigint REFERENCES media(id) ON DELETE SET NULL,
  author_id          bigint REFERENCES users(id) ON DELETE SET NULL,
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at       timestamptz,
  autosaved_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         bigint REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_key ON posts (lower(slug));
CREATE INDEX IF NOT EXISTS posts_public_idx ON posts (status, published_at DESC);

CREATE TABLE IF NOT EXISTS post_revisions (
  id          bigserial PRIMARY KEY,
  post_id     bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title       text NOT NULL,
  content     jsonb NOT NULL,
  excerpt     text NOT NULL DEFAULT '',
  saved_by    bigint REFERENCES users(id) ON DELETE SET NULL,
  saved_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_revisions_idx ON post_revisions (post_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS categories (
  id     bigserial PRIMARY KEY,
  name   text NOT NULL,
  slug   text NOT NULL UNIQUE,
  sort   int NOT NULL DEFAULT 0
);
INSERT INTO categories (name, slug, sort) VALUES
  ('School News', 'school-news', 0), ('Events', 'events', 1), ('Achievements', 'achievements', 2),
  ('STEM & Robotics', 'stem-robotics', 3), ('Admissions', 'admissions', 4)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS tags (
  id    bigserial PRIMARY KEY,
  name  text NOT NULL,
  slug  text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_categories (
  post_id      bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id  bigint NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
CREATE TABLE IF NOT EXISTS post_tags (
  post_id  bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id   bigint NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

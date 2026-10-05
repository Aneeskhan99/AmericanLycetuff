-- ===========================================================================
-- 050 — Download categories (the editable list used by Admin → Downloads and
-- the order of the groups on /downloads). downloads.category keeps the name.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS download_categories (
  id    bigserial PRIMARY KEY,
  name  text NOT NULL,
  sort  int NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS download_categories_name_key ON download_categories (lower(name));

INSERT INTO download_categories (name, sort) VALUES
  ('Prospectus', 0), ('Fee structure', 1), ('Admission form', 2), ('Uniform list', 3), ('Results', 4), ('Other', 5)
ON CONFLICT DO NOTHING;

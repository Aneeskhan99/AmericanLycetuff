-- ===========================================================================
-- 030 — News & Blog: lookup indexes for the category/tag pages and the admin list.
-- ===========================================================================
CREATE INDEX IF NOT EXISTS post_categories_category_idx ON post_categories (category_id, post_id);
CREATE INDEX IF NOT EXISTS post_tags_tag_idx ON post_tags (tag_id, post_id);
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts (author_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key ON tags (lower(name));

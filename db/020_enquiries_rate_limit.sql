-- ===========================================================================
-- 020 — Lookup index for the public form rate limit (submissions per IP hash
-- in the last few minutes) and for the subscriber list ordering.
-- ===========================================================================
CREATE INDEX IF NOT EXISTS enquiries_ip_idx ON enquiries (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS subscribers_created_idx ON subscribers (created_at DESC);

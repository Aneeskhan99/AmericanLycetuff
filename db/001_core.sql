-- ===========================================================================
-- 001 — Core: admin accounts, sessions, login throttling and the audit log.
--
-- Applied by `npm run db:setup`, which runs every numbered file in db/ that is
-- not yet listed in schema_migrations, each inside its own transaction.
-- Safe to re-run: everything is IF NOT EXISTS.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  name        text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);

-- Admin accounts.
--   role: administrator (everything), editor (all content), author (own posts, cannot publish)
--   password_hash: scrypt$N$r$p$salt-hex$hash-hex (see src/lib/auth.ts and scripts/db-setup.mjs)
CREATE TABLE IF NOT EXISTS users (
  id                    bigserial PRIMARY KEY,
  username              text NOT NULL,
  email                 text NOT NULL DEFAULT '',
  name                  text NOT NULL,
  role                  text NOT NULL DEFAULT 'author'
                        CHECK (role IN ('administrator', 'editor', 'author')),
  password_hash         text NOT NULL,
  must_change_password  boolean NOT NULL DEFAULT false,
  disabled              boolean NOT NULL DEFAULT false,
  last_login_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username));

-- Sessions. The cookie carries the row id plus a random secret; only a SHA-256
-- of the secret is stored, so a leaked database row cannot be replayed.
-- csrf_token is sent to the admin app and must come back on every change.
CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  csrf_token  text NOT NULL,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

-- Every login attempt, for rate limiting (see src/lib/auth.ts: loginAllowed).
CREATE TABLE IF NOT EXISTS login_attempts (
  id            bigserial PRIMARY KEY,
  username      text NOT NULL,
  ip            text NOT NULL,
  success       boolean NOT NULL,
  attempted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_lookup_idx ON login_attempts (ip, attempted_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_user_idx ON login_attempts (lower(username), attempted_at DESC);

-- Who changed what, and when, across the whole admin.
--   entity: 'user', 'page', 'post', 'enquiry', 'setting', ...
--   detail: free-form JSON (changed fields, old/new values where useful)
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  user_id     bigint REFERENCES users(id) ON DELETE SET NULL,
  entity      text NOT NULL,
  entity_id   text,
  action      text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);

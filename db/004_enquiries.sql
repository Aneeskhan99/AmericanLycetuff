-- ===========================================================================
-- 004 — Enquiries from every website form, their workflow, and newsletter subscribers.
-- ===========================================================================
-- form:    'enquire' (admission enquiry) | 'visit' (campus visit booking) | 'contact'
-- status:  new -> contacted -> visit_booked -> enrolled | closed
-- data:    every submitted field, as sent
-- source:  page path, referrer and the five UTM tags captured on the site
CREATE TABLE IF NOT EXISTS enquiries (
  id              bigserial PRIMARY KEY,
  form            text NOT NULL CHECK (form IN ('enquire', 'visit', 'contact')),
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'visit_booked', 'enrolled', 'closed')),
  campus_id       bigint REFERENCES campuses(id) ON DELETE SET NULL,
  name            text NOT NULL,
  phone           text NOT NULL DEFAULT '',
  email           text NOT NULL DEFAULT '',
  child_name      text NOT NULL DEFAULT '',
  grade           text NOT NULL DEFAULT '',
  topic           text NOT NULL DEFAULT '',
  message         text NOT NULL DEFAULT '',
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_to     bigint REFERENCES users(id) ON DELETE SET NULL,
  read_at         timestamptz,
  source_page     text NOT NULL DEFAULT '',
  referrer        text NOT NULL DEFAULT '',
  utm_source      text NOT NULL DEFAULT '',
  utm_medium      text NOT NULL DEFAULT '',
  utm_campaign    text NOT NULL DEFAULT '',
  utm_term        text NOT NULL DEFAULT '',
  utm_content     text NOT NULL DEFAULT '',
  ip_hash         text NOT NULL DEFAULT '',
  user_agent      text NOT NULL DEFAULT '',
  email_status    text NOT NULL DEFAULT '',   -- 'sent' | 'failed: …' | 'skipped (no SMTP)'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_form_idx ON enquiries (form, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_assigned_idx ON enquiries (assigned_to);

-- Notes, status changes and assignments, newest first in the UI.
--   kind: 'note' | 'status' | 'assign' | 'email'
CREATE TABLE IF NOT EXISTS enquiry_activity (
  id          bigserial PRIMARY KEY,
  enquiry_id  bigint NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id     bigint REFERENCES users(id) ON DELETE SET NULL,
  kind        text NOT NULL,
  body        text NOT NULL DEFAULT '',
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enquiry_activity_idx ON enquiry_activity (enquiry_id, created_at DESC);

-- Newsletter sign-ups from the footer form.
CREATE TABLE IF NOT EXISTS subscribers (
  id               bigserial PRIMARY KEY,
  email            text NOT NULL,
  name             text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  source_page      text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_key ON subscribers (lower(email));

-- ===========================================================================
-- 040 — Events: alt text for the event image (the picker lets editors describe
-- the image per event, as on other content).
-- ===========================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_alt text NOT NULL DEFAULT '';

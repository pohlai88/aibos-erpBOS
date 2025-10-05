BEGIN;

-- Extend Post Lock for Revision Sets (M25.2)
-- Extend existing rb_post_lock to track revision sets for idempotency

-- Add revision_set_id column to existing rb_post_lock table
ALTER TABLE rb_post_lock ADD COLUMN revision_set_id TEXT;

-- Create index for revision set lookups
CREATE INDEX rb_post_lock_revision_idx ON rb_post_lock(company_id, revision_set_id) WHERE revision_set_id IS NOT NULL;

COMMIT;

BEGIN;

-- Revenue & Billing Links
ALTER TABLE rb_invoice ADD COLUMN portal_link TEXT; -- cached for emails/portal

COMMIT;

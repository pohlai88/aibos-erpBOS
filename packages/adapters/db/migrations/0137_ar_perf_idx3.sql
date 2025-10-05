BEGIN;

CREATE INDEX IF NOT EXISTS ar_intent_status_idx ON ar_checkout_intent(company_id, status, created_at);
CREATE INDEX IF NOT EXISTS ar_portal_cust_idx ON ar_portal_session(company_id, customer_id, expires_at);

COMMIT;

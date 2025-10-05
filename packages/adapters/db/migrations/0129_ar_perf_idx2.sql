BEGIN;
CREATE INDEX IF NOT EXISTS ar_cust_credit_hold_idx ON ar_customer_credit(company_id, on_hold);
CREATE INDEX IF NOT EXISTS ar_notes_next_action_idx ON ar_collections_note(company_id, next_action_date);
COMMIT;

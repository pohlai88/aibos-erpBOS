BEGIN;

-- Revenue & Billing Performance Indexes
CREATE INDEX rb_subs_bill_idx ON rb_subscription(company_id, bill_anchor, status);
CREATE INDEX rb_usage_event_time_idx ON rb_usage_event(company_id, subscription_id, event_time);

COMMIT;

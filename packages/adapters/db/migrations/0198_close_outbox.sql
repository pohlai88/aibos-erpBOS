-- M26: Outbox Category Additions
-- Add outbox categories for close reminders, flux alerts, and MD&A state changes

-- Add new outbox categories for M26 features
INSERT INTO outbox_category (name, description, retry_policy) VALUES
('CLOSE_REMINDER', 'Close task reminders and SLA alerts', 'exponential_backoff'),
('FLUX_ALERT', 'Flux analysis alerts and notifications', 'exponential_backoff'),
('MDNA_STATE', 'MD&A state changes and publishing events', 'exponential_backoff')
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE outbox_category IS 'Updated with M26 outbox categories for close management';

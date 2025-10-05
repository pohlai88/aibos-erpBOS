-- M26.6: Close Cockpit & SLA Board - Actions Table
-- Audit trail for bulk actions and status changes

CREATE TABLE close_item_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES close_item(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                        -- ACK|REASSIGN|DEFER|COMPLETE|REOPEN
  payload JSONB,
  actor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- M26.6: Close Cockpit & SLA Board - Performance Indexes
-- Optimized indexes for fast filtering and pagination

CREATE INDEX idx_close_item_company_period_process_status ON close_item(company_id, period, process, status);
CREATE INDEX idx_close_item_company_period_owner_sla ON close_item(company_id, period, owner_id, sla_state);
CREATE INDEX idx_close_item_action_item_created ON close_item_action(item_id, created_at DESC);
CREATE INDEX idx_close_item_comment_item_created ON close_item_comment(item_id, created_at DESC);
CREATE INDEX idx_close_item_due_at ON close_item(due_at);
CREATE INDEX idx_close_item_sla_state ON close_item(sla_state);
CREATE INDEX idx_close_item_kind ON close_item(kind);

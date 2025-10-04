-- M26.9: ITGC & UAR Bridge - UAR Campaigns
-- Migration: 0273_uar_campaigns.sql

-- User Access Review campaigns
CREATE TABLE uar_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,           -- UAR-2025Q1
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT|OPEN|ESCALATED|CLOSED
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Individual UAR items (users to be reviewed)
CREATE TABLE uar_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES uar_campaign(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL,
  user_id UUID NOT NULL,
  owner_user_id TEXT NOT NULL,     -- certifier
  snapshot JSONB NOT NULL,         -- grants summary
  state TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|CERTIFIED|REVOKE|EXCEPTION
  decided_by TEXT, 
  decided_at TIMESTAMPTZ,
  exception_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id, system_id)
);

-- Performance indexes
CREATE INDEX idx_uar_campaign_company_status ON uar_campaign(company_id, status);
CREATE INDEX idx_uar_campaign_due_at ON uar_campaign(due_at);
CREATE INDEX idx_uar_campaign_period ON uar_campaign(period_start, period_end);

CREATE INDEX idx_uar_item_campaign_state ON uar_item(campaign_id, state);
CREATE INDEX idx_uar_item_owner ON uar_item(owner_user_id);
CREATE INDEX idx_uar_item_user_system ON uar_item(user_id, system_id);
CREATE INDEX idx_uar_item_decided_at ON uar_item(decided_at) WHERE decided_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE uar_campaign IS 'User Access Review campaigns for quarterly or ad-hoc reviews';
COMMENT ON TABLE uar_item IS 'Individual UAR items requiring certification by owners';
COMMENT ON COLUMN uar_campaign.status IS 'Campaign status: DRAFT, OPEN, ESCALATED, CLOSED';
COMMENT ON COLUMN uar_item.state IS 'Item state: PENDING, CERTIFIED, REVOKE, EXCEPTION';
COMMENT ON COLUMN uar_item.snapshot IS 'Snapshot of user grants at campaign creation time';
COMMENT ON COLUMN uar_item.owner_user_id IS 'Internal user responsible for certifying this item';

-- M28.7: Lease Derecognition - Cross References to FA Module
-- Migration: 0342_cross_refs.sql

-- lease_buyout_fa_link — links to FA module for buyout transfers
CREATE TABLE lease_buyout_fa_link (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exit_id TEXT NOT NULL REFERENCES lease_exit(id) ON DELETE CASCADE,
    fa_asset_id TEXT NOT NULL, -- reference to FA asset (M16 module)
    transfer_amount NUMERIC(18,2) NOT NULL, -- amount transferred to FA
    transfer_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    UNIQUE(exit_id, fa_asset_id)
);

-- Indexes for performance
CREATE INDEX idx_lease_buyout_fa_link_exit ON lease_buyout_fa_link(exit_id);
CREATE INDEX idx_lease_buyout_fa_link_fa ON lease_buyout_fa_link(fa_asset_id);
CREATE INDEX idx_lease_buyout_fa_link_date ON lease_buyout_fa_link(transfer_date);

-- Comments for documentation
COMMENT ON TABLE lease_buyout_fa_link IS 'Links lease buyouts to FA module for asset transfer tracking';
COMMENT ON COLUMN lease_buyout_fa_link.fa_asset_id IS 'Reference to FA asset ID in M16 module';
COMMENT ON COLUMN lease_buyout_fa_link.transfer_amount IS 'Amount transferred from lease to FA asset';
COMMENT ON COLUMN lease_buyout_fa_link.transfer_date IS 'Date of asset transfer to FA module';

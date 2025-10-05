-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Disclosure Extensions
-- Migration: 0321_disclosure_ext3.sql

-- Extend lease_disclosure with sublease & SLB fields
ALTER TABLE lease_disclosure ADD COLUMN sublease_income NUMERIC(15,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN finance_sublease_interest NUMERIC(15,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN nis_closing NUMERIC(15,2) DEFAULT 0; -- net investment in sublease closing balance
ALTER TABLE lease_disclosure ADD COLUMN slb_gains NUMERIC(15,2) DEFAULT 0; -- SLB gains recognized
ALTER TABLE lease_disclosure ADD COLUMN slb_deferred_gain_carry NUMERIC(15,2) DEFAULT 0; -- SLB deferred gain carryforward
ALTER TABLE lease_disclosure ADD COLUMN slb_cash_proceeds NUMERIC(15,2) DEFAULT 0; -- SLB cash proceeds

-- Add comments for clarity
COMMENT ON COLUMN lease_disclosure.sublease_income IS 'Operating sublease income recognized';
COMMENT ON COLUMN lease_disclosure.finance_sublease_interest IS 'Finance sublease interest income';
COMMENT ON COLUMN lease_disclosure.nis_closing IS 'Net investment in sublease closing balance';
COMMENT ON COLUMN lease_disclosure.slb_gains IS 'Sale-and-leaseback gains recognized';
COMMENT ON COLUMN lease_disclosure.slb_deferred_gain_carry IS 'Sale-and-leaseback deferred gain carryforward';
COMMENT ON COLUMN lease_disclosure.slb_cash_proceeds IS 'Sale-and-leaseback cash proceeds received';

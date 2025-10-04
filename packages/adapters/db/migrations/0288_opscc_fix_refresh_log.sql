-- M27: Ops Command Center - Fix Refresh Log Schema
-- Migration: 0288_opscc_fix_refresh_log.sql

-- Add missing columns to kpi_refresh_log table
ALTER TABLE kpi_refresh_log 
ADD COLUMN IF NOT EXISTS refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS rows_affected INTEGER;

-- Update the table structure to match the schema
COMMENT ON COLUMN kpi_refresh_log.refreshed_at IS 'When the materialized view was refreshed';
COMMENT ON COLUMN kpi_refresh_log.rows_affected IS 'Number of rows affected by the refresh';

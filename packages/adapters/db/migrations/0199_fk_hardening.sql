-- M26: Foreign Key Hardening
-- Add foreign key constraints and cascade behaviors for data integrity

-- Add foreign key constraints to M26 tables
-- These ensure referential integrity across the close management system

-- Close Run foreign keys (already defined in 0190)
-- close_task.run_id -> close_run.id (CASCADE)
-- close_dep.run_id -> close_run.id (CASCADE)
-- close_evidence.run_id -> close_run.id (CASCADE)

-- Close Task foreign keys (already defined in 0190)
-- close_dep.task_id -> close_task.id (CASCADE)
-- close_dep.depends_on_task_id -> close_task.id (CASCADE)
-- close_evidence.task_id -> close_task.id (CASCADE)

-- Flux Run foreign keys (already defined in 0192)
-- flux_line.run_id -> flux_run.id (CASCADE)
-- flux_comment.run_id -> flux_run.id (CASCADE)

-- Flux Line foreign keys (already defined in 0192)
-- flux_comment.line_id -> flux_line.id (CASCADE)

-- MD&A foreign keys (already defined in 0193)
-- mdna_draft.template_id -> mdna_template.id (CASCADE)
-- mdna_publish.draft_id -> mdna_draft.id (CASCADE)

-- Close KPI foreign keys (already defined in 0191)
-- close_kpi.run_id -> close_run.id (CASCADE)

-- Add constraints for data integrity

-- Ensure close run periods are valid
ALTER TABLE close_run ADD CONSTRAINT close_run_period_check 
CHECK (year >= 2000 AND year <= 2100 AND month >= 1 AND month <= 12);

-- Ensure close task priorities are reasonable
ALTER TABLE close_task ADD CONSTRAINT close_task_priority_check 
CHECK (priority >= 0 AND priority <= 10);

-- Ensure flux run periods are valid
ALTER TABLE flux_run ADD CONSTRAINT flux_run_period_check 
CHECK (base_year >= 2000 AND base_year <= 2100 AND base_month >= 1 AND base_month <= 12
   AND cmp_year >= 2000 AND cmp_year <= 2100 AND cmp_month >= 1 AND cmp_month <= 12);

-- Ensure flux rule thresholds are positive
ALTER TABLE flux_rule ADD CONSTRAINT flux_rule_threshold_abs_check 
CHECK (threshold_abs IS NULL OR threshold_abs > 0);

ALTER TABLE flux_rule ADD CONSTRAINT flux_rule_threshold_pct_check 
CHECK (threshold_pct IS NULL OR (threshold_pct >= 0 AND threshold_pct <= 1));

-- Ensure close policy values are positive
ALTER TABLE close_policy ADD CONSTRAINT close_policy_materiality_abs_check 
CHECK (materiality_abs > 0);

ALTER TABLE close_policy ADD CONSTRAINT close_policy_materiality_pct_check 
CHECK (materiality_pct > 0 AND materiality_pct <= 1);

ALTER TABLE close_policy ADD CONSTRAINT close_policy_sla_hours_check 
CHECK (sla_default_hours > 0);

ALTER TABLE close_policy ADD CONSTRAINT close_policy_reminder_mins_check 
CHECK (reminder_cadence_mins > 0);

-- Add update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to M26 tables with updated_at columns
CREATE TRIGGER close_run_updated_at_trigger
    BEFORE UPDATE ON close_run
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER close_task_updated_at_trigger
    BEFORE UPDATE ON close_task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER close_policy_updated_at_trigger
    BEFORE UPDATE ON close_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER flux_rule_updated_at_trigger
    BEFORE UPDATE ON flux_rule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER mdna_template_updated_at_trigger
    BEFORE UPDATE ON mdna_template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER mdna_draft_updated_at_trigger
    BEFORE UPDATE ON mdna_draft
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp for M26 tables';

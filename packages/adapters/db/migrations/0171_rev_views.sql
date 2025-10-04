BEGIN;

-- Revenue Recognition Helper Views (M25.1)
-- Optional helper views for auditors and reporting

-- POB to Schedule Trail View
CREATE VIEW rev_pob_schedule_trail AS
SELECT 
    p.id as pob_id,
    p.company_id,
    p.contract_id,
    p.product_id,
    p.name as pob_name,
    p.method,
    p.start_date,
    p.end_date,
    p.allocated_amount,
    p.currency,
    p.status as pob_status,
    s.year,
    s.month,
    s.planned,
    s.recognized,
    s.status as schedule_status,
    s.created_at as schedule_created,
    s.updated_at as schedule_updated
FROM rev_pob p
LEFT JOIN rev_schedule s ON p.id = s.pob_id
ORDER BY p.company_id, p.id, s.year, s.month;

-- Recognition Delta Check View
CREATE VIEW rev_recognition_deltas AS
SELECT 
    s.company_id,
    s.pob_id,
    s.year,
    s.month,
    s.planned,
    s.recognized,
    (s.planned - s.recognized) as delta,
    CASE 
        WHEN s.planned = s.recognized THEN 'BALANCED'
        WHEN s.recognized = 0 THEN 'UNRECOGNIZED'
        WHEN s.recognized < s.planned THEN 'PARTIAL'
        WHEN s.recognized > s.planned THEN 'OVER_RECOGNIZED'
    END as status
FROM rev_schedule s
WHERE s.status IN ('PLANNED', 'PARTIAL')
ORDER BY s.company_id, s.pob_id, s.year, s.month;

COMMIT;
